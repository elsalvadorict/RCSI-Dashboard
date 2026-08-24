/**
 * Generate the Formal Turnover Document for the RCSI Dashboard.
 * Output: /home/z/my-project/download/RCSI-Dashboard-Turnover-Document.docx
 */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, TableLayoutType, PageOrientation, Header, Footer,
  PageNumber, NumberFormat, LevelFormat, convertInchesToTwip,
  TabStopType, TabStopPosition,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Palette: Cool + Heavy + Calm (formal, authoritative) ──
const P = {
  primary: "162032",
  body: "000000",
  secondary: "5B6B7D",
  accent: "0E7C7B",
  surface: "F5F7FA",
  bg: "FFFFFF",
};

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const allNoBorders = {
  ...noBorders,
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: P.secondary },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: P.secondary },
  left: { style: BorderStyle.SINGLE, size: 4, color: P.secondary },
  right: { style: BorderStyle.SINGLE, size: 4, color: P.secondary },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "D0D5DD" },
  insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "D0D5DD" },
};

// ── Helpers ──
function bodyPara(text, opts = {}) {
  return new Paragraph({
    spacing: { line: 312, after: 120 },
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    indent: opts.indent !== undefined ? opts.indent : { firstLine: 480 },
    children: [new TextRun({
      text, size: 24, color: P.body,
      font: { ascii: "Times New Roman", eastAsia: "SimSun" },
    })],
  });
}

function bodyParaRich(runs, opts = {}) {
  return new Paragraph({
    spacing: { line: 312, after: 120 },
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    indent: opts.indent !== undefined ? opts.indent : { firstLine: 480 },
    children: runs.map(r => new TextRun({
      text: r.text, size: 24, color: r.color || P.body, bold: r.bold || false, italics: r.italics || false,
      font: { ascii: "Times New Roman", eastAsia: "SimSun" },
    })),
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200, line: 312 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({
      text, size: 32, bold: true, color: P.primary,
      font: { ascii: "Times New Roman", eastAsia: "SimHei" },
    })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160, line: 312 },
    children: [new TextRun({
      text, size: 30, bold: true, color: P.primary,
      font: { ascii: "Times New Roman", eastAsia: "SimHei" },
    })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120, line: 312 },
    children: [new TextRun({
      text, size: 28, bold: true, color: P.accent,
      font: { ascii: "Times New Roman", eastAsia: "SimHei" },
    })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { line: 312, after: 80 },
    indent: { left: 720 + (level * 360), hanging: 360 },
    children: [
      new TextRun({ text: "\u2022  ", size: 24, color: P.accent, font: { ascii: "Times New Roman" } }),
      new TextRun({ text, size: 24, color: P.body, font: { ascii: "Times New Roman", eastAsia: "SimSun" } }),
    ],
  });
}

function numberedItem(num, text) {
  return new Paragraph({
    spacing: { line: 312, after: 80 },
    indent: { left: 720, hanging: 360 },
    children: [
      new TextRun({ text: `${num}.  `, size: 24, bold: true, color: P.accent, font: { ascii: "Times New Roman" } }),
      new TextRun({ text, size: 24, color: P.body, font: { ascii: "Times New Roman", eastAsia: "SimSun" } }),
    ],
  });
}

function tableCell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      spacing: { line: 280 },
      alignment: opts.alignment || AlignmentType.LEFT,
      indent: { firstLine: 0 },
      children: [new TextRun({
        text, size: opts.size || 22,
        bold: opts.bold || false,
        color: opts.color || P.body,
        font: { ascii: "Times New Roman", eastAsia: "SimSun" },
      })],
    })],
  });
}

// ── Cover Page (R1 style — Pure Paragraph Left) ──
function buildCover() {
  const padL = 1200, padR = 800;
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };

  const children = [
    // Top whitespace
    new Paragraph({ spacing: { before: 2400 } }),

    // English label with accent bottom border
    new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({
        text: "F O R M A L   T U R N O V E R   D O C U M E N T",
        size: 18, color: P.accent, font: { ascii: "Calibri" }, characterSpacing: 40,
      })],
    }),

    // Main title
    new Paragraph({
      indent: { left: padL },
      spacing: { after: 100, line: 920, lineRule: "atLeast" },
      children: [new TextRun({
        text: "El Salvador Division", size: 80, bold: true,
        color: P.primary, font: { ascii: "Arial", eastAsia: "SimHei" },
      })],
    }),
    new Paragraph({
      indent: { left: padL },
      spacing: { after: 100, line: 920, lineRule: "atLeast" },
      children: [new TextRun({
        text: "Research Culture", size: 80, bold: true,
        color: P.primary, font: { ascii: "Arial", eastAsia: "SimHei" },
      })],
    }),
    new Paragraph({
      indent: { left: padL },
      spacing: { after: 300, line: 920, lineRule: "atLeast" },
      children: [new TextRun({
        text: "Sustainability Index", size: 80, bold: true,
        color: P.accent, font: { ascii: "Arial", eastAsia: "SimHei" },
      })],
    }),

    // Subtitle
    new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({
        text: "Interactive Dashboard & Digital Twin Sandbox",
        size: 28, color: P.secondary, font: { ascii: "Arial" },
      })],
    }),

    // Meta info lines
    new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: "Turnover Date: July 2026", size: 24, color: P.secondary, font: { ascii: "Arial" } })],
    }),
    new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: "Application Version: 2.0 (Prototype \u2014 For Approval)", size: 24, color: P.secondary, font: { ascii: "Arial" } })],
    }),
    new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: "Prepared for: El Salvador Division Leadership Team", size: 24, color: P.secondary, font: { ascii: "Arial" } })],
    }),
    new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: "Document Classification: Official", size: 24, color: P.secondary, font: { ascii: "Arial" } })],
    }),

    // Bottom whitespace
    new Paragraph({ spacing: { before: 2400 } }),

    // Footer
    new Paragraph({
      indent: { left: padL, right: padR },
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
      spacing: { before: 200 },
      children: [
        new TextRun({ text: "Copyright 2026 El Salvador Division", size: 16, color: P.secondary, font: { ascii: "Arial" } }),
        new TextRun({ text: "                                        " }),
        new TextRun({ text: "RCSI-TURNOVER-v1.0", size: 16, color: P.secondary, font: { ascii: "Arial" } }),
      ],
    }),
  ];

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg },
        borders: noBorders,
        children,
      })],
    })],
  })];
}

// ── Body content ──
const body = [];

// ===== I. INTRODUCTION =====
body.push(h1('I. Introduction and Purpose of Turnover'));

body.push(bodyPara(
  'This Formal Turnover Document officially transfers the El Salvador Division Research Culture Sustainability Index (RCSI) Interactive Dashboard and Digital Twin Sandbox (hereinafter referred to as "the Application") from the development team to the El Salvador Division. The purpose of this turnover is to formally hand over all rights, responsibilities, source code, documentation, and operational knowledge associated with the Application to the Division\u2019s leadership team and designated administrators.'
));

body.push(bodyPara(
  'The Application was developed to address the Division\u2019s need for a comprehensive, data-driven monitoring system that tracks the research culture sustainability of all schools within the El Salvador Division. It is built on the seven-dimension RCSI framework (Readiness, Awareness, Capacity, Structured Support, Institutional Anchoring, Community of Practice, and Impact Realization) and the M0\u2013M6 milestone progression model, which together provide a holistic view of each school\u2019s research culture maturity.'
));

body.push(bodyPara(
  'This document serves as the official record of transfer and should be retained by the Division as part of its information technology and administrative records. It includes a complete inventory of the turned-over assets, the terms and conditions of the transfer, the roles and responsibilities of the receiving party, and the technical documentation necessary for the Division to operate, maintain, and further develop the Application.'
));

// ===== II. DESCRIPTION OF THE APPLICATION =====
body.push(h1('II. Description of the Turned-Over Application'));

body.push(h2('A. Application Overview'));
body.push(bodyPara(
  'The Application is a web-based interactive dashboard built on the Next.js 16 framework with TypeScript, Prisma ORM, and a SQLite database. It features a modern dark-mode user interface with a teal accent palette and is designed to be responsive across desktop, tablet, and mobile devices. The Application is currently designated as Version 2.0 (Prototype \u2014 For Approval), pending formal endorsement by the Division Superintendents.'
));

body.push(h2('B. Eight Functional Modules'));
body.push(bodyPara('The Application consists of eight (8) integrated modules, each accessible via a tab in the main navigation:'));

body.push(numberedItem(1, 'Overview Tab \u2014 Displays division-wide Key Performance Indicators (KPIs), the RCSI trend chart, milestone distribution, and an auto-generated Executive Brief with historical quarter-over-quarter comparison. Includes a quarter selector and a Download PDF button for report generation.'));
body.push(numberedItem(2, 'Schools Tab \u2014 Presents a sortable and searchable table of all schools with sparklines, milestone badges, and clickable rows that open a detailed school profile dialog (radar chart, quarterly trend, research records).'));
body.push(numberedItem(3, 'Research Tab \u2014 Features a Theme \u00d7 Status matrix heatmap, a Teacher Rank \u00d7 Education heatmap, summary KPIs, and a Top 10 Teacher-Researchers recognition section with gold, silver, and bronze medals.'));
body.push(numberedItem(4, 'Twin Sandbox Tab \u2014 A real-time what-if simulator with four sub-tabs: Policy Levers (Training Frequency, Mentorship Ratio, Support Budget, Leadership Commitment, Collaboration Frequency), Intervention (direct dimension sliders), Weights, and Thresholds. Includes a reactive Executive Brief that changes tone based on simulation outcomes.'));
body.push(numberedItem(5, 'Trends Tab \u2014 Multi-quarter trend analysis with a line chart showing RCSI and all seven sub-indices across quarters, a radar overlay of the four most recent quarters, and a dimension-by-dimension change table with sparklines.'));
body.push(numberedItem(6, 'Survey Tab \u2014 Two data collection instruments: a 35-item Quarterly Survey questionnaire (5 questions per RCSI dimension) and a 14-field Research Metadata form. Both feature a school dropdown pre-populated with the 24 real El Salvador Division schools, automatic theme detection from research titles, a Load Example button, and a Print Questionnaire function for offline data collection.'));
body.push(numberedItem(7, 'Archive Tab \u2014 Quarter snapshots with per-quarter CSV export, full research metadata export, and a complete upload audit log showing every merge and replace operation.'));
body.push(numberedItem(8, 'Upload Tab \u2014 A drag-and-drop portal with Merge (recommended) and Replace modes, schema validation, concurrency-safe uploads (mutex with auto-retry), and automatic file-type detection for CSV, XLSX, and XLS files.'));

body.push(h2('C. AI-Powered Features'));
body.push(bodyPara(
  'The Application includes two artificial intelligence features powered by the Z.AI GLM large language model:'
));
body.push(bullet('AI Research Advisor \u2014 A floating chat panel accessible from any page. Decision-makers can ask questions in plain English (e.g., "Which schools need the most help?" or "What intervention should we prioritize?") and receive data-grounded answers referencing live dashboard data.'));
body.push(bullet('Automated Quarterly Report Writer \u2014 A "Generate Quarterly Report" button in the header that produces a comprehensive 2\u20133 page narrative report with seven sections: Executive Summary, Division-Wide Progress, Milestone Analysis, Research Pipeline, School Highlights, Recommended Interventions, and Conclusion. The report can be downloaded as Markdown or plain text.'));

body.push(h2('D. Technical Specifications'));
body.push(bodyPara('The Application is built on the following technology stack:'));

// Technical specs table
body.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  layout: TableLayoutType.FIXED,
  borders: tableBorders,
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        tableCell('Component', { width: 30, bold: true, color: "FFFFFF", shading: P.accent, alignment: AlignmentType.LEFT }),
        tableCell('Technology', { width: 70, bold: true, color: "FFFFFF", shading: P.accent, alignment: AlignmentType.LEFT }),
      ],
    }),
    new TableRow({ children: [tableCell('Framework', { width: 30, shading: P.surface }), tableCell('Next.js 16 with App Router', { width: 70, shading: P.surface })] }),
    new TableRow({ children: [tableCell('Language', { width: 30 }), tableCell('TypeScript 5', { width: 70 })] }),
    new TableRow({ children: [tableCell('Database', { width: 30, shading: P.surface }), tableCell('SQLite via Prisma ORM', { width: 70, shading: P.surface })] }),
    new TableRow({ children: [tableCell('UI Components', { width: 30 }), tableCell('shadcn/ui (New York style) with Tailwind CSS 4', { width: 70 })] }),
    new TableRow({ children: [tableCell('Charts', { width: 30, shading: P.surface }), tableCell('Recharts (responsive, dark-mode)', { width: 70, shading: P.surface })] }),
    new TableRow({ children: [tableCell('AI Integration', { width: 30 }), tableCell('Z.AI GLM-4 via z-ai-web-dev-sdk', { width: 70 })] }),
    new TableRow({ children: [tableCell('PDF Generation', { width: 30, shading: P.surface }), tableCell('jsPDF (client-side), ReportLab (User Manual)', { width: 70, shading: P.surface })] }),
    new TableRow({ children: [tableCell('File Parsing', { width: 30 }), tableCell('xlsx (Excel), PapaParse (CSV)', { width: 70 })] }),
    new TableRow({ children: [tableCell('Authentication', { width: 30, shading: P.surface }), tableCell('NextAuth.js v4 (available, not yet configured)', { width: 70, shading: P.surface })] }),
  ],
}));

body.push(new Paragraph({ spacing: { after: 200 } }));

// ===== III. INVENTORY OF TURNED-OVER ASSETS =====
body.push(h1('III. Inventory of Turned-Over Assets'));

body.push(bodyPara('The following assets are formally transferred to the El Salvador Division:'));

body.push(h2('A. Source Code and Application Files'));
body.push(bullet('Complete Next.js application source code (TypeScript)'));
body.push(bullet('Prisma database schema and migration scripts'));
body.push(bullet('Database seed script and clean-slate script for pilot deployment'));
body.push(bullet('All dashboard component files (Overview, Schools, Research, Twin Sandbox, Trends, Survey, Archive, Upload)'));
body.push(bullet('AI integration modules (chat endpoint, report generation endpoint)'));
body.push(bullet('Narrative generation engine and policy lever mapping logic'));
body.push(bullet('Printable questionnaire template and PDF report generator'));

body.push(h2('B. Documentation'));
body.push(bullet('User Manual (Version 2.0) \u2014 28-page PDF covering all eight modules, the RCSI framework, data dictionary, and FAQ. Accessible via the "Manual" button in the Application header.'));
body.push(bullet('This Formal Turnover Document'));
body.push(bullet('Inline code documentation (TypeScript interfaces and comments)'));

body.push(h2('C. Data Assets'));
body.push(bullet('Pre-loaded demo dataset: 30 schools, 4 quarters (2026-Q1 to Q4), 1,899 research records'));
body.push(bullet('Official El Salvador Division school list (24 real schools with DepEd IDs) embedded in the Application'));
body.push(bullet('RCSI computation engine with the seven-dimension framework and M0\u2013M6 milestone classifier'));

body.push(h2('D. Configuration and Deployment Assets'));
body.push(bullet('Caddyfile (gateway configuration)'));
body.push(bullet('Environment configuration files'));
body.push(bullet('Package.json with all dependencies'));
body.push(bullet('ESLint configuration for code quality'));

// ===== IV. TERMS AND CONDITIONS =====
body.push(h1('IV. Terms and Conditions of Transfer'));

body.push(h2('A. Ownership and Intellectual Property'));
body.push(bodyPara(
  'Upon execution of this turnover, full ownership of the Application, including all source code, documentation, data models, and associated intellectual property, is transferred to the El Salvador Division. The Division shall have the right to use, modify, distribute, and further develop the Application as it sees fit, without restriction or obligation to the development team.'
));

body.push(h2('B. Warranty Disclaimer'));
body.push(bodyPara(
  'The Application is transferred "as is" without any warranty of any kind, express or implied. The development team does not warrant that the Application will be error-free, uninterrupted, or suitable for any particular purpose. The Division assumes all responsibility for the operation and maintenance of the Application following the turnover.'
));

body.push(h2('C. Data Privacy and Security'));
body.push(bodyPara(
  'The Division shall be responsible for ensuring compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and all applicable data protection regulations. The Application stores school and teacher data in a local SQLite database. The Division should implement appropriate security measures, including access controls, regular backups, and data retention policies, before deploying the Application for production use.'
));

body.push(h2('D. AI Feature Considerations'));
body.push(bodyPara(
  'The AI-powered features (AI Research Advisor and Automated Quarterly Report Writer) rely on the Z.AI GLM large language model, which processes data via cloud API calls. The Division should review and approve the data transmission involved in these AI features before enabling them in production. The AI features can be disabled if the Division opts not to use cloud-based AI services. AI responses are based on live dashboard data but should be verified before making policy or budget decisions.'
));

body.push(h2('E. Prototype Status'));
body.push(bodyPara(
  'The Application is currently designated as "Prototype \u2014 For Approval" as indicated by the amber badge in the Application header. This status shall remain until the Division Superintendents grant formal approval. Upon approval, the Division should: (1) remove the "Prototype \u2014 For Approval" badge from the header, footer, PDF reports, and printable questionnaire; (2) add the official El Salvador Division logo to the header and printed materials; and (3) update the Application version designation as appropriate.'
));

// ===== V. ROLES AND RESPONSIBILITIES =====
body.push(h1('V. Roles and Responsibilities'));

body.push(h2('A. El Salvador Division (Receiving Party)'));
body.push(bodyPara('The Division shall assume the following responsibilities upon turnover:'));

body.push(numberedItem(1, 'Operation and Maintenance \u2014 The Division shall designate an administrator (typically an IT or data officer) responsible for the day-to-day operation of the Application, including server management, database backups, and user support.'));
body.push(numberedItem(2, 'Data Management \u2014 The Division shall oversee the quarterly data collection cycle, ensure timely uploads of survey and research metadata, and maintain the integrity of the historical data archive.'));
body.push(numberedItem(3, 'User Access Management \u2014 The Division shall control who has access to the Application and ensure that only authorized personnel can upload data or generate reports.'));
body.push(numberedItem(4, 'Approval and Branding \u2014 Upon formal approval by the Superintendents, the Division shall update the Application branding (remove the prototype badge, add the official logo) and designate the Application as an official Division tool.'));
body.push(numberedItem(5, 'Further Development \u2014 The Division may engage its own IT staff or external developers to modify, extend, or integrate the Application with other Division systems. The source code is fully transferred and no attribution is required.'));
body.push(numberedItem(6, 'AI Feature Governance \u2014 The Division shall decide whether to enable, disable, or modify the AI-powered features based on its data privacy policies and operational needs.'));

body.push(h2('B. Development Team (Turning-Over Party)'));
body.push(bodyPara(
  'The development team\u2019s responsibilities conclude upon execution of this turnover. The development team shall: (1) provide this document and all associated assets; (2) be available for a reasonable transition period (not exceeding 30 days) to answer clarifying questions about the Application\u2019s architecture or codebase; and (3) transfer all credentials, access keys, and configuration files necessary for the Division to operate the Application independently.'
));

body.push(bodyPara(
  'Following the transition period, the development team shall have no further obligation to the Division regarding the Application, except as may be mutually agreed in a separate support or maintenance contract.'
));

// ===== VI. ACCEPTANCE =====
body.push(h1('VI. Acceptance and Acknowledgement'));

body.push(bodyPara(
  'By signing below, the authorized representatives of the El Salvador Division acknowledge that they have received, reviewed, and accepted the Application and all associated assets as described in this document. The Division confirms that the Application has been demonstrated and found to be in working condition, and that all assets listed in Section III have been transferred.'
));

body.push(bodyPara(
  'The Division further acknowledges that it has read and understood the Terms and Conditions (Section IV) and the Roles and Responsibilities (Section V), and that it assumes full responsibility for the Application effective on the date of signature.'
));

body.push(new Paragraph({ spacing: { before: 600 } }));

// Signature blocks
body.push(new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  layout: TableLayoutType.FIXED,
  borders: allNoBorders,
  rows: [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: noBorders,
          margins: { top: 200, bottom: 200, left: 0, right: 200 },
          children: [
            new Paragraph({
              spacing: { after: 600 },
              children: [new TextRun({ text: "___________________________", size: 24, color: P.body, font: { ascii: "Times New Roman" } })],
            }),
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: "Division Superintendent", size: 24, bold: true, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
            }),
            new Paragraph({
              children: [new TextRun({ text: "El Salvador Division", size: 22, color: P.secondary, font: { ascii: "Times New Roman" } })],
            }),
            new Paragraph({
              spacing: { before: 200 },
              children: [new TextRun({ text: "Date: __________________", size: 22, color: P.secondary, font: { ascii: "Times New Roman" } })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: noBorders,
          margins: { top: 200, bottom: 200, left: 200, right: 0 },
          children: [
            new Paragraph({
              spacing: { after: 600 },
              children: [new TextRun({ text: "___________________________", size: 24, color: P.body, font: { ascii: "Times New Roman" } })],
            }),
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: "Development Team Representative", size: 24, bold: true, color: P.primary, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
            }),
            new Paragraph({
              children: [new TextRun({ text: "RCSI Dashboard Development", size: 22, color: P.secondary, font: { ascii: "Times New Roman" } })],
            }),
            new Paragraph({
              spacing: { before: 200 },
              children: [new TextRun({ text: "Date: __________________", size: 22, color: P.secondary, font: { ascii: "Times New Roman" } })],
            }),
          ],
        }),
      ],
    }),
  ],
}));

body.push(new Paragraph({ spacing: { before: 800 } }));

body.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 400 },
  border: { top: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 8 } },
  children: [new TextRun({
    text: "\u2014 End of Formal Turnover Document \u2014",
    size: 22, italics: true, color: P.secondary,
    font: { ascii: "Times New Roman" },
  })],
}));

// ── Build the document ──
const doc = new Document({
  creator: "El Salvador Division",
  title: "RCSI Dashboard \u2014 Formal Turnover Document",
  description: "Formal turnover of the RCSI Interactive Dashboard and Digital Twin Sandbox to the El Salvador Division",
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimSun" }, size: 24, color: P.body },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // ── Cover section (margin: 0) ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: buildCover(),
    },
    // ── Body section (standard margins) ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 4 } },
            children: [
              new TextRun({ text: "El Salvador Division RCSI Dashboard \u2014 Formal Turnover Document", size: 16, color: P.secondary, font: { ascii: "Times New Roman" } }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 4 } },
            children: [
              new TextRun({ text: "Copyright 2026 El Salvador Division  |  Page ", size: 16, color: P.secondary, font: { ascii: "Times New Roman" } }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: P.secondary, font: { ascii: "Times New Roman" } }),
              new TextRun({ text: " of ", size: 16, color: P.secondary, font: { ascii: "Times New Roman" } }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: P.secondary, font: { ascii: "Times New Roman" } }),
            ],
          })],
        }),
      },
      children: body,
    },
  ],
});

// ── Output ──
const outputPath = '/home/z/my-project/download/RCSI-Dashboard-Turnover-Document.docx';

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`Turnover document generated: ${outputPath}`);
  console.log(`Size: ${sizeKB} KB`);
}).catch((e) => {
  console.error('Generation failed:', e);
  process.exit(1);
});
