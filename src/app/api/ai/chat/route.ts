import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DIMENSIONS, DIMENSION_META } from '@/lib/rcsi';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Build a comprehensive data context string from the current database state.
 * This gives the AI real numbers to reference when answering questions.
 */
async function buildDataContext(): Promise<string> {
  const schools = await db.school.findMany({ orderBy: { id: 'asc' } });
  const surveys = await db.surveyScore.findMany({ orderBy: { month: 'asc' } });
  const research = await db.researchRecord.findMany();

  const months = Array.from(new Set(surveys.map(s => s.month))).sort();
  const latestMonth = months[months.length - 1] ?? 'none';
  const latestSurveys = surveys.filter(s => s.month === latestMonth);

  // Division-level summary
  const avgRcsi = latestSurveys.length > 0
    ? latestSurveys.reduce((s, x) => s + x.rcsi, 0) / latestSurveys.length
    : 0;

  const avgDims: Record<string, number> = {};
  for (const d of DIMENSIONS) {
    avgDims[d] = latestSurveys.length > 0
      ? latestSurveys.reduce((s, x) => s + (x as any)[d], 0) / latestSurveys.length
      : 0;
  }

  const milestoneBuckets = [0, 0, 0, 0, 0, 0, 0];
  for (const s of latestSurveys) {
    if (s.milestone >= 0 && s.milestone <= 6) milestoneBuckets[s.milestone]++;
  }

  // Top/bottom 5 schools
  const sortedSchools = [...latestSurveys].sort((a, b) => b.rcsi - a.rcsi);
  const top5 = sortedSchools.slice(0, 5);
  const bottom5 = sortedSchools.slice(-5).reverse();

  // Research summary
  const totalResearch = research.length;
  const published = research.filter(r => r.status === 'published').length;
  const utilized = research.filter(r => r.utilizedBySchool).length;
  const publicationRate = totalResearch > 0 ? published / totalResearch : 0;
  const utilizationRate = totalResearch > 0 ? utilized / totalResearch : 0;

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

  // Top researchers
  const researcherMap = new Map<string, number>();
  for (const r of research) {
    researcherMap.set(r.teacherName, (researcherMap.get(r.teacherName) || 0) + 1);
  }
  const topResearchers = Array.from(researcherMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => `${name} (${count} outputs)`);

  // Trend across quarters
  const trend = months.map(m => {
    const ss = surveys.filter(s => s.month === m);
    const rcsiAvg = ss.length > 0 ? ss.reduce((s, x) => s + x.rcsi, 0) / ss.length : 0;
    return `${m}: RCSI=${rcsiAvg.toFixed(3)}, schools=${ss.length}`;
  });

  const schoolNames = schools.map(s => `${s.name} (ID ${s.id})`).join(', ');

  const context = `
EL SALVADOR DIVISION RCSI DASHBOARD — LIVE DATA CONTEXT
========================================================

SCHOOLS (${schools.length} total):
${schoolNames}

CURRENT QUARTER: ${latestMonth}
Available quarters: ${months.join(', ') || 'none'}

DIVISION SUMMARY (Latest Quarter):
- Average RCSI: ${avgRcsi.toFixed(3)}
- Sub-indices: ${DIMENSIONS.map(d => `${d}=${avgDims[d].toFixed(3)} (${DIMENSION_META[d].name})`).join(', ')}
- Milestone distribution: ${milestoneBuckets.map((c, i) => `M${i}=${c}`).join(', ')}
- Sustainable schools (M6 + RCSI≥0.70): ${milestoneBuckets[6]}

TOP 5 SCHOOLS (by RCSI):
${top5.map((s, i) => `${i+1}. School_${s.schoolId} — RCSI=${s.rcsi.toFixed(3)}, M${s.milestone}, A=${s.A.toFixed(2)}`).join('\n')}

BOTTOM 5 SCHOOLS (by RCSI):
${bottom5.map((s, i) => `${i+1}. School_${s.schoolId} — RCSI=${s.rcsi.toFixed(3)}, M${s.milestone}, A=${s.A.toFixed(2)}`).join('\n')}

RESEARCH SUMMARY:
- Total outputs: ${totalResearch}
- Published: ${published} (${(publicationRate * 100).toFixed(1)}%)
- Utilized: ${utilized} (${(utilizationRate * 100).toFixed(1)}%)
- Status distribution: ${Object.entries(statusCounts).map(([k,v]) => `${k}=${v}`).join(', ')}
- Top themes: ${Object.entries(themeCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}=${v}`).join(', ')}

TOP 10 TEACHER-RESEARCHERS:
${topResearchers.join('\n')}

RCSI TREND ACROSS QUARTERS:
${trend.join('\n')}

RCSI FRAMEWORK REFERENCE:
- 7 sub-indices: R=Readiness(M0), A=Awareness(M1, threshold≥0.80), C=Capacity(M2), S=Structured Support(M3), I=Institutional Anchoring(M4), P=Community of Practice(M5), M=Impact Realization(M6)
- RCSI = equal-weighted average of all 7 (12.5% each)
- Milestone progression is sequential: a school must meet each threshold in order (A≥0.80 for M1, then C≥0.50 for M2, etc.)
- "Sustainable" = M6 reached AND RCSI ≥ 0.70
`.trim();

  return context;
}

const SYSTEM_PROMPT = `You are the AI Research Advisor for the El Salvador Division's Research Culture Sustainability Index (RCSI) dashboard.

Your role is to help school heads, division officials, and policymakers understand the research culture data and make informed decisions.

You have access to LIVE dashboard data (provided below). Always reference real numbers from this data when answering questions. If the data is empty (0 schools), say so honestly.

Guidelines:
1. Be concise but thorough. Use bullet points for lists.
2. Reference specific schools, numbers, and milestones from the data.
3. When recommending interventions, reference the 7 sub-indices (R, A, C, S, I, P, M) and the M0-M6 milestone ladder.
4. The M0→M1 threshold requires Awareness (A) ≥ 0.80. This is the most common bottleneck.
5. If asked about a specific school, look it up in the data. If it's not in the data, say so.
6. Be honest about limitations — you can analyze the data but cannot predict the future with certainty.
7. Use plain language accessible to non-technical decision-makers. Avoid jargon.
8. If the user asks something unrelated to research culture or the dashboard, politely redirect.
9. Keep responses under 300 words unless the user asks for detail.

Remember: you are advising education leaders. Your words may influence budget and policy decisions. Be balanced, evidence-based, and practical.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Build the data context
    const dataContext = await buildDataContext();

    // Prepare the full message list for the LLM
    const llmMessages: ChatMessage[] = [
      { role: 'assistant', content: SYSTEM_PROMPT },
      { role: 'assistant', content: `LIVE DASHBOARD DATA:\n\n${dataContext}` },
      ...messages.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Call the LLM
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: llmMessages,
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json({ error: 'AI returned an empty response' }, { status: 500 });
    }

    return NextResponse.json({
      response,
      sessionId: sessionId || 'default',
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('AI chat error:', e);
    return NextResponse.json(
      { error: 'AI advisor is temporarily unavailable. Please try again.', detail: String(e) },
      { status: 500 }
    );
  }
}
