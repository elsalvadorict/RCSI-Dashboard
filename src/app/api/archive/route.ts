import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DIMENSIONS } from '@/lib/rcsi';

export async function GET(req: NextRequest) {
  const exportFormat = req.nextUrl.searchParams.get('export');
  const month = req.nextUrl.searchParams.get('month');

  // ── Export mode: return raw CSV for a specific quarter ──
  if (exportFormat === 'survey' && month) {
    const surveys = await db.surveyScore.findMany({
      where: { month },
      orderBy: { schoolId: 'asc' },
      include: { school: true },
    });
    const headers = ['month', 'school_id_no', 'school_name', 'R', 'A', 'C', 'S', 'I', 'P', 'M'];
    const lines = [headers.join(',')];
    for (const s of surveys) {
      lines.push([
        s.month, s.schoolId, s.school.name,
        s.R, s.A, s.C, s.S, s.I, s.P, s.M,
      ].join(','));
    }
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="survey_${month}.csv"`,
      },
    });
  }

  if (exportFormat === 'research') {
    const research = await db.researchRecord.findMany({ orderBy: { id: 'asc' } });
    const headers = [
      'upload_date', 'teacher_name', 'school_id_no', 'document_type', 'title', 'theme',
      'status', 'publication_link', 'utilized_by_school', 'utilization_date',
      'year_undertaken', 'years_of_service', 'teacher_rank', 'educational_attainment',
    ];
    const lines = [headers.join(',')];
    for (const r of research) {
      const fields = [
        r.uploadDate, r.teacherName, r.schoolId, r.documentType, r.title, r.theme,
        r.status, r.publicationLink || '', r.utilizedBySchool, r.utilizationDate || '',
        r.yearUndertaken, r.yearsOfService, r.teacherRank, r.educationalAttainment,
      ];
      // Escape CSV fields
      const escaped = fields.map(f => {
        const s = String(f ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      });
      lines.push(escaped.join(','));
    }
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="research_metadata_full.csv"',
      },
    });
  }

  // ── Default: return the archive overview ──
  const batches = await db.uploadBatch.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  // Quarter summary
  const surveys = await db.surveyScore.findMany();
  const months = Array.from(new Set(surveys.map(s => s.month))).sort();
  const quarterSummary = months.map(m => {
    const ss = surveys.filter(s => s.month === m);
    const schoolIds = new Set(ss.map(s => s.schoolId));
    const avgRcsi = ss.length > 0 ? ss.reduce((sum, s) => sum + s.rcsi, 0) / ss.length : 0;
    const milestones = [0, 0, 0, 0, 0, 0, 0];
    for (const s of ss) {
      if (s.milestone >= 0 && s.milestone <= 6) milestones[s.milestone]++;
    }
    return {
      month: m,
      schoolCount: schoolIds.size,
      avgRcsi: Number(avgRcsi.toFixed(4)),
      milestoneBuckets: milestones,
    };
  });

  const researchCount = await db.researchRecord.count();
  const schoolCount = await db.school.count();

  return NextResponse.json({
    batches,
    quarterSummary,
    researchCount,
    schoolCount,
    totalQuarters: months.length,
  });
}
