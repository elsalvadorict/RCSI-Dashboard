// Shared types for the dashboard UI
import { Dimension } from '@/lib/rcsi';

export interface SchoolRow {
  id: number;
  name: string;
  rcsi: number;
  milestone: number;
  sustainable: boolean;
  dims: Record<string, number>;
  sparkline: number[];
  surveyCount: number;
  researchCount: number;
  publishedCount: number;
  utilizedCount: number;
}

export interface OverviewData {
  schoolCount: number;
  selectedMonth: string;
  latestMonth: string;
  months: string[];
  previousMonth: string | null;
  kpis: {
    avgRcsi: number;
    sustainableCount: number;
    totalResearch: number;
    publicationRate: number;
    utilizationRate: number;
    fullPapers: number;
    abstracts: number;
    publishedCount: number;
    utilizedCount: number;
  };
  avgDims: Record<string, number>;
  milestoneBuckets: number[];
  comparison: {
    previousMonth: string;
    prevAvgRcsi: number | null;
    prevAvgDims: Record<string, number | null>;
    prevMilestoneBuckets: number[];
    rcsiDelta: number;
    schoolChanges: number;
    schoolsAdvanced: number;
    schoolsRegressed: number;
  } | null;
  trend: {
    month: string;
    rcsi: number;
    dims: Record<string, number>;
  }[];
  themeCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  matrix: {
    themes: string[];
    statuses: string[];
    data: Record<string, Record<string, number>>;
  };
  heatmap: {
    ranks: string[];
    educations: string[];
    data: Record<string, Record<string, number>>;
  };
  yearTrend: { year: string; count: number }[];
  topResearchers: {
    teacherName: string;
    researchCount: number;
    yearsOfService: number;
    teacherRank: string;
    educationalAttainment: string;
    schoolCount: number;
    yearsUndertaken: number[];
    themes: string[];
  }[];
}

export interface SchoolDetail {
  school: { id: number; name: string };
  latest: {
    month: string;
    rcsi: number;
    milestone: number;
    dims: Record<string, number>;
  } | null;
  trend: {
    month: string;
    rcsi: number;
    milestone: number;
    dims: Record<string, number>;
  }[];
  research: {
    total: number;
    published: number;
    utilized: number;
    fullPapers: number;
    abstracts: number;
    themeCounts: Record<string, number>;
    statusCounts: Record<string, number>;
    yearCounts: Record<string, number>;
    records: {
      title: string;
      teacher: string;
      theme: string;
      status: string;
      type: string;
      year: number;
      utilized: boolean;
      link: string | null;
    }[];
  };
}

export interface TwinResult {
  school: { id: number; name: string };
  baselineMonth: string;
  actual: {
    rcsi: number;
    milestone: number;
    sustainable: boolean;
    nextThreshold: { dimension: Dimension; value: number; current: number } | null;
  };
  projected: {
    rcsi: number;
    milestone: number;
    sustainable: boolean;
    nextThreshold: { dimension: Dimension; value: number; current: number } | null;
  };
  delta: {
    rcsi: number;
    milestone: number;
    milestoneUp: boolean;
    milestoneDown: boolean;
  };
  dimensionComparison: {
    dimension: Dimension;
    actual: number;
    projected: number;
    delta: number;
  }[];
  weights: Partial<Record<Dimension, number>>;
  thresholds: Partial<Record<Dimension, number>>;
}

export interface UploadPreviewFile {
  fileName: string;
  detectedKind: 'survey' | 'research' | 'unknown';
  rowCount: number;
  errors: string[];
  warnings: string[];
  preview: Record<string, string>[];
}

// Tailwind-friendly chart palette (cyan/teal/violet for dark mode)
export const CHART_COLORS = {
  R: '#22d3ee', // cyan-400
  A: '#a78bfa', // violet-400
  C: '#34d399', // emerald-400
  S: '#fbbf24', // amber-400
  I: '#fb7185', // rose-400
  P: '#60a5fa', // blue-400
  M: '#f472b6', // pink-400
};

export const DIMENSION_COLORS = CHART_COLORS;
