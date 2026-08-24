import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DIMENSIONS } from '@/lib/rcsi';

export async function GET(req: NextRequest) {
  const requestedMonth = req.nextUrl.searchParams.get('month');

  const schools = await db.school.count();
  const surveys = await db.surveyScore.findMany({ orderBy: { month: 'asc' } });
  const research = await db.researchRecord.findMany();

  // All available months (quarters) in the database
  const months = Array.from(new Set(surveys.map(s => s.month))).sort();
  const latestMonth = months[months.length - 1] ?? '0';

  // Use the requested month if provided and valid, otherwise latest
  const selectedMonth = requestedMonth && months.includes(requestedMonth) ? requestedMonth : latestMonth;
  const selectedSurveys = surveys.filter(s => s.month === selectedMonth);

  // Count schools that actually have data for the selected quarter
  const schoolsWithData = new Set(selectedSurveys.map(s => s.schoolId)).size;

  // Find the previous quarter (for historical comparison)
  const selectedIndex = months.indexOf(selectedMonth);
  const previousMonth = selectedIndex > 0 ? months[selectedIndex - 1] : null;
  const previousSurveys = previousMonth ? surveys.filter(s => s.month === previousMonth) : [];

  // ── Current quarter KPIs ──
  const avgRcsi = selectedSurveys.length > 0
    ? selectedSurveys.reduce((s, x) => s + x.rcsi, 0) / selectedSurveys.length
    : 0;

  const avgDims: Record<string, number> = {};
  for (const d of DIMENSIONS) {
    avgDims[d] = selectedSurveys.length > 0
      ? selectedSurveys.reduce((s, x) => s + (x as any)[d], 0) / selectedSurveys.length
      : 0;
  }

  const milestoneBuckets = [0, 0, 0, 0, 0, 0, 0];
  for (const s of selectedSurveys) {
    if (s.milestone >= 0 && s.milestone <= 6) milestoneBuckets[s.milestone]++;
  }
  const sustainableCount = milestoneBuckets[6];

  // ── Previous quarter KPIs (for comparison) ──
  const prevAvgRcsi = previousSurveys.length > 0
    ? previousSurveys.reduce((s, x) => s + x.rcsi, 0) / previousSurveys.length
    : null;

  const prevAvgDims: Record<string, number | null> = {};
  for (const d of DIMENSIONS) {
    prevAvgDims[d] = previousSurveys.length > 0
      ? previousSurveys.reduce((s, x) => s + (x as any)[d], 0) / previousSurveys.length
      : null;
  }

  const prevMilestoneBuckets = [0, 0, 0, 0, 0, 0, 0];
  for (const s of previousSurveys) {
    if (s.milestone >= 0 && s.milestone <= 6) prevMilestoneBuckets[s.milestone]++;
  }

  // ── Trend across ALL quarters (division-wide average per quarter) ──
  const trend = months.map(m => {
    const ss = surveys.filter(s => s.month === m);
    const rcsiAvg = ss.length > 0 ? ss.reduce((s, x) => s + x.rcsi, 0) / ss.length : 0;
    const dims: Record<string, number> = {};
    for (const d of DIMENSIONS) {
      dims[d] = ss.length > 0 ? ss.reduce((s, x) => s + (x as any)[d], 0) / ss.length : 0;
    }
    return { month: m, rcsi: rcsiAvg, dims };
  });

  // ── Research KPIs (filter by year_undertaken matching the selected quarter's year) ──
  const selectedYear = parseInt(selectedMonth.split('-')[0] ?? '2026', 10);
  // For research, we show ALL records (not filtered by quarter) because research
  // metadata is not quarterly — it accumulates over time. But we compute the
  // previous-year research KPIs for comparison.
  const totalResearch = research.length;
  const published = research.filter(r => r.status === 'published').length;
  const publicationRate = totalResearch > 0 ? published / totalResearch : 0;
  const utilized = research.filter(r => r.utilizedBySchool).length;
  const utilizationRate = totalResearch > 0 ? utilized / totalResearch : 0;
  const fullPapers = research.filter(r => r.documentType === 'full_paper').length;
  const abstracts = research.filter(r => r.documentType === 'abstract').length;

  // Theme distribution
  const themeCounts: Record<string, number> = {};
  for (const r of research) {
    themeCounts[r.theme] = (themeCounts[r.theme] || 0) + 1;
  }

  // Status distribution
  const statusCounts: Record<string, number> = {};
  for (const r of research) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  // Theme x Status matrix
  const themes = Object.keys(themeCounts).sort();
  const statuses = ['draft', 'under_review', 'submitted', 'published', 'rejected'];
  const matrix: Record<string, Record<string, number>> = {};
  for (const t of themes) {
    matrix[t] = {};
    for (const s of statuses) matrix[t][s] = 0;
  }
  for (const r of research) {
    if (matrix[r.theme]) matrix[r.theme][r.status]++;
  }

  // Teacher rank x educational attainment heatmap
  const ranks = ['Teacher I', 'Teacher II', 'Teacher III', 'Master Teacher I', 'Master Teacher II', 'School Head'];
  const educations = ["Bachelor's", "Master's", "Doctorate"];
  const heatmap: Record<string, Record<string, number>> = {};
  for (const rk of ranks) {
    heatmap[rk] = {};
    for (const ed of educations) heatmap[rk][ed] = 0;
  }
  for (const r of research) {
    if (heatmap[r.teacherRank] && r.educationalAttainment in heatmap[r.teacherRank]) {
      heatmap[r.teacherRank][r.educationalAttainment]++;
    }
  }

  // Research outputs per year
  const yearCounts: Record<string, number> = {};
  for (const r of research) {
    const y = String(r.yearUndertaken);
    yearCounts[y] = (yearCounts[y] || 0) + 1;
  }
  const yearTrend = Object.entries(yearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));

  // ── School-level changes (for historical narrative) ──
  // Which schools advanced a milestone vs last quarter?
  const schoolChanges: { schoolId: number; schoolName: string; prevMilestone: number; currMilestone: number; rcsiDelta: number }[] = [];
  if (previousMonth) {
    for (const curr of selectedSurveys) {
      const prev = previousSurveys.find(p => p.schoolId === curr.schoolId);
      if (prev) {
        if (curr.milestone !== prev.milestone || Math.abs(curr.rcsi - prev.rcsi) > 0.001) {
          schoolChanges.push({
            schoolId: curr.schoolId,
            schoolName: '', // filled by caller
            prevMilestone: prev.milestone,
            currMilestone: curr.milestone,
            rcsiDelta: curr.rcsi - prev.rcsi,
          });
        }
      }
    }
  }

  // ── Top 10 Teacher-Researchers (by research output count) ──
  const researcherMap = new Map<string, {
    teacherName: string;
    count: number;
    yearsOfService: number;
    teacherRank: string;
    educationalAttainment: string;
    schoolIds: Set<number>;
    yearsUndertaken: number[];
    themes: Set<string>;
  }>();

  for (const r of research) {
    const key = r.teacherName;
    if (!researcherMap.has(key)) {
      researcherMap.set(key, {
        teacherName: r.teacherName,
        count: 0,
        yearsOfService: r.yearsOfService,
        teacherRank: r.teacherRank,
        educationalAttainment: r.educationalAttainment,
        schoolIds: new Set(),
        yearsUndertaken: [],
        themes: new Set(),
      });
    }
    const entry = researcherMap.get(key)!;
    entry.count++;
    entry.schoolIds.add(r.schoolId);
    entry.yearsUndertaken.push(r.yearUndertaken);
    entry.themes.add(r.theme);
  }

  const topResearchers = Array.from(researcherMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(r => ({
      teacherName: r.teacherName,
      researchCount: r.count,
      yearsOfService: r.yearsOfService,
      teacherRank: r.teacherRank,
      educationalAttainment: r.educationalAttainment,
      schoolCount: r.schoolIds.size,
      yearsUndertaken: Array.from(new Set(r.yearsUndertaken)).sort(),
      themes: Array.from(r.themes).sort(),
    }));

  return NextResponse.json({
    schoolCount: schoolsWithData,
    totalSchoolsInDb: schools,
    selectedMonth,
    latestMonth,
    months,
    previousMonth,
    kpis: {
      avgRcsi,
      sustainableCount,
      totalResearch,
      publicationRate,
      utilizationRate,
      fullPapers,
      abstracts,
      publishedCount: published,
      utilizedCount: utilized,
    },
    avgDims,
    milestoneBuckets,
    // Historical comparison data
    comparison: previousMonth ? {
      previousMonth,
      prevAvgRcsi,
      prevAvgDims,
      prevMilestoneBuckets,
      rcsiDelta: avgRcsi - (prevAvgRcsi ?? 0),
      schoolChanges: schoolChanges.length,
      schoolsAdvanced: schoolChanges.filter(c => c.currMilestone > c.prevMilestone).length,
      schoolsRegressed: schoolChanges.filter(c => c.currMilestone < c.prevMilestone).length,
    } : null,
    trend,
    themeCounts,
    statusCounts,
    matrix: { themes, statuses, data: matrix },
    heatmap: { ranks, educations, data: heatmap },
    yearTrend,
    topResearchers,
  });
}
