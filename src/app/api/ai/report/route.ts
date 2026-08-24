import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DIMENSIONS, DIMENSION_META } from '@/lib/rcsi';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 90;

/**
 * Generate a comprehensive quarterly narrative report using AI.
 * Fetches all dashboard data, builds a rich context, and asks the LLM
 * to write a 2-3 page report suitable for the Superintendents' meeting.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedMonth = body?.month;

    const schools = await db.school.findMany({ orderBy: { id: 'asc' } });
    const surveys = await db.surveyScore.findMany({ orderBy: { month: 'asc' } });
    const research = await db.researchRecord.findMany();

    const months = Array.from(new Set(surveys.map(s => s.month))).sort();
    const latestMonth = months[months.length - 1] ?? 'none';
    const selectedMonth = requestedMonth && months.includes(requestedMonth) ? requestedMonth : latestMonth;

    if (selectedMonth === 'none' || surveys.length === 0) {
      return NextResponse.json({
        error: 'No survey data available. Upload data first, then generate a report.',
      }, { status: 400 });
    }

    const selectedSurveys = surveys.filter(s => s.month === selectedMonth);
    const selectedIndex = months.indexOf(selectedMonth);
    const previousMonth = selectedIndex > 0 ? months[selectedIndex - 1] : null;
    const previousSurveys = previousMonth ? surveys.filter(s => s.month === previousMonth) : [];

    // Build comprehensive data context
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

    // Previous quarter comparison
    const prevAvgRcsi = previousSurveys.length > 0
      ? previousSurveys.reduce((s, x) => s + x.rcsi, 0) / previousSurveys.length
      : null;
    const rcsiDelta = prevAvgRcsi !== null ? avgRcsi - prevAvgRcsi : 0;

    // School-level changes
    const schoolChanges: string[] = [];
    if (previousMonth) {
      for (const curr of selectedSurveys) {
        const prev = previousSurveys.find(p => p.schoolId === curr.schoolId);
        if (prev && curr.milestone !== prev.milestone) {
          const direction = curr.milestone > prev.milestone ? 'advanced' : 'regressed';
          schoolChanges.push(
            `School_${curr.schoolId}: ${direction} from M${prev.milestone} to M${curr.milestone} (RCSI ${prev.rcsi.toFixed(3)} → ${curr.rcsi.toFixed(3)})`
          );
        }
      }
    }

    // Top/bottom 5
    const sortedSchools = [...selectedSurveys].sort((a, b) => b.rcsi - a.rcsi);
    const top5 = sortedSchools.slice(0, 5);
    const bottom5 = sortedSchools.slice(-5).reverse();

    // Research summary
    const totalResearch = research.length;
    const published = research.filter(r => r.status === 'published').length;
    const utilized = research.filter(r => r.utilizedBySchool).length;
    const publicationRate = totalResearch > 0 ? published / totalResearch : 0;
    const utilizationRate = totalResearch > 0 ? utilized / totalResearch : 0;

    const themeCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    for (const r of research) {
      themeCounts[r.theme] = (themeCounts[r.theme] || 0) + 1;
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    // Top researchers
    const researcherMap = new Map<string, { count: number; rank: string; attainment: string }>();
    for (const r of research) {
      const existing = researcherMap.get(r.teacherName);
      if (existing) {
        existing.count++;
      } else {
        researcherMap.set(r.teacherName, {
          count: 1,
          rank: r.teacherRank,
          attainment: r.educationalAttainment,
        });
      }
    }
    const topResearchers = Array.from(researcherMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, info]) => `${name} — ${info.count} outputs, ${info.rank}, ${info.attainment}`);

    // Trend across all quarters
    const trend = months.map(m => {
      const ss = surveys.filter(s => s.month === m);
      const rcsiAvg = ss.length > 0 ? ss.reduce((s, x) => s + x.rcsi, 0) / ss.length : 0;
      const dims: Record<string, number> = {};
      for (const d of DIMENSIONS) {
        dims[d] = ss.length > 0 ? ss.reduce((s, x) => s + (x as any)[d], 0) / ss.length : 0;
      }
      return `${m}: RCSI=${rcsiAvg.toFixed(3)}, ${DIMENSIONS.map(d => `${d}=${dims[d].toFixed(2)}`).join(', ')}`;
    });

    const dataContext = `
EL SALVADOR DIVISION RCSI DASHBOARD — QUARTERLY REPORT DATA
Report Period: ${selectedMonth}
Previous Quarter: ${previousMonth || 'none (first quarter)'}
Generated: ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

DIVISION SUMMARY:
- Schools reporting: ${selectedSurveys.length} of ${schools.length} total
- Average RCSI: ${avgRcsi.toFixed(3)}
- Previous quarter RCSI: ${prevAvgRcsi !== null ? prevAvgRcsi.toFixed(3) : 'N/A'}
- RCSI change: ${rcsiDelta >= 0 ? '+' : ''}${rcsiDelta.toFixed(3)}
- Milestone distribution: ${milestoneBuckets.map((c, i) => `M${i}=${c}`).join(', ')}
- Sustainable schools: ${milestoneBuckets[6]}

SUB-INDEX AVERAGES (Latest Quarter):
${DIMENSIONS.map(d => `- ${d} (${DIMENSION_META[d].name}, M${DIMENSION_META[d].milestone}): ${avgDims[d].toFixed(3)}${d === 'A' ? ' [threshold for M1: ≥0.80]' : ''}`).join('\n')}

SCHOOL-LEVEL CHANGES VS PREVIOUS QUARTER:
${schoolChanges.length > 0 ? schoolChanges.join('\n') : 'No milestone changes this quarter.'}

TOP 5 SCHOOLS (by RCSI):
${top5.map((s, i) => `${i+1}. School_${s.schoolId} — RCSI=${s.rcsi.toFixed(3)}, M${s.milestone}, A=${s.A.toFixed(2)}, C=${s.C.toFixed(2)}, M=${s.M.toFixed(2)}`).join('\n')}

BOTTOM 5 SCHOOLS (by RCSI):
${bottom5.map((s, i) => `${i+1}. School_${s.schoolId} — RCSI=${s.rcsi.toFixed(3)}, M${s.milestone}, A=${s.A.toFixed(2)}, C=${s.C.toFixed(2)}, M=${s.M.toFixed(2)}`).join('\n')}

RESEARCH SUMMARY:
- Total outputs: ${totalResearch}
- Published: ${published} (${(publicationRate * 100).toFixed(1)}%)
- Utilized: ${utilized} (${(utilizationRate * 100).toFixed(1)}%)
- Status distribution: ${Object.entries(statusCounts).map(([k,v]) => `${k}=${v}`).join(', ')}
- Top themes: ${Object.entries(themeCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}=${v}`).join(', ')}

TOP 10 TEACHER-RESEARCHERS:
${topResearchers.join('\n')}

RCSI TREND ACROSS ALL QUARTERS:
${trend.join('\n')}

RCSI FRAMEWORK:
- 7 sub-indices: R=Readiness(M0), A=Awareness(M1, threshold≥0.80), C=Capacity(M2, threshold≥0.50), S=Structured Support(M3), I=Institutional Anchoring(M4), P=Community of Practice(M5), M=Impact Realization(M6)
- RCSI = equal-weighted average of all 7 (12.5% each), range 0-1
- Milestone progression is sequential
- "Sustainable" = M6 reached AND RCSI ≥ 0.70
- Policy levers: Training Frequency, Mentorship Ratio, Support Budget, Leadership Commitment, Collaboration Frequency
`.trim();

    const reportPrompt = `You are writing the official quarterly report for the El Salvador Division's Research Culture Sustainability Index (RCSI). This report will be presented to the Division Superintendents.

Write a comprehensive, professional quarterly report based on the live data below. The report should be 2-3 pages long and include:

1. **EXECUTIVE SUMMARY** (1 paragraph) — The headline finding for this quarter in plain language.

2. **DIVISION-WIDE PROGRESS** — Compare this quarter to the previous quarter. Did RCSI improve, decline, or stay stable? Which sub-indices changed the most? Reference the actual numbers.

3. **MILESTONE ANALYSIS** — How many schools are at each milestone (M0-M6)? Did any schools advance or regress? Which schools are closest to advancing?

4. **RESEARCH PIPELINE** — Analyze the research outputs: publication rate, utilization rate, theme distribution, and pipeline bottlenecks. Reference the Top 10 Teacher-Researchers.

5. **SCHOOL HIGHLIGHTS** — Name the top 3 and bottom 3 schools with their specific RCSI scores and dimension profiles. Explain WHY they are top/bottom based on their sub-index values.

6. **RECOMMENDED INTERVENTIONS** — 3-5 specific, actionable recommendations for next quarter, aligned to the M0-M6 milestone ladder. Reference the policy levers (Training Frequency, Mentorship Ratio, etc.) and which schools/school groups should receive each intervention.

7. **CONCLUSION** — A forward-looking closing paragraph.

Format the report in clear Markdown with headers (##) for each section. Use bullet points where appropriate. Reference specific schools and numbers throughout. Be honest about challenges but constructive in tone.

If the data shows this is the first quarter (no previous quarter), adapt the narrative accordingly — focus on establishing the baseline rather than comparing.

LIVE DASHBOARD DATA:
${dataContext}`;

    // Call the LLM
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are an expert education policy analyst and report writer for the Philippine Department of Education.' },
        { role: 'user', content: reportPrompt },
      ],
      thinking: { type: 'disabled' },
    });

    const report = completion.choices[0]?.message?.content;

    if (!report) {
      return NextResponse.json({ error: 'AI returned an empty report' }, { status: 500 });
    }

    return NextResponse.json({
      report,
      period: selectedMonth,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Quarterly report generation error:', e);
    return NextResponse.json(
      { error: 'Report generation failed. Please try again.', detail: String(e) },
      { status: 500 }
    );
  }
}
