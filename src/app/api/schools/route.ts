import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DIMENSIONS } from '@/lib/rcsi';

export async function GET() {
  const schools = await db.school.findMany({ orderBy: { id: 'asc' } });
  const surveys = await db.surveyScore.findMany({ orderBy: { month: 'asc' } });
  const research = await db.researchRecord.findMany();

  // Group surveys by schoolId
  const surveysBySchool = new Map<number, typeof surveys>();
  for (const s of surveys) {
    const arr = surveysBySchool.get(s.schoolId) ?? [];
    arr.push(s);
    surveysBySchool.set(s.schoolId, arr);
  }

  // Group research by schoolId
  const researchBySchool = new Map<number, typeof research>();
  for (const r of research) {
    const arr = researchBySchool.get(r.schoolId) ?? [];
    arr.push(r);
    researchBySchool.set(r.schoolId, arr);
  }

  const rows = schools.map(school => {
    const ss = surveysBySchool.get(school.id) ?? [];
    const rr = researchBySchool.get(school.id) ?? [];
    const latest = ss[ss.length - 1];
    const sparkline = ss.map(x => Number(x.rcsi.toFixed(4)));
    const dims: Record<string, number> = {};
    for (const d of DIMENSIONS) dims[d] = latest ? (latest as any)[d] : 0;
    return {
      id: school.id,
      name: school.name,
      rcsi: latest ? Number(latest.rcsi.toFixed(4)) : 0,
      milestone: latest ? latest.milestone : 0,
      sustainable: latest ? latest.milestone >= 6 && latest.rcsi >= 0.7 : false,
      dims,
      sparkline,
      surveyCount: ss.length,
      researchCount: rr.length,
      publishedCount: rr.filter(r => r.status === 'published').length,
      utilizedCount: rr.filter(r => r.utilizedBySchool).length,
    };
  });

  return NextResponse.json({ schools: rows });
}
