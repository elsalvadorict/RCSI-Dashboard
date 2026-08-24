import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import { computeRcsi, classifyMilestone } from '@/lib/rcsi';
import { acquireUploadLock, releaseUploadLock } from '@/lib/uploadMutex';

export const runtime = 'nodejs';

const SURVEY_COLS = ['month', 'school_id_no', 'school_name', 'R', 'A', 'C', 'S', 'I', 'P', 'M'];
const RESEARCH_COLS = [
  'upload_date', 'teacher_name', 'school_id_no', 'document_type', 'title', 'theme',
  'status', 'publication_link', 'utilized_by_school', 'utilization_date',
  'year_undertaken', 'years_of_service', 'teacher_rank', 'educational_attainment',
];

interface ParsedFile {
  fileName: string;
  detectedKind: 'survey' | 'research' | 'unknown';
  rows: Record<string, string>[];
  errors: string[];
  warnings: string[];
}

function detectKind(headers: string[]): 'survey' | 'research' | 'unknown' {
  const set = new Set(headers.map(h => h.toLowerCase().trim()));
  const surveyMatch = SURVEY_COLS.filter(c => set.has(c.toLowerCase())).length;
  const researchMatch = RESEARCH_COLS.filter(c => set.has(c.toLowerCase())).length;
  if (surveyMatch >= 7 && surveyMatch > researchMatch) return 'survey';
  if (researchMatch >= 8 && researchMatch > surveyMatch) return 'research';
  return 'unknown';
}

function parseSpreadsheet(file: Buffer, fileName: string): ParsedFile {
  const wb = XLSX.read(file, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  const normalized = rows.map(r => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      out[k.trim()] = String(v ?? '');
    }
    return out;
  });
  const headers = normalized.length > 0 ? Object.keys(normalized[0]) : [];
  const kind = detectKind(headers);
  const errors: string[] = [];
  const warnings: string[] = [];
  const expected = kind === 'survey' ? SURVEY_COLS : kind === 'research' ? RESEARCH_COLS : [];
  for (const c of expected) {
    if (!headers.find(h => h.toLowerCase() === c.toLowerCase())) {
      errors.push(`Missing required column: ${c}`);
    }
  }
  if (normalized.length === 0) errors.push('File has no data rows');
  return { fileName, detectedKind: kind, rows: normalized, errors, warnings };
}

function parseCsv(file: Buffer, fileName: string): ParsedFile {
  const text = file.toString('utf-8');
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
  });
  const headers = parsed.meta.fields ?? [];
  const kind = detectKind(headers);
  const errors: string[] = [];
  const warnings: string[] = [];
  const expected = kind === 'survey' ? SURVEY_COLS : kind === 'research' ? RESEARCH_COLS : [];
  for (const c of expected) {
    if (!headers.find(h => h.toLowerCase() === c.toLowerCase())) {
      errors.push(`Missing required column: ${c}`);
    }
  }
  if (parsed.data.length === 0) errors.push('File has no data rows');
  for (const e of parsed.errors.slice(0, 5)) {
    warnings.push(`Parse warning: ${e.message} (row ${e.row})`);
  }
  return { fileName, detectedKind: kind, rows: parsed.data, errors, warnings };
}

export async function GET() {
  const batches = await db.uploadBatch.findMany({
    orderBy: { timestamp: 'desc' },
    take: 50,
  });
  return NextResponse.json({ batches });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form.getAll('files');
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
  }

  const mode = (form.get('mode') as string) || 'validate';

  // Parse all files
  const parsedFiles: ParsedFile[] = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const name = f.name.toLowerCase();
    let parsed: ParsedFile;
    if (name.endsWith('.csv') || name.endsWith('.tsv')) {
      parsed = parseCsv(buf, f.name);
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      parsed = parseSpreadsheet(buf, f.name);
    } else {
      parsed = {
        fileName: f.name,
        detectedKind: 'unknown',
        rows: [],
        errors: ['Unsupported file type. Please upload .csv, .xlsx, or .xls'],
        warnings: [],
      };
    }
    parsedFiles.push(parsed);
  }

  // Validate mode — return preview
  if (mode === 'validate') {
    return NextResponse.json({
      mode: 'validate',
      files: parsedFiles.map(p => ({
        fileName: p.fileName,
        detectedKind: p.detectedKind,
        rowCount: p.rows.length,
        errors: p.errors,
        warnings: p.warnings,
        preview: p.rows.slice(0, 5),
      })),
    });
  }

  // Commit mode — check for errors first
  if (parsedFiles.some(p => p.errors.length > 0)) {
    return NextResponse.json(
      { error: 'Cannot commit — one or more files have validation errors', files: parsedFiles },
      { status: 400 }
    );
  }

  // Acquire upload lock
  const firstFileName = parsedFiles[0]?.fileName ?? 'unknown';
  if (!acquireUploadLock(firstFileName)) {
    return NextResponse.json(
      {
        error: 'Another upload is currently in progress. Please wait a moment and try again.',
        retryAfter: 5,
      },
      { status: 409, headers: { 'Retry-After': '5' } }
    );
  }

  try {
    const result = await db.$transaction(async (tx) => {
      let surveysInserted = 0;
      let surveysUpdated = 0;
      let researchInserted = 0;
      let researchUpdated = 0;
      let researchSkipped = 0;
      const schoolIds = new Set<number>();
      const batchIds: string[] = [];

      if (mode === 'replace') {
        await tx.surveyScore.deleteMany();
        await tx.researchRecord.deleteMany();
        await tx.school.deleteMany();
      }

      for (const p of parsedFiles) {
        const batch = await tx.uploadBatch.create({
          data: {
            mode,
            fileName: p.fileName,
            detectedKind: p.detectedKind,
            rowCount: p.rows.length,
            inserted: 0,
            updated: 0,
            skipped: 0,
            status: 'success',
          },
        });
        batchIds.push(batch.id);

        if (p.detectedKind === 'survey') {
          for (const row of p.rows) {
            const name = row.school_name || `School_${row.school_id_no}`;
            const m = /(\d+)$/.exec(name);
            const sid = m ? parseInt(m[1], 10) : parseInt(row.school_id_no, 10);
            if (Number.isNaN(sid)) continue;

            if (!schoolIds.has(sid)) {
              await tx.school.upsert({
                where: { id: sid },
                update: { name },
                create: { id: sid, name },
              });
              schoolIds.add(sid);
            }

            const v = {
              R: parseFloat(row.R) || 0,
              A: parseFloat(row.A) || 0,
              C: parseFloat(row.C) || 0,
              S: parseFloat(row.S) || 0,
              I: parseFloat(row.I) || 0,
              P: parseFloat(row.P) || 0,
              M: parseFloat(row.M) || 0,
            };
            const rcsi = computeRcsi(v);
            const { milestone } = classifyMilestone(v);

            const existing = await tx.surveyScore.findUnique({
              where: { schoolId_month: { schoolId: sid, month: row.month } },
            });

            if (existing) {
              await tx.surveyScore.update({
                where: { id: existing.id },
                data: { ...v, rcsi, milestone },
              });
              surveysUpdated++;
            } else {
              await tx.surveyScore.create({
                data: { schoolId: sid, month: row.month, ...v, rcsi, milestone },
              });
              surveysInserted++;
            }
          }
        } else if (p.detectedKind === 'research') {
          for (const row of p.rows) {
            const sid = parseInt(row.school_id_no, 10);
            if (Number.isNaN(sid)) {
              researchSkipped++;
              continue;
            }
            if (!schoolIds.has(sid)) {
              const name = `School_${sid}`;
              await tx.school.upsert({
                where: { id: sid },
                update: {},
                create: { id: sid, name },
              });
              schoolIds.add(sid);
            }

            const yearUndertaken = parseInt(row.year_undertaken, 10) || 0;
            const data = {
              uploadDate: row.upload_date || '',
              teacherName: row.teacher_name || '',
              schoolId: sid,
              documentType: row.document_type || 'abstract',
              title: row.title || '',
              theme: row.theme || 'Others',
              status: row.status || 'draft',
              publicationLink: row.publication_link || null,
              utilizedBySchool: String(row.utilized_by_school).toLowerCase() === 'true',
              utilizationDate: row.utilization_date || null,
              yearUndertaken,
              yearsOfService: parseInt(row.years_of_service, 10) || 0,
              teacherRank: row.teacher_rank || 'Teacher I',
              educationalAttainment: row.educational_attainment || "Bachelor's",
              batchId: batch.id,
            };

            try {
              const existing = await tx.researchRecord.findUnique({
                where: {
                  teacherName_title_yearUndertaken: {
                    teacherName: data.teacherName,
                    title: data.title,
                    yearUndertaken,
                  },
                },
              });

              if (existing) {
                await tx.researchRecord.update({
                  where: { id: existing.id },
                  data,
                });
                researchUpdated++;
              } else {
                await tx.researchRecord.create({ data });
                researchInserted++;
              }
            } catch {
              researchSkipped++;
            }
          }
        }

        const inserted = p.detectedKind === 'survey' ? surveysInserted : researchInserted;
        const updated = p.detectedKind === 'survey' ? surveysUpdated : researchUpdated;
        await tx.uploadBatch.update({
          where: { id: batch.id },
          data: { inserted, updated, skipped: researchSkipped },
        });
      }

      return {
        surveysInserted,
        surveysUpdated,
        researchInserted,
        researchUpdated,
        researchSkipped,
        schoolsAffected: schoolIds.size,
        batchIds,
      };
    });

    return NextResponse.json({
      mode,
      ...result,
    });
  } catch (e) {
    try {
      await db.uploadBatch.create({
        data: {
          mode,
          fileName: firstFileName,
          detectedKind: 'unknown',
          rowCount: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          status: 'failed',
          error: String(e),
        },
      });
    } catch { /* ignore logging errors */ }
    return NextResponse.json(
      { error: 'Upload failed', detail: String(e) },
      { status: 500 }
    );
  } finally {
    releaseUploadLock();
  }
}
