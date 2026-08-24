/**
 * Narrative generators for the four sandboxes.
 *
 * Each generator takes the panel's data and returns a structured narrative
 * oriented toward the 7-milestone progression (M0 = Readiness → M6 = Impact
 * Realization). The output is meant for non-technical decision-makers at the
 * division level.
 */
import { DIMENSION_META, DIMENSIONS, Dimension } from './rcsi';
import { OverviewData, SchoolRow, TwinResult } from './types';

// ---------- helpers ----------

function fmtPct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

function fmtNum(v: number, digits = 3): string {
  return v.toFixed(digits);
}

/** Return the dimension key with the lowest average value. */
function weakestDimension(dims: Record<string, number>): Dimension {
  let min = Infinity;
  let weakest: Dimension = 'R';
  for (const d of DIMENSIONS) {
    if ((dims[d] ?? 1) < min) {
      min = dims[d] ?? 1;
      weakest = d as Dimension;
    }
  }
  return weakest;
}

/** Return the dimension key with the highest average value. */
function strongestDimension(dims: Record<string, number>): Dimension {
  let max = -Infinity;
  let strongest: Dimension = 'R';
  for (const d of DIMENSIONS) {
    if ((dims[d] ?? 0) > max) {
      max = dims[d] ?? 0;
      strongest = d as Dimension;
    }
  }
  return strongest as Dimension;
}

/** Distance from a dimension's current value to a target (e.g. 0.80 for A). */
function gapToTarget(current: number, target: number): number {
  return Math.max(0, target - current);
}

// ---------- Overview narrative ----------

export interface Narrative {
  tone: 'insight' | 'success' | 'warning' | 'danger';
  title: string;
  insights: string[];
  recommendation: string;
}

export function buildOverviewNarrative(data: OverviewData): Narrative {
  const { kpis, avgDims, milestoneBuckets, schoolCount, comparison } = data;
  const weak = weakestDimension(avgDims);
  const strong = strongestDimension(avgDims);
  const weakMeta = DIMENSION_META[weak];
  const strongMeta = DIMENSION_META[strong];

  // Count schools below M1
  const atM0 = milestoneBuckets[0] ?? 0;
  const atM1Plus = milestoneBuckets.slice(1).reduce((s, v) => s + v, 0);
  const sustainable = milestoneBuckets[6] ?? 0;

  const avgA = avgDims.A ?? 0;
  const awarenessGap = gapToTarget(avgA, 0.8);

  // ── Historical comparison insights ──
  const hasComparison = comparison && comparison.prevAvgRcsi !== null;
  const rcsiDelta = hasComparison ? comparison!.rcsiDelta : 0;
  const schoolsAdvanced = hasComparison ? comparison!.schoolsAdvanced : 0;
  const schoolsRegressed = hasComparison ? comparison!.schoolsRegressed : 0;

  // Tone logic
  let tone: Narrative['tone'] = 'insight';
  if (sustainable > 0) tone = 'success';
  else if (atM0 === schoolCount && kpis.avgRcsi < 0.35) tone = 'danger';
  else if (avgA < 0.5) tone = 'warning';
  // If there's a positive historical trend, nudge toward success
  if (hasComparison && rcsiDelta > 0.02 && tone !== 'danger') tone = 'success';
  if (hasComparison && rcsiDelta < -0.02) tone = 'warning';

  const insights: string[] = [];

  insights.push(
    `Across all ${schoolCount} schools, ${atM0} are still at <strong>M0 (Readiness)</strong> — the starting milestone. ` +
    `${atM1Plus === 0 ? 'None have yet' : `Only ${atM1Plus} have`} advanced to <strong>M1</strong>, which requires ` +
    `Awareness (A) ≥ 0.80. ${sustainable > 0 ? `${sustainable} school${sustainable === 1 ? '' : 's'} have reached M6 — a sustainable research culture.` : 'No school has reached M6 (sustainability) yet.'}`
  );

  // ── Historical comparison insight (NEW) ──
  if (hasComparison) {
    const deltaStr = rcsiDelta >= 0 ? `+${fmtNum(rcsiDelta)}` : fmtNum(rcsiDelta);
    const direction = rcsiDelta > 0.0005 ? 'improved' : rcsiDelta < -0.0005 ? 'declined' : 'remained stable';
    insights.push(
      `Compared to the previous quarter (${comparison!.previousMonth}), the division's average RCSI ${direction} ` +
      `from ${fmtNum(comparison!.prevAvgRcsi!)} to ${fmtNum(kpis.avgRcsi)} (<strong>${deltaStr}</strong>). ` +
      `${schoolsAdvanced > 0 ? `${schoolsAdvanced} school${schoolsAdvanced === 1 ? '' : 's'} advanced a milestone this quarter.` : 'No schools advanced a milestone this quarter.'} ` +
      `${schoolsRegressed > 0 ? `${schoolsRegressed} regressed.` : ''}`.trim()
    );
  }

  insights.push(
    `The division's weakest sub-index is <strong>${weak} — ${weakMeta.name}</strong> at ${fmtNum(avgDims[weak] ?? 0)} ` +
    `(milestone M${weakMeta.milestone}). The strongest is <strong>${strong} — ${strongMeta.name}</strong> at ${fmtNum(avgDims[strong] ?? 0)} ` +
    `(milestone M${strongMeta.milestone}). Strengthening the weakest dimension is the highest-leverage path forward.`
  );

  if (awarenessGap > 0) {
    insights.push(
      `Awareness (A) — the gatekeeper from <strong>M0 → M1</strong> — averages only ${fmtNum(avgA)}, ` +
      `which is <strong>${fmtNum(awarenessGap)} short</strong> of the 0.80 threshold. Until this gap closes division-wide, ` +
      `no school can progress past M0.`
    );
  }

  insights.push(
    `On the research side, the division has produced ${kpis.totalResearch.toLocaleString()} outputs with a ` +
    `${fmtPct(kpis.publicationRate)} publication rate and a ${fmtPct(kpis.utilizationRate)} utilization rate. ` +
    `Low utilization directly limits <strong>M — Impact Realization (M6)</strong>, the final milestone.`
  );

  // Recommendation
  let recommendation: string;
  if (hasComparison && rcsiDelta > 0.02) {
    recommendation =
      `The division is trending positively (<strong>${fmtNum(rcsiDelta)} RCSI gain this quarter</strong>). ` +
      `Maintain the current interventions and double down on the weakest dimension — <strong>${weak} — ${weakMeta.name}</strong>. ` +
      `${schoolsAdvanced > 0 ? `Replicate the practices of the ${schoolsAdvanced} school(s) that advanced a milestone at other sites. ` : ''}` +
      `Awareness (A) is still ${fmtNum(awarenessGap)} short of the 0.80 threshold — keep the awareness campaign running.`;
  } else if (hasComparison && rcsiDelta < -0.02) {
    recommendation =
      `The division <strong>regressed this quarter</strong> (${fmtNum(rcsiDelta)} RCSI change). ` +
      `${schoolsRegressed > 0 ? `${schoolsRegressed} school(s) lost a milestone — investigate which interventions were paused or reduced. ` : ''} ` +
      `Re-prioritize the awareness campaign (A is still ${fmtNum(awarenessGap)} short of 0.80) and review the publication pipeline ` +
      `to ensure research outputs are not stalling in draft or under_review.`;
  } else if (awarenessGap > 0) {
    recommendation =
      `Launch a division-wide <strong>Awareness campaign</strong> (seminars, research orientation for teachers and school heads) ` +
      `to push the A dimension past 0.80 across all schools. This is the single highest-leverage intervention because ` +
      `<em>no school can advance past M0 without it</em>. Pair this with a publication-pipeline review ` +
      `(draft → under_review → published) to raise the ${fmtPct(kpis.publicationRate)} publication rate and unblock M6.`;
  } else {
    recommendation =
      `Awareness is already above the M1 threshold division-wide. Focus next on <strong>${weak} — ${weakMeta.name}</strong> ` +
      `(the weakest sub-index) to advance schools toward M${weakMeta.milestone}. Streamline the publication pipeline ` +
      `to convert more of the ${kpis.totalResearch.toLocaleString()} outputs into published, utilized research — ` +
      `this directly raises M (Impact Realization).`;
  }

  return {
    tone,
    title: hasComparison
      ? `Division Snapshot — ${atM0} of ${schoolCount} at M0, RCSI ${fmtNum(kpis.avgRcsi)} (${rcsiDelta >= 0 ? '+' : ''}${fmtNum(rcsiDelta)} vs ${comparison!.previousMonth})`
      : `Division Snapshot — ${atM0} of ${schoolCount} schools at M0, ${sustainable} at M6 (sustainable)`,
    insights,
    recommendation,
  };
}

// ---------- Schools narrative ----------

export function buildSchoolsNarrative(schools: SchoolRow[]): Narrative {
  if (schools.length === 0) {
    return {
      tone: 'insight',
      title: 'No schools to display',
      insights: ['Upload school survey data to populate this view.'],
      recommendation: 'Use the Upload tab to ingest a quarterly_survey_data file.',
    };
  }

  // Milestone distribution
  const byMilestone = new Map<number, SchoolRow[]>();
  for (const s of schools) {
    const arr = byMilestone.get(s.milestone) ?? [];
    arr.push(s);
    byMilestone.set(s.milestone, arr);
  }
  const atM0 = (byMilestone.get(0) ?? []).length;
  const atM6 = (byMilestone.get(6) ?? []).length;

  // Sort by RCSI desc to identify top/bottom performers
  const sorted = [...schools].sort((a, b) => b.rcsi - a.rcsi);
  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3).reverse();

  // Awareness gap analysis for top performers
  const topClosestToM1 = top3
    .map(s => ({ school: s, gap: Math.max(0, 0.8 - s.dims.A) }))
    .sort((a, b) => a.gap - b.gap);
  const easiestWin = topClosestToM1[0];

  // Range
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const range = highest.rcsi - lowest.rcsi;

  // Tone
  let tone: Narrative['tone'] = 'insight';
  if (atM6 === schools.length) tone = 'success';
  else if (atM0 === schools.length && range > 0.25) tone = 'warning';
  else if (atM0 === schools.length && lowest.rcsi < 0.2) tone = 'danger';

  const insights: string[] = [];

  insights.push(
    `All ${schools.length} schools are mapped across the milestone ladder. ` +
    `<strong>${atM0} are at M0</strong> (Readiness assessed, Awareness threshold not yet crossed) ` +
    `${atM6 > 0 ? `and <strong>${atM6} have reached M6</strong> (sustainable).` : 'and <strong>none have reached M6</strong>.'} ` +
    `The RCSI spread between the top school (${highest.name}, ${fmtNum(highest.rcsi)}) and the bottom school (${lowest.name}, ${fmtNum(lowest.rcsi)}) ` +
    `is ${fmtNum(range)} — ${range > 0.2 ? 'a wide gap that calls for differentiated support' : 'a relatively tight cluster, suggesting a uniform baseline'}.`
  );

  insights.push(
    `<strong>Top 3 closest to advancing:</strong> ${top3.map(s => `${s.name} (RCSI ${fmtNum(s.rcsi)}, A=${fmtNum(s.dims.A, 2)})`).join(', ')}. ` +
    `${easiestWin && easiestWin.gap > 0
      ? `${easiestWin.school.name} is the easiest win — its Awareness score (${fmtNum(easiestWin.school.dims.A, 2)}) is only ${fmtNum(easiestWin.gap, 2)} short of the 0.80 threshold needed to advance from M0 → M1.`
      : `These schools already meet or exceed the Awareness threshold and are positioned to advance.`}`
  );

  insights.push(
    `<strong>Bottom 3 needing foundational support:</strong> ${bottom3.map(s => `${s.name} (RCSI ${fmtNum(s.rcsi)})`).join(', ')}. ` +
    `These schools score low across multiple dimensions and require foundational investments in <strong>R (Readiness)</strong> ` +
    `and <strong>A (Awareness)</strong> before higher milestones become attainable.`
  );

  // Identify the most common weakest dimension among bottom 3
  const bottomWeakestCounts = new Map<Dimension, number>();
  for (const s of bottom3) {
    let min = Infinity;
    let w: Dimension = 'R';
    for (const d of DIMENSIONS) {
      if (s.dims[d] < min) { min = s.dims[d]; w = d as Dimension; }
    }
    bottomWeakestCounts.set(w, (bottomWeakestCounts.get(w) ?? 0) + 1);
  }
  let bottomWeakest: Dimension = 'R';
  let maxCount = 0;
  for (const [d, c] of bottomWeakestCounts) {
    if (c > maxCount) { maxCount = c; bottomWeakest = d; }
  }

  const recommendation =
    `Adopt a <strong>tiered strategy</strong>: (1) <strong>Push</strong> the top quartile past M1 with targeted awareness-raising ` +
    `(focus on ${easiestWin?.school.name ?? 'the closest school'} first — smallest gap to 0.80); ` +
    `(2) <strong>Lift</strong> the bottom quartile with foundational Readiness investments — their most common weakness is ` +
    `<strong>${bottomWeakest} — ${DIMENSION_META[bottomWeakest].name}</strong>; ` +
    `(3) Pair both with a buddy-system where top performers mentor bottom performers on ${DIMENSION_META[bottomWeakest].name}.`;

  return {
    tone,
    title: `School Distribution — ${atM0} at M0, ${atM6} at M6, RCSI spread of ${fmtNum(range)}`,
    insights,
    recommendation,
  };
}

// ---------- Research narrative ----------

export function buildResearchNarrative(data: OverviewData): Narrative {
  const { kpis, themeCounts, statusCounts, heatmap, matrix } = data;

  // Theme analysis
  const themeEntries = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]);
  const totalResearch = kpis.totalResearch || 1;
  const top2Themes = themeEntries.slice(0, 2);
  const top2Share = (top2Themes[0]?.[1] ?? 0) + (top2Themes[1]?.[1] ?? 0);
  const bottom2Themes = themeEntries.slice(-2);

  // Status pipeline
  const draft = statusCounts.draft ?? 0;
  const underReview = statusCounts.under_review ?? 0;
  const submitted = statusCounts.submitted ?? 0;
  const published = statusCounts.published ?? 0;
  const rejected = statusCounts.rejected ?? 0;
  const stuck = draft + underReview; // not yet submitted
  const stuckPct = stuck / totalResearch;

  // Rank × Education — find the rank producing the most and least
  let topRank = '';
  let topRankCount = 0;
  let lowRank = '';
  let lowRankCount = Infinity;
  for (const rank of heatmap.ranks) {
    const rowTotal = heatmap.educations.reduce((s, ed) => s + (heatmap.data[rank]?.[ed] ?? 0), 0);
    if (rowTotal > topRankCount) { topRankCount = rowTotal; topRank = rank; }
    if (rowTotal < lowRankCount) { lowRankCount = rowTotal; lowRank = rank; }
  }

  // Find which theme has the highest published rate (publication efficiency)
  let bestTheme = '';
  let bestThemeRate = -1;
  for (const theme of matrix.themes) {
    const total = matrix.statuses.reduce((s, st) => s + (matrix.data[theme]?.[st] ?? 0), 0);
    const pub = matrix.data[theme]?.published ?? 0;
    const rate = total > 0 ? pub / total : 0;
    if (rate > bestThemeRate) { bestThemeRate = rate; bestTheme = theme; }
  }

  // Tone
  let tone: Narrative['tone'] = 'insight';
  if (kpis.publicationRate >= 0.6 && kpis.utilizationRate >= 0.6) tone = 'success';
  else if (kpis.publicationRate < 0.3 || stuckPct > 0.5) tone = 'danger';
  else if (kpis.publicationRate < 0.4 || stuckPct > 0.35) tone = 'warning';

  const insights: string[] = [];

  insights.push(
    `Research is concentrated in <strong>${top2Themes.map(t => t[0]).join(' and ')}</strong>, ` +
    `which together account for ${fmtPct(top2Share / totalResearch)} of all ${totalResearch.toLocaleString()} outputs. ` +
    `Under-researched themes — <strong>${bottom2Themes.map(t => t[0]).join(', ')}</strong> — represent blind spots ` +
    `that limit the division's Institutional Anchoring (<strong>I, M4</strong>).`
  );

  insights.push(
    `The publication pipeline shows <strong>${fmtPct(kpis.publicationRate)} published</strong>, but ` +
    `<strong>${stuck.toLocaleString()} outputs (${fmtPct(stuckPct)}) are stuck in draft or under_review</strong>. ` +
    `This pipeline bottleneck directly suppresses <strong>M — Impact Realization (M6)</strong>: research that never gets published cannot be utilized or change practice. ` +
    `${rejected > 0 ? `Additionally, ${rejected} outputs (${fmtPct(rejected / totalResearch)}) were rejected — a quality signal worth investigating.` : ''}`
  );

  insights.push(
    `By teacher rank, <strong>${topRank}</strong> produces the most research (${topRankCount} outputs) while ` +
    `<strong>${lowRank}</strong> produces the least (${lowRankCount}). This capacity gap directly limits ` +
    `<strong>C — Capacity (M2)</strong>: until lower-producing ranks are trained and supported, the division cannot progress past M2 at scale.`
  );

  if (bestTheme) {
    insights.push(
      `<strong>${bestTheme}</strong> has the highest publication efficiency (${fmtPct(bestThemeRate)} of its outputs are published) — ` +
      `a model theme whose review practices could be replicated across the others.`
    );
  }

  const recommendation =
    `Three sequenced actions aligned to the milestone ladder: ` +
    `<strong>(1) Build Capacity (C, M2)</strong> — provide research-methods training targeted at ${lowRank} and Teacher I/II ranks; ` +
    `<strong>(2) Streamline the publication pipeline (M6 enabler)</strong> — assign mentors to move the ${stuck.toLocaleString()} stuck outputs from draft → submitted → published, ` +
    `using ${bestTheme}'s higher publication rate as the playbook; ` +
    `<strong>(3) Broaden theme coverage (I, M4)</strong> — commission research in under-represented themes ` +
    `(${bottom2Themes.map(t => t[0]).join(' & ')}) to deepen institutional anchoring.`;

  return {
    tone,
    title: `Research Pipeline — ${fmtPct(kpis.publicationRate)} published, ${fmtPct(stuckPct)} stuck, ${topRank} lead the output`,
    insights,
    recommendation,
  };
}

// ---------- Twin narrative (reactive to simulation result) ----------

export function buildTwinNarrative(result: TwinResult): Narrative {
  const { actual, projected, delta, dimensionComparison, baselineMonth, school } = result;

  // Empty / no-change case
  const totalDelta = dimensionComparison.reduce((s, c) => s + Math.abs(c.delta), 0);
  if (Math.abs(delta.rcsi) < 0.0005 && totalDelta < 0.005) {
    return {
      tone: 'insight',
      title: `Adjust the sliders to model an intervention for ${school.name}`,
      insights: [
        `The Twin Sandbox lets you simulate "what-if" interventions before committing resources. ` +
        `Drag any of the 7 dimension sliders (R, A, C, S, I, P, M) to see how the projected RCSI and milestone change against the actual baseline.`,
        `Currently ${school.name} is at <strong>M${actual.milestone}</strong> with RCSI ${fmtNum(actual.rcsi)} (baseline: ${baselineMonth}).`,
        actual.nextThreshold
          ? `To advance to M${actual.milestone + 1}, the school needs <strong>${actual.nextThreshold.dimension} — ${DIMENSION_META[actual.nextThreshold.dimension].name}</strong> ` +
            `to reach ${fmtNum(actual.nextThreshold.value, 2)} (currently ${fmtNum(actual.nextThreshold.current, 2)} — a gap of ${fmtNum(actual.nextThreshold.value - actual.nextThreshold.current, 2)}).`
          : `The school has reached M6. Aim for RCSI ≥ 0.70 to mark it as sustainable.`,
      ],
      recommendation: actual.nextThreshold
        ? `Try dragging the <strong>${actual.nextThreshold.dimension}</strong> slider up by at least ` +
          `${fmtNum(actual.nextThreshold.value - actual.nextThreshold.current, 2)} to model crossing the M${actual.milestone + 1} threshold. ` +
          `Then experiment with other dimensions to see how much each contributes to the composite RCSI.`
        : `Experiment with reducing any dimension to see how fragile the school's sustainability is — useful for stress-testing before resource cuts.`,
    };
  }

  // Milestone went UP
  if (delta.milestoneUp) {
    const biggestGain = [...dimensionComparison].sort((a, b) => b.delta - a.delta)[0];
    return {
      tone: 'success',
      title: `Intervention advances ${school.name} from M${actual.milestone} → M${projected.milestone}`,
      insights: [
        `Your simulated intervention <strong>successfully advances ${school.name} from M${actual.milestone} to M${projected.milestone}</strong>. ` +
          `The RCSI improved by <strong>+${fmtNum(delta.rcsi)}</strong> (from ${fmtNum(actual.rcsi)} to ${fmtNum(projected.rcsi)}).`,
        `The largest gain was in <strong>${biggestGain.dimension} — ${DIMENSION_META[biggestGain.dimension].name}</strong> ` +
          `(${fmtNum(biggestGain.actual, 2)} → ${fmtNum(biggestGain.projected, 2)}, +${fmtNum(biggestGain.delta, 2)}).`,
        projected.sustainable
          ? `The school now meets the sustainability criteria (M6 reached with RCSI ≥ 0.70). In the milestone model, this means it cycles back to M0 for the next iteration — a self-sustaining research culture.`
          : projected.nextThreshold
            ? `To advance further to M${projected.milestone + 1}, the school now needs <strong>${projected.nextThreshold.dimension}</strong> ` +
              `to reach ${fmtNum(projected.nextThreshold.value, 2)} (currently ${fmtNum(projected.nextThreshold.current, 2)} — a remaining gap of ${fmtNum(projected.nextThreshold.value - projected.nextThreshold.current, 2)}).`
            : `The school has reached M6. With additional investment it can reach the sustainability threshold (RCSI ≥ 0.70).`,
      ],
      recommendation: projected.sustainable
        ? `This intervention is worth piloting at ${school.name}. Document the specific activities that drove the ` +
          `<strong>${biggestGain.dimension}</strong> improvement and replicate them at other schools with similar profiles. ` +
          `Use the Schools tab to identify the next candidates (those with similar current ${biggestGain.dimension} scores).`
        : `This intervention is a strong first step. To unlock the <em>next</em> milestone, layer in a follow-up intervention ` +
          `targeting <strong>${projected.nextThreshold?.dimension ?? 'the next dimension'}</strong>. ` +
          `Try the threshold sliders in the Thresholds tab to see how sensitive the milestone progression is to the cutoff values.`,
    };
  }

  // Milestone went DOWN
  if (delta.milestoneDown) {
    const biggestLoss = [...dimensionComparison].sort((a, b) => a.delta - b.delta)[0];
    return {
      tone: 'danger',
      title: `Intervention would set ${school.name} back from M${actual.milestone} → M${projected.milestone}`,
      insights: [
        `Your simulated change <strong>regresses ${school.name} from M${actual.milestone} to M${projected.milestone}</strong>. ` +
          `The RCSI dropped by <strong>${fmtNum(delta.rcsi)}</strong> (from ${fmtNum(actual.rcsi)} to ${fmtNum(projected.rcsi)}).`,
        `The largest decline was in <strong>${biggestLoss.dimension} — ${DIMENSION_META[biggestLoss.dimension].name}</strong> ` +
          `(${fmtNum(biggestLoss.actual, 2)} → ${fmtNum(biggestLoss.projected, 2)}, ${fmtNum(biggestLoss.delta, 2)}).`,
        `This scenario is useful for risk assessment: it shows what happens if a dimension is neglected. ` +
          `Avoid implementing changes that would reduce ${biggestLoss.dimension} without compensating gains elsewhere.`,
      ],
      recommendation: `Reconsider this intervention. If the ${biggestLoss.dimension} reduction is unavoidable (e.g., budget cut), ` +
        `model compensating gains in other dimensions first — aim for a net-positive RCSI change before approving.`,
    };
  }

  // RCSI changed but milestone did not
  if (delta.rcsi > 0.0005) {
    const biggestGain = [...dimensionComparison].sort((a, b) => b.delta - a.delta)[0];
    return {
      tone: 'insight',
      title: `RCSI improves by +${fmtNum(delta.rcsi)}, but ${school.name} remains at M${projected.milestone}`,
      insights: [
        `Your intervention improves the RCSI from ${fmtNum(actual.rcsi)} to ${fmtNum(projected.rcsi)} (+${fmtNum(delta.rcsi)}), ` +
          `but the milestone does not advance — the school remains at <strong>M${projected.milestone}</strong>.`,
        `The largest gain was in <strong>${biggestGain.dimension} — ${DIMENSION_META[biggestGain.dimension].name}</strong> ` +
          `(+${fmtNum(biggestGain.delta, 2)}).`,
        projected.nextThreshold
          ? `To advance to M${projected.milestone + 1}, the school needs <strong>${projected.nextThreshold.dimension}</strong> ` +
            `to reach ${fmtNum(projected.nextThreshold.value, 2)}. It is currently at ${fmtNum(projected.nextThreshold.current, 2)} — ` +
            `a remaining gap of <strong>${fmtNum(projected.nextThreshold.value - projected.nextThreshold.current, 2)}</strong> that this intervention did not close.`
          : `The school has reached M6 — push the RCSI above 0.70 to mark it as sustainable.`,
      ],
      recommendation: projected.nextThreshold
        ? `This intervention alone is <strong>insufficient to advance the milestone</strong>. Add a follow-up intervention that specifically ` +
          `boosts <strong>${projected.nextThreshold.dimension} — ${DIMENSION_META[projected.nextThreshold.dimension].name}</strong> by at least ` +
          `${fmtNum(projected.nextThreshold.value - projected.nextThreshold.current, 2)} to cross the M${projected.milestone + 1} threshold. ` +
          `Try the slider now — the simulation updates in real time.`
        : `Push the dimension sliders further to bring the RCSI above 0.70 — the sustainability threshold.`,
    };
  }

  // RCSI decreased but milestone did not change
  if (delta.rcsi < -0.0005) {
    const biggestLoss = [...dimensionComparison].sort((a, b) => a.delta - b.delta)[0];
    return {
      tone: 'warning',
      title: `RCSI drops by ${fmtNum(delta.rcsi)} — milestone unchanged at M${projected.milestone}`,
      insights: [
        `Your simulated change reduces the RCSI from ${fmtNum(actual.rcsi)} to ${fmtNum(projected.rcsi)} (${fmtNum(delta.rcsi)}), ` +
          `though the milestone remains at M${projected.milestone}.`,
        `The largest decline was in <strong>${biggestLoss.dimension} — ${DIMENSION_META[biggestLoss.dimension].name}</strong> ` +
          `(${fmtNum(biggestLoss.delta, 2)}).`,
        `While the milestone didn't regress this time, sustained decline in ${biggestLoss.dimension} will eventually drop the school below the M${projected.milestone} threshold.`,
      ],
      recommendation: `Reverse the ${biggestLoss.dimension} reduction, or compensate with gains in other dimensions. ` +
        `Even when the milestone holds, a falling RCSI signals weakening research culture.`,
    };
  }

  // Fallback (no meaningful change)
  return {
    tone: 'insight',
    title: `Adjust the sliders to model an intervention for ${school.name}`,
    insights: [
      `Currently ${school.name} is at <strong>M${actual.milestone}</strong> with RCSI ${fmtNum(actual.rcsi)}.`,
      actual.nextThreshold
        ? `To advance to M${actual.milestone + 1}, raise <strong>${actual.nextThreshold.dimension}</strong> from ${fmtNum(actual.nextThreshold.current, 2)} to ${fmtNum(actual.nextThreshold.value, 2)}.`
        : `The school has reached M6 — push RCSI above 0.70 for sustainability.`,
    ],
    recommendation: actual.nextThreshold
      ? `Drag the <strong>${actual.nextThreshold.dimension}</strong> slider to model crossing the next milestone threshold.`
      : `Push the sliders further to demonstrate sustainability.`,
  };
}
