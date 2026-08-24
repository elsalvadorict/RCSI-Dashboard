/**
 * PDF Report Generator
 * --------------------
 * Client-side PDF generation using jsPDF.
 * Generates branded reports for each sandbox with the Executive Brief,
 * key metrics, and data tables.
 */
import { jsPDF } from 'jspdf';
import { DIMENSION_META, DIMENSIONS } from './rcsi';
import { OverviewData, SchoolRow, TwinResult } from './types';
import { Narrative } from '@/lib/narratives';

// ── Branding constants ──
const PAGE_W = 595.28; // A4 in points
const PAGE_H = 841.89;
const MARGIN_L = 50;
const MARGIN_R = 50;
const MARGIN_T = 60;
const MARGIN_B = 50;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

const COLOR_PRIMARY: [number, number, number] = [26, 26, 46];       // #1A1A2E
const COLOR_ACCENT: [number, number, number] = [14, 124, 123];      // #0E7C7B
const COLOR_MUTED: [number, number, number] = [118, 124, 128];      // #767C80
const COLOR_BG_LIGHT: [number, number, number] = [238, 244, 244];   // light teal
const COLOR_BORDER: [number, number, number] = [176, 191, 199];     // #B0BFC7
const COLOR_HEADER_FILL: [number, number, number] = [69, 96, 110];  // #45606E
const COLOR_WHITE: [number, number, number] = [255, 255, 255];

type RGB = [number, number, number];

interface ReportOptions {
  title: string;
  subtitle: string;
  narrative: Narrative;
  reportType: 'overview' | 'schools' | 'research' | 'twin';
  generatedAt: string;
}

function setFill(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function setText(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }

/**
 * Add the header and footer to every page.
 */
function addHeaderFooter(doc: jsPDF, title: string, pageNum: number, totalPages: number) {
  // Header
  setText(doc, COLOR_MUTED);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('El Salvador Division RCSI Dashboard', MARGIN_L, 30);
  // Prototype badge on the right side of header
  setText(doc, [146, 64, 14]); // amber-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('PROTOTYPE — FOR APPROVAL', PAGE_W - MARGIN_R - 90, 30);
  setText(doc, COLOR_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setDraw(doc, COLOR_ACCENT);
  doc.setLineWidth(1.2);
  doc.line(MARGIN_L, 35, PAGE_W - MARGIN_R, 35);

  // Footer
  setDraw(doc, COLOR_BORDER);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_L, PAGE_H - 30, PAGE_W - MARGIN_R, PAGE_H - 30);
  setText(doc, COLOR_MUTED);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Copyright 2026 El Salvador Division', MARGIN_L, PAGE_H - 20);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN_R - 40, PAGE_H - 20);
}

/**
 * Add the report title block at the top of page 1.
 */
function addTitleBlock(doc: jsPDF, title: string, subtitle: string, generatedAt: string): number {
  let y = MARGIN_T;

  // Accent bar
  setFill(doc, COLOR_ACCENT);
  doc.rect(MARGIN_L, y, 4, 22, 'F');

  // Title
  setText(doc, COLOR_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(title, CONTENT_W - 14);
  doc.text(titleLines, MARGIN_L + 10, y + 10);
  y += titleLines.length * 11 + 4;

  // Subtitle
  setText(doc, COLOR_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitle, MARGIN_L + 10, y);
  y += 14;

  // Generated date
  setText(doc, COLOR_MUTED);
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedAt}`, MARGIN_L + 10, y);
  y += 10;

  // Separator
  setDraw(doc, COLOR_BORDER);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  y += 14;

  return y;
}

/**
 * Add the Executive Brief narrative block.
 */
function addNarrative(doc: jsPDF, narrative: Narrative, y: number): number {
  // Check if we need a page break
  if (y > PAGE_H - MARGIN_B - 150) {
    doc.addPage();
    y = MARGIN_T;
  }

  // Background tint
  const toneColors: Record<string, RGB> = {
    insight: [255, 248, 230],    // amber tint
    success: [232, 250, 238],    // green tint
    warning: [255, 240, 230],    // orange tint
    danger: [254, 232, 232],     // red tint
  };
  const toneBorders: Record<string, RGB> = {
    insight: [200, 160, 60],
    success: [60, 160, 100],
    warning: [200, 120, 60],
    danger: [200, 80, 80],
  };
  const bg = toneColors[narrative.tone] || toneColors.insight;
  const border = toneBorders[narrative.tone] || toneBorders.insight;

  // Card background
  setFill(doc, bg);
  const cardH = 40 + narrative.insights.length * 14 + 30;
  doc.rect(MARGIN_L, y, CONTENT_W, cardH, 'F');

  // Left accent border
  setFill(doc, border);
  doc.rect(MARGIN_L, y, 3, cardH, 'F');

  // "EXECUTIVE BRIEF" label
  setText(doc, border);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('EXECUTIVE BRIEF', MARGIN_L + 10, y + 10);

  // Title
  setText(doc, COLOR_PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const titleLines = doc.splitTextToSize(narrative.title, CONTENT_W - 20);
  doc.text(titleLines, MARGIN_L + 10, y + 20);
  let innerY = y + 20 + titleLines.length * 7 + 4;

  // Insights (strip HTML for PDF)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setText(doc, COLOR_PRIMARY);
  for (const insight of narrative.insights) {
    const clean = stripHtml(insight);
    const lines = doc.splitTextToSize(`•  ${clean}`, CONTENT_W - 22);
    for (const line of lines) {
      if (innerY > y + cardH - 20) break;
      doc.text(line, MARGIN_L + 12, innerY);
      innerY += 6;
    }
    innerY += 2;
  }

  // Recommendation box
  innerY += 4;
  setFill(doc, [255, 255, 255]);
  doc.rect(MARGIN_L + 8, innerY - 4, CONTENT_W - 16, 20, 'F');
  setText(doc, border);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('RECOMMENDED INTERVENTION', MARGIN_L + 12, innerY);
  setText(doc, COLOR_PRIMARY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const recClean = stripHtml(narrative.recommendation);
  const recLines = doc.splitTextToSize(recClean, CONTENT_W - 24);
  doc.text(recLines, MARGIN_L + 12, innerY + 7);

  return y + cardH + 14;
}

/**
 * Strip HTML tags from a string (for PDF text output).
 */
function stripHtml(html: string): string {
  return html
    .replace(/<strong>/g, '')
    .replace(/<\/strong>/g, '')
    .replace(/<b>/g, '')
    .replace(/<\/b>/g, '')
    .replace(/<em>/g, '')
    .replace(/<\/em>/g, '')
    .replace(/<i>/g, '')
    .replace(/<\/i>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&middot;/g, '·')
    .replace(/&ndash;/g, '–')
    .replace(/&times;/g, '×')
    .replace(/&ge;/g, '≥')
    .replace(/&le;/g, '≤')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Add a section heading.
 */
function addSectionHeading(doc: jsPDF, text: string, y: number): number {
  if (y > PAGE_H - MARGIN_B - 40) {
    doc.addPage();
    y = MARGIN_T;
  }
  setText(doc, COLOR_HEADER_FILL);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(text, MARGIN_L, y);
  setDraw(doc, COLOR_ACCENT);
  doc.setLineWidth(0.8);
  doc.line(MARGIN_L, y + 3, MARGIN_L + 30, y + 3);
  return y + 12;
}

/**
 * Add a data table.
 */
function addTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  colRatios: number[],
  y: number
): number {
  const colWidths = colRatios.map(r => r * CONTENT_W);
  const rowH = 14;
  const headerH = 16;

  // Check page break
  const totalH = headerH + rows.length * rowH + 10;
  if (y + totalH > PAGE_H - MARGIN_B) {
    doc.addPage();
    y = MARGIN_T;
  }

  // Header
  setFill(doc, COLOR_HEADER_FILL);
  doc.rect(MARGIN_L, y, CONTENT_W, headerH, 'F');
  setText(doc, COLOR_WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  let x = MARGIN_L;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 4, y + 11);
    x += colWidths[i];
  }
  y += headerH;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    // Alternating background
    if (r % 2 === 0) {
      setFill(doc, [255, 255, 255]);
    } else {
      setFill(doc, [238, 240, 240]);
    }
    doc.rect(MARGIN_L, y, CONTENT_W, rowH, 'F');

    setText(doc, COLOR_PRIMARY);
    x = MARGIN_L;
    for (let i = 0; i < row.length; i++) {
      const lines = doc.splitTextToSize(row[i], colWidths[i] - 8);
      doc.text(lines[0] || '', x + 4, y + 10);
      x += colWidths[i];
    }
    y += rowH;
  }

  // Border
  setDraw(doc, COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_L, y - rows.length * rowH - headerH, CONTENT_W, headerH + rows.length * rowH);

  return y + 10;
}

// ── Report generators ──

export function generateOverviewReport(data: OverviewData, narrative: Narrative): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const totalPages = 2; // approximate; jsPDF doesn't know total pages easily
  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  let y = addTitleBlock(doc, 'Division Overview Report',
    `El Salvador Division — Latest Quarter: ${data.latestMonth}`, generatedAt);

  // Executive Brief
  y = addNarrative(doc, narrative, y);

  // KPI table
  y = addSectionHeading(doc, 'Key Performance Indicators', y);
  const kpiRows = [
    ['Division Avg RCSI', data.kpis.avgRcsi.toFixed(3)],
    ['Sustainable Schools', `${data.kpis.sustainableCount} / ${data.schoolCount}`],
    ['Total Research Outputs', data.kpis.totalResearch.toLocaleString()],
    ['Publication Rate', `${(data.kpis.publicationRate * 100).toFixed(1)}%`],
    ['Utilization Rate', `${(data.kpis.utilizationRate * 100).toFixed(1)}%`],
    ['Full Papers', data.kpis.fullPapers.toLocaleString()],
    ['Abstracts', data.kpis.abstracts.toLocaleString()],
  ];
  y = addTable(doc, ['Metric', 'Value'], kpiRows, [0.6, 0.4], y);

  // Milestone distribution
  y = addSectionHeading(doc, 'Milestone Distribution (Latest Quarter)', y);
  const msRows = data.milestoneBuckets.map((count, i) => [`M${i}`, count.toString()]);
  y = addTable(doc, ['Milestone', 'Schools'], msRows, [0.5, 0.5], y);

  // Dimension averages
  y = addSectionHeading(doc, 'Division Average per Sub-Index', y);
  const dimRows = DIMENSIONS.map(d => [
    `${d} — ${DIMENSION_META[d].name}`,
    (data.avgDims[d] ?? 0).toFixed(3),
    `M${DIMENSION_META[d].milestone}`,
  ]);
  y = addTable(doc, ['Sub-Index', 'Avg Score', 'Milestone'], dimRows, [0.55, 0.25, 0.20], y);

  // RCSI trend
  y = addSectionHeading(doc, 'Quarterly RCSI Trend', y);
  const trendRows = data.trend.map(t => [t.month, t.rcsi.toFixed(3)]);
  y = addTable(doc, ['Quarter', 'Division Avg RCSI'], trendRows, [0.5, 0.5], y);

  // Theme distribution
  if (y > PAGE_H - MARGIN_B - 80) { doc.addPage(); y = MARGIN_T; }
  y = addSectionHeading(doc, 'Research Themes', y);
  const themeRows = Object.entries(data.themeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([theme, count]) => [theme, count.toString()]);
  y = addTable(doc, ['Theme', 'Outputs'], themeRows, [0.7, 0.3], y);

  // Add page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    addHeaderFooter(doc, 'Division Overview Report', i, pages);
  }

  return doc.output('blob');
}

export function generateSchoolsReport(schools: SchoolRow[], narrative: Narrative): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  let y = addTitleBlock(doc, 'School Explorer Report',
    `El Salvador Division — ${schools.length} Schools`, generatedAt);

  y = addNarrative(doc, narrative, y);

  // Top 5 schools
  y = addSectionHeading(doc, 'Top 5 Schools by RCSI', y);
  const sorted = [...schools].sort((a, b) => b.rcsi - a.rcsi);
  const top5 = sorted.slice(0, 5).map((s, i) => [
    `${i + 1}`, s.name, s.rcsi.toFixed(3), `M${s.milestone}`,
    s.dims.A.toFixed(2), s.researchCount.toString(),
  ]);
  y = addTable(doc, ['Rank', 'School', 'RCSI', 'Milestone', 'A', 'Research'],
    top5, [0.08, 0.30, 0.14, 0.16, 0.12, 0.20], y);

  // Bottom 5 schools
  y = addSectionHeading(doc, 'Bottom 5 Schools by RCSI', y);
  const bottom5 = sorted.slice(-5).reverse().map((s, i) => [
    `${schools.length - 4 + i}`, s.name, s.rcsi.toFixed(3), `M${s.milestone}`,
    s.dims.A.toFixed(2), s.researchCount.toString(),
  ]);
  y = addTable(doc, ['Rank', 'School', 'RCSI', 'Milestone', 'A', 'Research'],
    bottom5, [0.08, 0.30, 0.14, 0.16, 0.12, 0.20], y);

  // Full ranking table
  if (y > PAGE_H - MARGIN_B - 60) { doc.addPage(); y = MARGIN_T; }
  y = addSectionHeading(doc, 'Full School Ranking', y);
  const allRows = sorted.map((s, i) => [
    `${i + 1}`, s.name, s.rcsi.toFixed(3), `M${s.milestone}`,
    s.dims.R.toFixed(2), s.dims.A.toFixed(2), s.dims.C.toFixed(2),
    s.dims.S.toFixed(2), s.dims.I.toFixed(2), s.dims.P.toFixed(2), s.dims.M.toFixed(2),
  ]);
  y = addTable(doc,
    ['#', 'School', 'RCSI', 'MS', 'R', 'A', 'C', 'S', 'I', 'P', 'M'],
    allRows,
    [0.05, 0.18, 0.10, 0.07, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
    y);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    addHeaderFooter(doc, 'School Explorer Report', i, pages);
  }

  return doc.output('blob');
}

export function generateResearchReport(data: OverviewData, narrative: Narrative): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  let y = addTitleBlock(doc, 'Research Analytics Report',
    `El Salvador Division — ${data.kpis.totalResearch.toLocaleString()} Research Outputs`, generatedAt);

  y = addNarrative(doc, narrative, y);

  // Research KPIs
  y = addSectionHeading(doc, 'Research KPIs', y);
  const kpiRows = [
    ['Total Outputs', data.kpis.totalResearch.toLocaleString()],
    ['Published', `${data.kpis.publishedCount.toLocaleString()} (${(data.kpis.publicationRate * 100).toFixed(1)}%)`],
    ['Utilized', `${data.kpis.utilizedCount.toLocaleString()} (${(data.kpis.utilizationRate * 100).toFixed(1)}%)`],
    ['Full Papers', data.kpis.fullPapers.toLocaleString()],
    ['Abstracts', data.kpis.abstracts.toLocaleString()],
  ];
  y = addTable(doc, ['Metric', 'Value'], kpiRows, [0.5, 0.5], y);

  // Theme x Status matrix
  y = addSectionHeading(doc, 'Theme × Status Matrix', y);
  const statusHeaders = ['Theme', ...data.matrix.statuses.map(s => s.replace('_', ' ')), 'Total'];
  const matrixRows = data.matrix.themes.map(theme => {
    const total = data.matrix.statuses.reduce((sum, s) => sum + (data.matrix.data[theme]?.[s] ?? 0), 0);
    return [theme, ...data.matrix.statuses.map(s => (data.matrix.data[theme]?.[s] ?? 0).toString()), total.toString()];
  });
  const nCols = statusHeaders.length;
  const colRatio = 0.85 / nCols;
  y = addTable(doc, statusHeaders, matrixRows,
    [0.15, ...Array(nCols - 1).fill(colRatio)], y);

  // Rank x Education heatmap (as table)
  if (y > PAGE_H - MARGIN_B - 80) { doc.addPage(); y = MARGIN_T; }
  y = addSectionHeading(doc, 'Teacher Rank × Education (Research Output Count)', y);
  const heatHeaders = ['Rank', ...data.heatmap.educations, 'Total'];
  const heatRows = data.heatmap.ranks.map(rank => {
    const total = data.heatmap.educations.reduce((sum, ed) => sum + (data.heatmap.data[rank]?.[ed] ?? 0), 0);
    return [rank, ...data.heatmap.educations.map(ed => (data.heatmap.data[rank]?.[ed] ?? 0).toString()), total.toString()];
  });
  const hCols = heatHeaders.length;
  const hRatio = 0.88 / hCols;
  y = addTable(doc, heatHeaders, heatRows,
    [0.22, ...Array(hCols - 1).fill(hRatio)], y);

  // Year trend
  y = addSectionHeading(doc, 'Research Outputs per Year', y);
  const yearRows = data.yearTrend.map(yt => [yt.year, yt.count.toString()]);
  y = addTable(doc, ['Year', 'Outputs'], yearRows, [0.5, 0.5], y);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    addHeaderFooter(doc, 'Research Analytics Report', i, pages);
  }

  return doc.output('blob');
}

export function generateTwinReport(
  result: TwinResult,
  narrative: Narrative,
  schoolName: string
): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  let y = addTitleBlock(doc, 'Digital Twin Simulation Report',
    `${schoolName} — Baseline: ${result.baselineMonth}`, generatedAt);

  y = addNarrative(doc, narrative, y);

  // Actual vs Projected comparison
  y = addSectionHeading(doc, 'Actual vs Projected', y);
  const cmpRows = [
    ['RCSI', result.actual.rcsi.toFixed(3), result.projected.rcsi.toFixed(3),
      (result.delta.rcsi >= 0 ? '+' : '') + result.delta.rcsi.toFixed(3)],
    ['Milestone', `M${result.actual.milestone}`, `M${result.projected.milestone}`,
      result.delta.milestone > 0 ? `+${result.delta.milestone}` : result.delta.milestone.toString()],
    ['Sustainable', result.actual.sustainable ? 'Yes' : 'No',
      result.projected.sustainable ? 'Yes' : 'No', ''],
  ];
  y = addTable(doc, ['Metric', 'Actual', 'Projected', 'Change'], cmpRows, [0.25, 0.25, 0.25, 0.25], y);

  // Per-dimension comparison
  y = addSectionHeading(doc, 'Per-Dimension Comparison', y);
  const dimRows = result.dimensionComparison.map(c => [
    `${c.dimension} — ${DIMENSION_META[c.dimension].name}`,
    c.actual.toFixed(3),
    c.projected.toFixed(3),
    (c.delta >= 0 ? '+' : '') + c.delta.toFixed(3),
  ]);
  y = addTable(doc, ['Sub-Index', 'Actual', 'Projected', 'Delta'], dimRows, [0.45, 0.18, 0.18, 0.19], y);

  // Next threshold
  if (y > PAGE_H - MARGIN_B - 60) { doc.addPage(); y = MARGIN_T; }
  y = addSectionHeading(doc, 'Next Milestone Threshold', y);
  const actualNext = result.actual.nextThreshold;
  const projectedNext = result.projected.nextThreshold;
  const nextRows = [
    ['Actual', actualNext ? `${actualNext.dimension} ≥ ${actualNext.value.toFixed(2)}` : 'M6 reached',
     actualNext ? actualNext.current.toFixed(2) : '—',
     actualNext ? (actualNext.value - actualNext.current).toFixed(2) : '—'],
    ['Projected', projectedNext ? `${projectedNext.dimension} ≥ ${projectedNext.value.toFixed(2)}` : 'M6 reached',
     projectedNext ? projectedNext.current.toFixed(2) : '—',
     projectedNext ? (projectedNext.value - projectedNext.current).toFixed(2) : '—'],
  ];
  y = addTable(doc, ['State', 'Next Threshold', 'Current', 'Gap'], nextRows, [0.20, 0.35, 0.20, 0.25], y);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    addHeaderFooter(doc, 'Digital Twin Simulation Report', i, pages);
  }

  return doc.output('blob');
}

/**
 * Trigger a browser download for a PDF Blob.
 */
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
