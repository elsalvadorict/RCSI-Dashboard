/**
 * Survey Questionnaire Definitions
 * --------------------------------
 * 35 questions (5 per dimension) aligned with the RCSI framework.
 * Each question is scored on a 5-point Likert scale (0, 0.25, 0.5, 0.75, 1.0).
 * Dimension score = average of its 5 questions, producing a 0–1 value
 * that matches the quarterly_survey_data.csv format.
 */
import { Dimension } from './rcsi';

export interface SurveyQuestion {
  id: string;
  text: string;
}

export interface SurveyDimension {
  code: Dimension;
  name: string;
  description: string;
  milestone: number;
  questions: SurveyQuestion[];
}

export const LIKERT_SCALE = [
  { value: 0,    label: 'Not at all', short: 'None' },
  { value: 0.25, label: 'Minimal',    short: 'Low' },
  { value: 0.5,  label: 'Partial',    short: 'Mid' },
  { value: 0.75, label: 'Substantial',short: 'High' },
  { value: 1.0,  label: 'Full',       short: 'Full' },
] as const;

export const SURVEY_DIMENSIONS: SurveyDimension[] = [
  {
    code: 'R',
    name: 'Readiness',
    description: 'School preparedness and foundational conditions for research.',
    milestone: 0,
    questions: [
      { id: 'R1', text: 'The school has a dedicated space (room or corner) where teachers can conduct research activities.' },
      { id: 'R2', text: 'Internet access in the school is sufficient for literature search and online research tools.' },
      { id: 'R3', text: 'The school library or learning resource center has research journals, thesis collections, or reference materials.' },
      { id: 'R4', text: 'Teachers are provided with time during work hours to engage in research activities.' },
      { id: 'R5', text: 'There is a designated budget line item for research-related expenses (supplies, training, publication fees).' },
    ],
  },
  {
    code: 'A',
    name: 'Awareness',
    description: 'Level of research awareness among teachers and leaders. Threshold for M0 → M1: A ≥ 0.80.',
    milestone: 1,
    questions: [
      { id: 'A1', text: 'A majority of teachers can correctly name at least two research methodologies (e.g., descriptive, experimental, qualitative).' },
      { id: 'A2', text: 'Teachers are aware of the division\'s research agenda and priorities for the current year.' },
      { id: 'A3', text: 'School leaders (principal, head teacher) regularly discuss research in staff meetings.' },
      { id: 'A4', text: 'Teachers are aware of publication venues (journals, conferences, LAC sessions) where they can share research.' },
      { id: 'A5', text: 'There is a shared understanding among staff of what "research culture" means for the school.' },
    ],
  },
  {
    code: 'C',
    name: 'Capacity',
    description: 'Research skills, training, and expertise of the teaching staff.',
    milestone: 2,
    questions: [
      { id: 'C1', text: 'A significant proportion of teachers have completed research-methods training (LAC, seminar, or graduate coursework).' },
      { id: 'C2', text: 'Teachers can independently formulate a clear, answerable research question.' },
      { id: 'C3', text: 'Teachers are proficient in using data analysis tools (Excel, SPSS, or similar) for research.' },
      { id: 'C4', text: 'A significant proportion of teachers hold a Master\'s degree or higher (or are pursuing one).' },
      { id: 'C5', text: 'There are experienced researchers in the school who can mentor colleagues on methodology and writing.' },
    ],
  },
  {
    code: 'S',
    name: 'Structured Support',
    description: 'Availability of budget, time, mentoring, and institutional support for research.',
    milestone: 3,
    questions: [
      { id: 'S1', text: 'The school has a written research policy or guidelines that are known to teachers.' },
      { id: 'S2', text: 'Research time is formally allocated in the school calendar (e.g., monthly LAC sessions dedicated to research).' },
      { id: 'S3', text: 'There is an active mentoring program where experienced researchers guide novice ones.' },
      { id: 'S4', text: 'Research outputs are recognized in teacher performance reviews (IPCRF) and promotion criteria.' },
      { id: 'S5', text: 'The school provides seed funding or financial support for at least one research project per year.' },
    ],
  },
  {
    code: 'I',
    name: 'Institutional Anchoring',
    description: 'How deeply research is embedded in school plans, policies, and meetings.',
    milestone: 4,
    questions: [
      { id: 'I1', text: 'Research is explicitly included as a strategic priority in the School Improvement Plan (SIP).' },
      { id: 'I2', text: 'Research goals and progress are reviewed in regular leadership meetings (at least monthly).' },
      { id: 'I3', text: 'Research findings have influenced at least one school-level decision in the past year.' },
      { id: 'I4', text: 'Research is mentioned in the school\'s vision, mission, or core values statement.' },
      { id: 'I5', text: 'School heads have research-related Key Performance Indicators (KPIs) in their performance targets.' },
    ],
  },
  {
    code: 'P',
    name: 'Community of Practice',
    description: 'Strength of research collaboration, sharing forums, and peer learning.',
    milestone: 5,
    questions: [
      { id: 'P1', text: 'The school holds regular research sharing sessions (LAC sessions, symposia, or brown-bag seminars) at least once per quarter.' },
      { id: 'P2', text: 'Teachers collaborate on research projects across grade levels or learning areas.' },
      { id: 'P3', text: 'There is an active research committee or Learning Action Cell (LAC) focused on research.' },
      { id: 'P4', text: 'Teachers attend external research conferences, division-wide research forums, or regional symposia.' },
      { id: 'P5', text: 'Research outputs are shared beyond the school (at the division, district, or regional level).' },
    ],
  },
  {
    code: 'M',
    name: 'Impact Realization',
    description: 'Tangible outcomes of research: publications, utilizations, and policy changes.',
    milestone: 6,
    questions: [
      { id: 'M1', text: 'The school has produced at least one published research output (journal article, conference paper) in the past year.' },
      { id: 'M2', text: 'Research outputs from the school have been utilized or implemented in classroom practice or school programs.' },
      { id: 'M3', text: 'Research findings have led to at least one policy change or new program in the school.' },
      { id: 'M4', text: 'Research outcomes are tracked, documented, and reported annually to the division office.' },
      { id: 'M5', text: 'The school can point to at least one research-driven innovation that is now embedded in regular practice.' },
    ],
  },
];

/**
 * Compute a dimension score (0–1) from the responses to its questions.
 * `responses` is a record of questionId → Likert value (0, 0.25, 0.5, 0.75, 1.0).
 */
export function computeDimensionScore(
  dimension: SurveyDimension,
  responses: Record<string, number>
): number {
  const values = dimension.questions.map(q => responses[q.id] ?? 0);
  if (values.length === 0) return 0;
  const sum = values.reduce((s, v) => s + v, 0);
  return sum / values.length;
}

/**
 * Compute all 7 dimension scores from a full response set.
 */
export function computeAllDimensionScores(
  responses: Record<string, number>
): Record<Dimension, number> {
  const out = {} as Record<Dimension, number>;
  for (const dim of SURVEY_DIMENSIONS) {
    out[dim.code] = computeDimensionScore(dim, responses);
  }
  return out;
}

/**
 * Count how many questions in a dimension have been answered
 * (i.e., have a non-zero response).
 */
export function answeredCount(
  dimension: SurveyDimension,
  responses: Record<string, number>
): number {
  return dimension.questions.filter(q => responses[q.id] !== undefined).length;
}
