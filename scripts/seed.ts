/**
 * Seed the database from the two CSV files in /home/z/my-project/upload/.
 * Idempotent: wipes SurveyScore and ResearchRecord before re-inserting.
 *
 * Usage:  bun run scripts/seed.ts
 */
import { db } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import { computeRcsi, classifyMilestone } from '../src/lib/rcsi';

const UPLOAD_DIR = '/home/z/my-project/upload';

// Schools with id > 14 in the source file appear to be renumbered (1, 2, 3, ...).
// The school_id_no column is authoritative even when it looks suspicious — we trust the file.
interface SurveyRaw {
  month: string;
  school_id_no: string;
  school_name: string;
  R: string;
  A: string;
  C: string;
  S: string;
  I: string;
  P: string;
  M: string;
}

interface ResearchRaw {
  upload_date: string;
  teacher_name: string;
  school_id_no: string;
  document_type: string;
  title: string;
  theme: string;
  status: string;
  publication_link: string;
  utilized_by_school: string;
  utilization_date: string;
  year_undertaken: string;
  years_of_service: string;
  teacher_rank: string;
  educational_attainment: string;
}

function parseCsv<T>(file: string): T[] {
  const csvPath = path.join(UPLOAD_DIR, file);
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse<T>(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    console.warn(`[warn] ${parsed.errors.length} parse errors in ${file}:`, parsed.errors.slice(0, 3));
  }
  return parsed.data;
}

async function seed() {
  console.log('→ Wiping existing data…');
  await db.surveyScore.deleteMany();
  await db.researchRecord.deleteMany();
  await db.school.deleteMany();

  // ---------- 1. Surveys ----------
  const surveyRows = parseCsv<SurveyRaw>('quarterly_survey_data (1).csv');
  console.log(`→ Parsed ${surveyRows.length} survey rows`);

  // Collect distinct schools. The canonical ID is derived from the school_name
  // suffix (School_1 -> 1, School_30 -> 30) so that it matches the IDs used
  // in research_metadata.csv. The raw school_id_no column in the survey file
  // is inconsistent for some schools (e.g. School_15 uses 304105 in Q1 then
  // 15 afterwards), so we cannot trust it as a key.
  const schoolMap = new Map<number, string>();
  for (const row of surveyRows) {
    const name = row.school_name || `School_${row.school_id_no}`;
    const m = /(\d+)$/.exec(name);
    const sid = m ? parseInt(m[1], 10) : parseInt(row.school_id_no, 10);
    if (!Number.isNaN(sid) && !schoolMap.has(sid)) {
      schoolMap.set(sid, name);
    }
  }
  console.log(`→ Found ${schoolMap.size} distinct schools`);

  // Insert schools
  for (const [id, name] of schoolMap.entries()) {
    await db.school.upsert({ where: { id }, update: { name }, create: { id, name } });
  }

  // Insert survey scores
  let surveyInserted = 0;
  for (const row of surveyRows) {
    // Use canonical ID from school_name suffix (see note above)
    const name = row.school_name || `School_${row.school_id_no}`;
    const m = /(\d+)$/.exec(name);
    const sid = m ? parseInt(m[1], 10) : parseInt(row.school_id_no, 10);
    if (Number.isNaN(sid)) continue;
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
    await db.surveyScore.create({
      data: {
        schoolId: sid,
        month: row.month,
        ...v,
        rcsi,
        milestone,
      },
    });
    surveyInserted++;
  }
  console.log(`→ Inserted ${surveyInserted} survey scores`);

  // ---------- 2. Research metadata ----------
  const researchRows = parseCsv<ResearchRaw>('research_metadata (1).csv');
  console.log(`→ Parsed ${researchRows.length} research rows`);

  // Research file may reference school_id_no values not in the survey file.
  // For any unknown school, create a stub School entry.
  for (const row of researchRows) {
    const sid = parseInt(row.school_id_no, 10);
    if (Number.isNaN(sid)) continue;
    if (!schoolMap.has(sid)) {
      const name = `School_${sid}`;
      await db.school.upsert({ where: { id: sid }, update: {}, create: { id: sid, name } });
      schoolMap.set(sid, name);
    }
  }

  let researchInserted = 0;
  for (const row of researchRows) {
    const sid = parseInt(row.school_id_no, 10);
    if (Number.isNaN(sid)) continue;
    await db.researchRecord.create({
      data: {
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
        yearUndertaken: parseInt(row.year_undertaken, 10) || 0,
        yearsOfService: parseInt(row.years_of_service, 10) || 0,
        teacherRank: row.teacher_rank || 'Teacher I',
        educationalAttainment: row.educational_attainment || "Bachelor's",
      },
    });
    researchInserted++;
  }
  console.log(`→ Inserted ${researchInserted} research records`);

  console.log('✓ Seed complete');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
