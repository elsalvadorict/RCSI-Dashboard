'use client';

import { SURVEY_DIMENSIONS, LIKERT_SCALE } from '@/lib/surveyQuestions';
import { DIMENSION_META } from '@/lib/rcsi';

/**
 * PrintableQuestionnaire — a self-contained HTML document that opens in a new
 * window and triggers the browser's print dialog. Designed for offline data
 * collection: school heads print the 35-item survey, distribute it to
 * teachers, and enter the responses later via the Survey tab.
 */
export function printQuestionnaire() {
  const html = generatePrintableHtml();
  const printWindow = window.open('', '_blank', 'width=820,height=900');
  if (!printWindow) {
    alert('Please allow pop-ups to print the questionnaire.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  // Wait for fonts/layout to settle before printing
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };
}

function generatePrintableHtml(): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const sections = SURVEY_DIMENSIONS.map(dim => {
    const questions = dim.questions.map((q, i) => {
      const checkboxes = LIKERT_SCALE.map(opt => `
        <td class="checkbox-cell">
          <div class="checkbox"></div>
          <div class="checkbox-label">${opt.short}</div>
        </td>
      `).join('');
      return `
        <tr class="question-row">
          <td class="q-num">${q.id}</td>
          <td class="q-text">${q.text}</td>
          ${checkboxes}
        </tr>
      `;
    }).join('');

    return `
      <div class="dimension-section">
        <div class="dimension-header">
          <span class="dim-code">${dim.code}</span>
          <span class="dim-name">${dim.name} — ${dim.description}</span>
          <span class="dim-milestone">Milestone M${dim.milestone}</span>
        </div>
        <table class="questions-table">
          <thead>
            <tr>
              <th class="q-num-h">#</th>
              <th class="q-text-h">Question</th>
              ${LIKERT_SCALE.map(opt => `<th class="scale-h">${opt.short}<br><span class="scale-value">${opt.value}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${questions}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RCSI Quarterly Survey Questionnaire</title>
<style>
  @page {
    size: A4;
    margin: 14mm 12mm 16mm 12mm;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1a1a2e;
    font-size: 9.5pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cover {
    border-bottom: 2.5pt solid #0e7c7b;
    padding-bottom: 10pt;
    margin-bottom: 14pt;
  }
  .cover .kicker {
    font-size: 8pt;
    letter-spacing: 2.5pt;
    text-transform: uppercase;
    color: #0e7c7b;
    font-weight: 600;
    margin-bottom: 3pt;
  }
  .cover h1 {
    font-size: 18pt;
    margin: 0 0 4pt 0;
    color: #1a1a2e;
    font-weight: 700;
    line-height: 1.2;
  }
  .cover .subtitle {
    font-size: 10pt;
    color: #6f7578;
    margin-bottom: 8pt;
  }
  .cover .meta {
    font-size: 8.5pt;
    color: #6f7578;
    display: flex;
    gap: 20pt;
    flex-wrap: wrap;
  }
  .cover .meta strong { color: #1a1a2e; }

  /* School info form fields */
  .school-info {
    background: #f5f7f7;
    border: 1px solid #c6d0d5;
    border-radius: 4pt;
    padding: 10pt 12pt;
    margin-bottom: 16pt;
  }
  .school-info h2 {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 1pt;
    color: #49606e;
    margin: 0 0 8pt 0;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8pt;
  }
  .info-field {
    font-size: 8.5pt;
  }
  .info-field .label {
    color: #6f7578;
    margin-bottom: 2pt;
  }
  .info-field .blank {
    border-bottom: 1px solid #6f7578;
    min-height: 14pt;
  }

  /* Likert scale legend */
  .scale-legend {
    margin: 8pt 0 14pt 0;
    padding: 6pt 10pt;
    background: #eef4f4;
    border-left: 3pt solid #0e7c7b;
    font-size: 8pt;
    color: #1a1a2e;
  }
  .scale-legend strong { color: #0e7c7b; }

  /* Dimension sections */
  .dimension-section {
    margin-bottom: 14pt;
    page-break-inside: avoid;
  }
  .dimension-header {
    display: flex;
    align-items: center;
    gap: 8pt;
    background: #49606e;
    color: white;
    padding: 5pt 10pt;
    border-radius: 3pt 3pt 0 0;
    font-size: 9pt;
  }
  .dim-code {
    font-weight: 700;
    font-size: 11pt;
    background: #0e7c7b;
    padding: 1pt 6pt;
    border-radius: 2pt;
  }
  .dim-name { flex: 1; }
  .dim-milestone {
    font-size: 8pt;
    opacity: 0.9;
    background: rgba(255,255,255,0.15);
    padding: 1pt 6pt;
    border-radius: 2pt;
  }

  /* Questions table */
  .questions-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
  }
  .questions-table thead th {
    background: #e7eaeb;
    color: #1a1a2e;
    font-weight: 600;
    padding: 4pt 3pt;
    text-align: center;
    border: 1px solid #c6d0d5;
    font-size: 7.5pt;
  }
  .questions-table thead .q-num-h { width: 22pt; }
  .questions-table thead .q-text-h { text-align: left; }
  .questions-table theth .scale-h { width: 38pt; }
  .questions-table thead .scale-value {
    font-size: 6.5pt;
    font-weight: 400;
    color: #6f7578;
  }
  .questions-table tbody tr:nth-child(even) {
    background: #f9fafa;
  }
  .question-row td {
    padding: 5pt 4pt;
    border: 1px solid #d6dde1;
    vertical-align: top;
  }
  .q-num {
    text-align: center;
    font-weight: 600;
    color: #49606e;
    font-size: 8pt;
  }
  .q-text { line-height: 1.35; }
  .checkbox-cell {
    text-align: center;
    width: 38pt;
  }
  .checkbox {
    width: 11pt;
    height: 11pt;
    border: 1.2pt solid #49606e;
    border-radius: 2pt;
    margin: 0 auto 2pt auto;
    background: white;
  }
  .checkbox-label {
    font-size: 6.5pt;
    color: #6f7578;
  }

  /* Footer */
  .footer {
    margin-top: 18pt;
    padding-top: 8pt;
    border-top: 1px solid #c6d0d5;
    font-size: 7.5pt;
    color: #6f7578;
    display: flex;
    justify-content: space-between;
  }
  .signature-block {
    margin-top: 14pt;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20pt;
    font-size: 8pt;
    color: #1a1a2e;
  }
  .signature-block .line {
    border-bottom: 1px solid #1a1a2e;
    height: 18pt;
    margin-bottom: 2pt;
  }
  .signature-block .label {
    color: #6f7578;
    font-size: 7.5pt;
  }

  /* Page break helpers */
  .page-break { page-break-before: always; }
</style>
</head>
<body>

<div class="cover">
  <div class="kicker">El Salvador Division · RCSI Quarterly Survey</div>
  <h1>Research Culture Sustainability Index — Survey Questionnaire</h1>
  <div class="subtitle">A 35-item instrument for measuring the seven sub-indices of research culture</div>
  <div style="display:inline-block; background:#fef3c7; border:1px solid #f59e0b; border-radius:3pt; padding:2pt 8pt; font-size:8pt; font-weight:600; color:#92400e; margin-bottom:8pt;">
    Prototype — For Approval
  </div>
  <div class="meta">
    <span>School: <strong>______________________</strong></span>
    <span>Quarter: <strong>______________________</strong></span>
    <span>Date: <strong>${today}</strong></span>
    <span>Respondent: <strong>______________________</strong></span>
  </div>
</div>

<div class="school-info">
  <h2>School &amp; Respondent Information</h2>
  <div class="info-grid">
    <div class="info-field"><div class="label">School Name</div><div class="blank"></div></div>
    <div class="info-field"><div class="label">School ID No.</div><div class="blank"></div></div>
    <div class="info-field"><div class="label">Quarter (YYYY-MM)</div><div class="blank"></div></div>
    <div class="info-field"><div class="label">Respondent Name</div><div class="blank"></div></div>
    <div class="info-field"><div class="label">Position / Designation</div><div class="blank"></div></div>
    <div class="info-field"><div class="label">Date Completed</div><div class="blank"></div></div>
  </div>
</div>

<div class="scale-legend">
  <strong>Response Scale:</strong> For each statement, mark the box that best describes the current state at your school.
  &nbsp;&nbsp;
  <strong>None (0)</strong> = Not at all ·
  <strong>Low (0.25)</strong> = Minimal ·
  <strong>Mid (0.5)</strong> = Partial ·
  <strong>High (0.75)</strong> = Substantial ·
  <strong>Full (1.0)</strong> = Fully realized
</div>

${sections}

<div class="signature-block">
  <div>
    <div class="line"></div>
    <div class="label">Signature of Respondent / Date</div>
  </div>
  <div>
    <div class="line"></div>
    <div class="label">Signature of School Head / Date</div>
  </div>
</div>

<div class="footer">
  <span>Copyright 2026 El Salvador Division</span>
  <span>RCSI Quarterly Survey · Print Edition</span>
</div>

</body>
</html>`;
}
