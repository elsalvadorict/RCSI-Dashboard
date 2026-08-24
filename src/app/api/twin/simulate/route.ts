import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  DIMENSIONS,
  Dimension,
  DEFAULT_WEIGHTS,
  DEFAULT_THRESHOLDS,
  computeRcsi,
  classifyMilestone,
  applyDeltas,
} from '@/lib/rcsi';

/**
 * POST /api/twin/simulate
 *
 * Body:
 *  - schoolId: number (required) — which school to twin
 *  - month?: string — which quarter to base off (defaults to latest)
 *  - deltas?: Partial<Record<Dimension, number>> — per-dimension additive adjustments in [-1, 1]
 *  - weights?: Partial<Record<Dimension, number>> — custom RCSI weights (overrides equal 12.5%)
 *  - thresholds?: Partial<Record<Dimension, number>> — custom milestone thresholds (overrides defaults)
 *
 * Returns actual vs projected RCSI, milestone, and per-dimension comparison.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const schoolId = parseInt(body?.schoolId, 10);
  if (Number.isNaN(schoolId)) {
    return NextResponse.json({ error: 'Invalid schoolId' }, { status: 400 });
  }

  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  const surveys = await db.surveyScore.findMany({
    where: { schoolId },
    orderBy: { month: 'asc' },
  });
  if (surveys.length === 0) {
    return NextResponse.json({ error: 'No surveys for school' }, { status: 404 });
  }

  const requestedMonth = body?.month;
  const baseline =
    surveys.find(s => s.month === requestedMonth) ?? surveys[surveys.length - 1];

  const actualValues: Record<Dimension, number> = {
    R: baseline.R, A: baseline.A, C: baseline.C, S: baseline.S,
    I: baseline.I, P: baseline.P, M: baseline.M,
  };

  // Apply deltas (clamped to [0, 1])
  const deltas: Partial<Record<Dimension, number>> = {};
  for (const d of DIMENSIONS) {
    const v = body?.deltas?.[d];
    if (typeof v === 'number' && !Number.isNaN(v)) deltas[d] = v;
  }
  const projectedValues = applyDeltas(actualValues, deltas);

  const weights: Partial<Record<Dimension, number>> = {};
  for (const d of DIMENSIONS) {
    const v = body?.weights?.[d];
    if (typeof v === 'number' && !Number.isNaN(v)) weights[d] = v;
  }
  const thresholds: Partial<Record<Dimension, number>> = {};
  for (const d of DIMENSIONS) {
    const v = body?.thresholds?.[d];
    if (typeof v === 'number' && !Number.isNaN(v)) thresholds[d] = v;
  }

  // Actual snapshot (with default weights/thresholds)
  const actualRcsi = computeRcsi(actualValues, DEFAULT_WEIGHTS);
  const actualMs = classifyMilestone(actualValues, DEFAULT_THRESHOLDS);

  // Projected snapshot (with optionally custom weights/thresholds)
  const effectiveWeights = Object.keys(weights).length > 0 ? weights : DEFAULT_WEIGHTS;
  const effectiveThresholds = Object.keys(thresholds).length > 0 ? thresholds : DEFAULT_THRESHOLDS;
  const projectedRcsi = computeRcsi(projectedValues, effectiveWeights);
  const projectedMs = classifyMilestone(projectedValues, effectiveThresholds);

  // Per-dimension comparison
  const dimensionComparison = DIMENSIONS.map(d => ({
    dimension: d,
    actual: actualValues[d],
    projected: projectedValues[d],
    delta: projectedValues[d] - actualValues[d],
  }));

  return NextResponse.json({
    school: { id: school.id, name: school.name },
    baselineMonth: baseline.month,
    actual: {
      rcsi: actualRcsi,
      milestone: actualMs.milestone,
      sustainable: actualMs.sustainable,
      nextThreshold: actualMs.nextThreshold,
    },
    projected: {
      rcsi: projectedRcsi,
      milestone: projectedMs.milestone,
      sustainable: projectedMs.sustainable,
      nextThreshold: projectedMs.nextThreshold,
    },
    delta: {
      rcsi: projectedRcsi - actualRcsi,
      milestone: projectedMs.milestone - actualMs.milestone,
      milestoneUp: projectedMs.milestone > actualMs.milestone,
      milestoneDown: projectedMs.milestone < actualMs.milestone,
    },
    dimensionComparison,
    weights: effectiveWeights,
    thresholds: effectiveThresholds,
  });
}
