import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DIMENSIONS } from '@/lib/rcsi';

export async function GET(req: NextRequest) {
  const idStr = req.nextUrl.searchParams.get('id');
  if (!idStr) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const school = await db.school.findUnique({ where: { id } });
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  const surveys = await db.surveyScore.findMany({
    where: { schoolId: id },
    orderBy: { month: 'asc' },
  });
  const research = await db.researchRecord.findMany({
    where: { schoolId: id },
  });

  // Quarterly trend (each dimension over time)
  const trend = surveys.map(s => {
    const dims: Record<string, number> = {};
    for (const d of DIMENSIONS) dims[d] = (s as any)[d];
    return {
      month: s.month,
      rcsi: s.rcsi,
      milestone: s.milestone,
      dims,
    };
  });

  // Latest snapshot
  const latest = surveys[surveys.length - 1];
  const latestDims: Record<string, number> = {};
  if (latest) {
    for (const d of DIMENSIONS) latestDims[d] = (latest as any)[d];
  }

  // Research breakdowns
  const themeCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const yearCounts: Record<string, number> = {};
  for (const r of research) {
    themeCounts[r.theme] = (themeCounts[r.theme] || 0) + 1;
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    const y = String(r.yearUndertaken);
    yearCounts[y] = (yearCounts[y] || 0) + 1;
  }

  return NextResponse.json({
    school: {
      id: school.id,
      name: school.name,
    },
    latest: latest
      ? {
          month: latest.month,
          rcsi: latest.rcsi,
          milestone: latest.milestone,
          dims: latestDims,
        }
      : null,
    trend,
    research: {
      total: research.length,
      published: research.filter(r => r.status === 'published').length,
      utilized: research.filter(r => r.utilizedBySchool).length,
      fullPapers: research.filter(r => r.documentType === 'full_paper').length,
      abstracts: research.filter(r => r.documentType === 'abstract').length,
      themeCounts,
      statusCounts,
      yearCounts,
      records: research.slice(0, 50).map(r => ({
        title: r.title,
        teacher: r.teacherName,
        theme: r.theme,
        status: r.status,
        type: r.documentType,
        year: r.yearUndertaken,
        utilized: r.utilizedBySchool,
        link: r.publicationLink,
      })),
    },
  });
}
