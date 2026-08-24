/**
 * Policy Levers — a decision-maker-friendly input layer for the Twin Sandbox.
 *
 * Each lever is a human-readable policy choice (e.g., "Training frequency:
 * 4 sessions/quarter") that translates into dimension deltas (R, A, C, S, I, P, M).
 * The deltas then feed into the existing simulation pipeline — no changes to the
 * API or computation engine are needed.
 *
 * Design principles:
 *  - Each lever has a BASELINE (status quo). Moving above baseline → positive
 *    deltas; below → negative deltas.
 *  - Each lever primarily boosts the dimension aligned with its corresponding
 *    milestone (e.g., Training freq → C → M2) plus a secondary dimension.
 *  - Max delta per dimension is capped at ~±0.20 so results stay interpretable.
 */
import { Dimension, DIMENSIONS } from './rcsi';

export interface PolicyLever {
  key: string;
  name: string;
  shortName: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  baseline: number;
  /** Which dimensions this lever affects, in priority order. */
  affects: { dimension: Dimension; milestone: number; weight: number }[];
  /**
   * Convert the lever value into dimension deltas.
   * The `baseline` is the status quo — at baseline, deltas are all zero.
   */
  toDeltas: (value: number) => Partial<Record<Dimension, number>>;
  /** Format the lever value for display. */
  formatValue: (value: number) => string;
}

export const POLICY_LEVERS: PolicyLever[] = [
  {
    key: 'trainingFreq',
    name: 'Training Frequency',
    shortName: 'Training',
    description: 'Research-methods training sessions per quarter. Builds teacher capacity and raises awareness.',
    unit: 'sessions/qtr',
    min: 0,
    max: 8,
    step: 1,
    baseline: 2,
    affects: [
      { dimension: 'C', milestone: 2, weight: 0.025 }, // primary: Capacity (M2)
      { dimension: 'A', milestone: 1, weight: 0.015 }, // secondary: Awareness (M1)
    ],
    toDeltas: (value) => ({
      C: (value - 2) * 0.025,
      A: (value - 2) * 0.015,
    }),
    formatValue: (v) => `${v} ${v === 1 ? 'session' : 'sessions'}/qtr`,
  },
  {
    key: 'mentorshipRatio',
    name: 'Mentorship Ratio',
    shortName: 'Mentorship',
    description: 'Mentees per mentor (lower = more mentors available). Strengthens structured support and peer learning.',
    unit: 'mentees/mentor',
    min: 1,
    max: 20,
    step: 1,
    baseline: 10,
    affects: [
      { dimension: 'S', milestone: 3, weight: 0.15 }, // primary: Structured Support (M3)
      { dimension: 'P', milestone: 5, weight: 0.10 }, // secondary: Community of Practice (M5)
    ],
    toDeltas: (value) => {
      // Lower ratio (more mentors) = positive delta. Normalized against baseline.
      const improvement = (10 - value) / 10; // +0.9 at 1:1, -1.0 at 1:20
      return {
        S: improvement * 0.15,
        P: improvement * 0.10,
      };
    },
    formatValue: (v) => `1:${v}`,
  },
  {
    key: 'supportBudget',
    name: 'Support Budget',
    shortName: 'Budget',
    description: 'Research support budget as % of target. Funds infrastructure, time allocation, and materials.',
    unit: '% of target',
    min: 0,
    max: 100,
    step: 5,
    baseline: 40,
    affects: [
      { dimension: 'S', milestone: 3, weight: 0.003 }, // primary: Structured Support (M3)
      { dimension: 'R', milestone: 0, weight: 0.0015 }, // secondary: Readiness (M0)
    ],
    toDeltas: (value) => ({
      S: (value - 40) * 0.003,
      R: (value - 40) * 0.0015,
    }),
    formatValue: (v) => `${v}% of target`,
  },
  {
    key: 'leadershipCommit',
    name: 'Leadership Commitment',
    shortName: 'Leadership',
    description: '% of leadership meetings with research on the agenda. Embeds research in school plans and governance.',
    unit: '% meetings',
    min: 0,
    max: 100,
    step: 5,
    baseline: 30,
    affects: [
      { dimension: 'I', milestone: 4, weight: 0.003 }, // primary: Institutional Anchoring (M4)
      { dimension: 'A', milestone: 1, weight: 0.001 }, // secondary: Awareness (M1)
    ],
    toDeltas: (value) => ({
      I: (value - 30) * 0.003,
      A: (value - 30) * 0.001,
    }),
    formatValue: (v) => `${v}% of meetings`,
  },
  {
    key: 'collabFreq',
    name: 'Collaboration Frequency',
    shortName: 'Collaboration',
    description: 'Research sharing forums per quarter (LRs, communities of practice, symposia). Drives peer learning and impact.',
    unit: 'forums/qtr',
    min: 0,
    max: 8,
    step: 1,
    baseline: 1,
    affects: [
      { dimension: 'P', milestone: 5, weight: 0.025 }, // primary: Community of Practice (M5)
      { dimension: 'M', milestone: 6, weight: 0.015 }, // secondary: Impact Realization (M6)
    ],
    toDeltas: (value) => ({
      P: (value - 1) * 0.025,
      M: (value - 1) * 0.015,
    }),
    formatValue: (v) => `${v} ${v === 1 ? 'forum' : 'forums'}/qtr`,
  },
];

/** Default lever values = baselines (status quo, zero deltas). */
export function defaultLeverValues(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of POLICY_LEVERS) out[l.key] = l.baseline;
  return out;
}

/**
 * Compute dimension deltas from the current lever values.
 * Deltas from all levers are summed, then clamped per-dimension to [-0.30, +0.30]
 * (matching the Intervention tab's slider range).
 */
export function computeDeltasFromLevers(
  leverValues: Record<string, number>
): Record<Dimension, number> {
  const deltas: Record<Dimension, number> = {
    R: 0, A: 0, C: 0, S: 0, I: 0, P: 0, M: 0,
  };
  for (const lever of POLICY_LEVERS) {
    const value = leverValues[lever.key] ?? lever.baseline;
    const d = lever.toDeltas(value);
    for (const dim of DIMENSIONS) {
      if (d[dim] !== undefined) {
        deltas[dim] += d[dim]!;
      }
    }
  }
  // Clamp to [-0.30, +0.30] to stay within the Intervention tab's range
  for (const dim of DIMENSIONS) {
    deltas[dim] = Math.max(-0.30, Math.min(0.30, deltas[dim]));
  }
  return deltas;
}

/**
 * For each lever, compute its current contribution to each dimension.
 * Useful for the UI to show "this lever is contributing +0.10 to C".
 */
export function leverContributions(
  leverValues: Record<string, number>
): Record<string, Partial<Record<Dimension, number>>> {
  const out: Record<string, Partial<Record<Dimension, number>>> = {};
  for (const lever of POLICY_LEVERS) {
    const value = leverValues[lever.key] ?? lever.baseline;
    out[lever.key] = lever.toDeltas(value);
  }
  return out;
}
