/**
 * RCSI Computation & Milestone Classification Engine
 * ---------------------------------------------------
 * Per El Salvador Division study:
 *  - 7 sub-indices: R, A, C, S, I, P, M (each in [0, 1])
 *  - RCSI = equal-weighted aggregate (12.5% each by default, configurable)
 *  - Milestone progression M0 -> M6:
 *      M0: starting (Readiness assessed)
 *      M1: A >= 0.8 (Awareness threshold)
 *      M2: C threshold met
 *      M3: S threshold met
 *      M4: I threshold met
 *      M5: P threshold met
 *      M6: M threshold met (sustainable — cycles back)
 */

export const DIMENSIONS = ['R', 'A', 'C', 'S', 'I', 'P', 'M'] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_META: Record<Dimension, {
  name: string;
  description: string;
  milestone: number; // 0..6
}> = {
  R: { name: 'Readiness',              description: 'School preparedness & foundational conditions for research (infrastructure, mindset).', milestone: 0 },
  A: { name: 'Awareness',              description: 'Level of research awareness among teachers and leaders. Threshold for M0→M1: A ≥ 0.8.', milestone: 1 },
  C: { name: 'Capacity',               description: 'Research skills, training, and expertise of the teaching staff.', milestone: 2 },
  S: { name: 'Structured Support',     description: 'Availability of budget, time, mentoring, and institutional support.', milestone: 3 },
  I: { name: 'Institutional Anchoring',description: 'How deeply research is embedded in school plans, policies, and meetings.', milestone: 4 },
  P: { name: 'Community of Practice',  description: 'Strength of research collaboration, sharing forums, and peer learning.', milestone: 5 },
  M: { name: 'Impact Realization',     description: 'Tangible outcomes: publications, utilizations, and policy changes.', milestone: 6 },
};

// Default thresholds per milestone. A is fixed at 0.8 (per spec); others default 0.5.
export const DEFAULT_THRESHOLDS: Record<Dimension, number> = {
  R: 0.0, // R has no threshold — milestone 0 is the starting state
  A: 0.8, // M0 -> M1
  C: 0.5, // M1 -> M2
  S: 0.5, // M2 -> M3
  I: 0.5, // M3 -> M4
  P: 0.5, // M4 -> M5
  M: 0.5, // M5 -> M6
};

// Default weights: equal 12.5% each (1/8 = 0.125)
export const DEFAULT_WEIGHTS: Record<Dimension, number> = {
  R: 1 / 8,
  A: 1 / 8,
  C: 1 / 8,
  S: 1 / 8,
  I: 1 / 8,
  P: 1 / 8,
  M: 1 / 8,
};

export interface DimensionValues {
  R: number;
  A: number;
  C: number;
  S: number;
  I: number;
  P: number;
  M: number;
}

export interface RcsiConfig {
  weights?: Partial<Record<Dimension, number>>;
  thresholds?: Partial<Record<Dimension, number>>;
}

/**
 * Compute the composite RCSI score (0..1).
 * Weights are normalized to sum to 1.
 */
export function computeRcsi(v: DimensionValues, weights: Partial<Record<Dimension, number>> = DEFAULT_WEIGHTS): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const sum = DIMENSIONS.reduce((s, d) => s + (w[d] ?? 0), 0);
  if (sum <= 0) return 0;
  const rcsi = DIMENSIONS.reduce((s, d) => s + (v[d] ?? 0) * ((w[d] ?? 0) / sum), 0);
  return Math.max(0, Math.min(1, rcsi));
}

/**
 * Classify the milestone (0..6) for a given set of dimension values.
 *
 * Milestone is the highest sequential stage whose threshold has been met.
 * The progression is: R (M0 baseline) -> A (M1) -> C (M2) -> S (M3) -> I (M4) -> P (M5) -> M (M6).
 * A later stage only counts if all earlier stages have been met.
 *
 * M6 + RCSI ≥ 0.7 means "sustainable — cycling back" (returned to M0 for next iteration).
 */
export function classifyMilestone(
  v: DimensionValues,
  thresholds: Partial<Record<Dimension, number>> = DEFAULT_THRESHOLDS
): { milestone: number; sustainable: boolean; nextThreshold: { dimension: Dimension; value: number; current: number } | null } {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  let milestone = 0;
  // Walk the milestone ladder in order: R is M0 (always), then A, C, S, I, P, M
  const ladder: Dimension[] = ['R', 'A', 'C', 'S', 'I', 'P', 'M'];
  for (let i = 0; i < ladder.length; i++) {
    const d = ladder[i];
    const threshold = t[d] ?? 0;
    if (i === 0) {
      // M0 — always claimed (Readiness is the starting point)
      milestone = 0;
      continue;
    }
    if ((v[d] ?? 0) >= threshold) {
      milestone = i; // claim this milestone
    } else {
      // Cannot progress further — stop and report next threshold to clear
      return {
        milestone,
        sustainable: false,
        nextThreshold: { dimension: d, value: threshold, current: v[d] ?? 0 },
      };
    }
  }
  // All thresholds met => M6 achieved; check sustainability (cycling back)
  const rcsi = computeRcsi(v);
  const sustainable = rcsi >= 0.7;
  return { milestone: 6, sustainable, nextThreshold: null };
}

/**
 * Apply per-dimension deltas (e.g. +0.15 on R for School_5) and recompute.
 * Values are clamped to [0, 1].
 */
export function applyDeltas(v: DimensionValues, deltas: Partial<Record<Dimension, number>>): DimensionValues {
  const out: DimensionValues = { ...v };
  for (const d of DIMENSIONS) {
    const next = (out[d] ?? 0) + (deltas[d] ?? 0);
    out[d] = Math.max(0, Math.min(1, next));
  }
  return out;
}

/**
 * Apply a multiplicative scaling factor per dimension (e.g. 1.15 on R).
 * Values are clamped to [0, 1].
 */
export function applyScales(v: DimensionValues, scales: Partial<Record<Dimension, number>>): DimensionValues {
  const out: DimensionValues = { ...v };
  for (const d of DIMENSIONS) {
    const next = (out[d] ?? 0) * (scales[d] ?? 1);
    out[d] = Math.max(0, Math.min(1, next));
  }
  return out;
}
