/**
 * Glossary Terms for the RCSI Dashboard
 * --------------------------------------
 * Comprehensive definitions of all key terms used across the dashboard,
 * organized by category. Each term has a short definition, a detailed
 * explanation, and cross-references to related terms.
 */

export type GlossaryCategory =
  | 'RCSI Framework'
  | 'Milestones'
  | 'Dashboard'
  | 'Data Collection'
  | 'AI Features'
  | 'Technical';

export interface GlossaryTerm {
  term: string;
  shortDef: string;
  fullDef: string;
  category: GlossaryCategory;
  related?: string[];
  seeAlso?: string;
}

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  'RCSI Framework',
  'Milestones',
  'Dashboard',
  'Data Collection',
  'AI Features',
  'Technical',
];

export const CATEGORY_COLORS: Record<GlossaryCategory, string> = {
  'RCSI Framework': '#22d3ee',   // cyan
  'Milestones': '#a78bfa',       // violet
  'Dashboard': '#34d399',        // emerald
  'Data Collection': '#fbbf24',  // amber
  'AI Features': '#fb7185',      // rose
  'Technical': '#60a5fa',        // blue
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // ── RCSI Framework ──
  {
    term: 'RCSI',
    category: 'RCSI Framework',
    shortDef: 'Research Culture Sustainability Index — the composite score (0–1) measuring a school\'s research culture maturity.',
    fullDef: 'The Research Culture Sustainability Index is a composite score formed by averaging seven sub-indices (R, A, C, S, I, P, M). It ranges from 0 to 1, where higher is better. The default formula uses equal weights of 12.5% per dimension. The RCSI is displayed to three decimal places (e.g., 0.364). It serves as the primary metric for ranking schools and tracking quarterly progress.',
    related: ['Sub-index', 'Milestone', 'Sustainable'],
  },
  {
    term: 'Sub-index',
    category: 'RCSI Framework',
    shortDef: 'One of the seven dimensions (R, A, C, S, I, P, M) that compose the RCSI, each ranging from 0 to 1.',
    fullDef: 'A sub-index is one of the seven dimensions of research culture: R (Readiness), A (Awareness), C (Capacity), S (Structured Support), I (Institutional Anchoring), P (Community of Practice), and M (Impact Realization). Each sub-index value is a decimal between 0 and 1, computed from the quarterly survey responses. The seven sub-indices are averaged (with equal 12.5% weights by default) to produce the composite RCSI.',
    related: ['RCSI', 'Readiness', 'Awareness', 'Capacity', 'Structured Support', 'Institutional Anchoring', 'Community of Practice', 'Impact Realization'],
  },
  {
    term: 'Readiness (R)',
    category: 'RCSI Framework',
    shortDef: 'School preparedness and foundational conditions for research, including infrastructure and mindset.',
    fullDef: 'Readiness (R) is the first sub-index, corresponding to milestone M0. It measures the school\'s preparedness and foundational conditions for research, including dedicated research space, internet access, library resources, allocated research time, and a designated budget line item. R is the baseline dimension — every school starts here. There is no threshold to "pass" M0; it is the starting state.',
    related: ['Sub-index', 'M0'],
  },
  {
    term: 'Awareness (A)',
    category: 'RCSI Framework',
    shortDef: 'Level of research awareness among teachers and leaders. The threshold for M0→M1 is A ≥ 0.80.',
    fullDef: 'Awareness (A) is the second sub-index, corresponding to milestone M1. It measures the level of research awareness among teachers and leaders, including knowledge of research methodologies, awareness of the division\'s research agenda, regular discussion of research in staff meetings, and awareness of publication venues. The threshold for advancing from M0 to M1 is A ≥ 0.80 — this is the most common bottleneck in the division, as the average A is currently 0.53.',
    related: ['Sub-index', 'M1', 'Threshold', 'Bottleneck'],
  },
  {
    term: 'Capacity (C)',
    category: 'RCSI Framework',
    shortDef: 'Research skills, training, and expertise of the teaching staff.',
    fullDef: 'Capacity (C) is the third sub-index, corresponding to milestone M2. It measures the research skills, training, and expertise of the teaching staff, including completion of research-methods training, ability to formulate research questions, proficiency in data analysis tools, proportion of teachers with Master\'s degrees or higher, and the presence of experienced researchers who can mentor colleagues. The default threshold for M1→M2 is C ≥ 0.50.',
    related: ['Sub-index', 'M2', 'Threshold'],
  },
  {
    term: 'Structured Support (S)',
    category: 'RCSI Framework',
    shortDef: 'Availability of budget, time, mentoring, and institutional support for research.',
    fullDef: 'Structured Support (S) is the fourth sub-index, corresponding to milestone M3. It reflects the availability of budget, time allocation, mentoring, and other institutional support for research. This includes written research policies, formally allocated research time in the school calendar, active mentoring programs, recognition of research in performance reviews (IPCRF), and seed funding for research projects. The default threshold for M2→M3 is S ≥ 0.50.',
    related: ['Sub-index', 'M3', 'Threshold'],
  },
  {
    term: 'Institutional Anchoring (I)',
    category: 'RCSI Framework',
    shortDef: 'How deeply research is embedded in school plans, policies, and regular meetings.',
    fullDef: 'Institutional Anchoring (I) is the fifth sub-index, corresponding to milestone M4. It measures how deeply research is embedded in the school\'s plans, policies, and regular operations, including inclusion of research in the School Improvement Plan (SIP), regular review of research goals in leadership meetings, research findings influencing school-level decisions, research in the school\'s vision/mission, and research-related KPIs for school heads. The default threshold for M3→M4 is I ≥ 0.50.',
    related: ['Sub-index', 'M4', 'Threshold'],
  },
  {
    term: 'Community of Practice (P)',
    category: 'RCSI Framework',
    shortDef: 'Strength of research collaboration, sharing forums, and peer learning.',
    fullDef: 'Community of Practice (P) is the sixth sub-index, corresponding to milestone M5. It evaluates the strength of research collaboration, sharing forums, and peer learning among teachers, including regular research sharing sessions (LAC sessions, symposia), cross-grade or cross-subject research collaboration, an active research committee or LAC focused on research, attendance at external research conferences, and sharing of research outputs beyond the school. The default threshold for M4→M5 is P ≥ 0.50.',
    related: ['Sub-index', 'M5', 'Threshold'],
  },
  {
    term: 'Impact Realization (M)',
    category: 'RCSI Framework',
    shortDef: 'Tangible outcomes of research: publications, utilizations, and policy changes.',
    fullDef: 'Impact Realization (M) is the seventh and final sub-index, corresponding to milestone M6. It tracks tangible outcomes of research, including published research outputs (journal articles, conference papers), research utilized in classroom practice or school programs, research leading to policy changes or new programs, annual tracking and reporting of research outcomes, and at least one research-driven innovation embedded in regular practice. The default threshold for M5→M6 is M ≥ 0.50.',
    related: ['Sub-index', 'M6', 'Sustainable'],
  },

  // ── Milestones ──
  {
    term: 'Milestone',
    category: 'Milestones',
    shortDef: 'A discrete stage (M0–M6) on the research-culture progression ladder, based on threshold crossings.',
    fullDef: 'A milestone is a discrete stage on the research-culture progression ladder, ranging from M0 (Readiness assessed) to M6 (Impact Realization). Unlike the RCSI (which is continuous), milestones are threshold-based: a school must meet each dimension\'s threshold in sequential order to advance. For example, to reach M1, a school must have Awareness (A) ≥ 0.80. Once M1 is achieved, it must then have Capacity (C) ≥ 0.50 to reach M2, and so on.',
    related: ['RCSI', 'Threshold', 'M0', 'M6', 'Sustainable'],
  },
  {
    term: 'M0',
    category: 'Milestones',
    shortDef: 'Readiness — the starting milestone. All schools begin here.',
    fullDef: 'M0 is the starting milestone, corresponding to the Readiness (R) dimension. It indicates that the school\'s foundational conditions for research have been assessed. There is no threshold to "pass" M0 — it is the baseline state from which all schools begin their journey. To advance from M0 to M1, the school must achieve Awareness (A) ≥ 0.80.',
    related: ['Milestone', 'Readiness', 'M1'],
  },
  {
    term: 'M1',
    category: 'Milestones',
    shortDef: 'Awareness — achieved when Awareness (A) ≥ 0.80.',
    fullDef: 'M1 is the second milestone, corresponding to the Awareness (A) dimension. It is achieved when a school\'s Awareness sub-index reaches or exceeds 0.80. This is the most critical threshold in the framework because it is the gatekeeper from M0 to M1 — no school can advance past M0 without crossing it. In the current dataset, all 30 schools are at M0 because the division average for A is 0.53, well below 0.80.',
    related: ['Milestone', 'Awareness', 'Threshold', 'M0', 'M2'],
  },
  {
    term: 'M6',
    category: 'Milestones',
    shortDef: 'Impact Realization — the final milestone before sustainability.',
    fullDef: 'M6 is the seventh and final milestone, corresponding to the Impact Realization (M) dimension. It is achieved when a school\'s Impact Realization sub-index reaches or exceeds 0.50 (the default threshold). Reaching M6 means the school has demonstrated tangible research outcomes — publications, utilizations, and policy changes. A school at M6 with RCSI ≥ 0.70 is flagged as "Sustainable."',
    related: ['Milestone', 'Impact Realization', 'Sustainable', 'Threshold'],
  },
  {
    term: 'Sustainable',
    category: 'Milestones',
    shortDef: 'A school at M6 with RCSI ≥ 0.70 — a self-sustaining research culture.',
    fullDef: 'A school is flagged as "Sustainable" when it reaches M6 AND its composite RCSI is ≥ 0.70. In the milestone model, sustainability means the school cycles back to M0 for the next iteration — a self-sustaining research culture that no longer requires external push. This is the long-term goal for every school in the division. In the current dataset, no schools have reached M6, so none are flagged as sustainable.',
    related: ['M6', 'RCSI', 'Milestone'],
  },
  {
    term: 'Threshold',
    category: 'Milestones',
    shortDef: 'The minimum sub-index value required to advance to the next milestone.',
    fullDef: 'A threshold is the minimum sub-index value required to advance to the next milestone. The default thresholds are: A ≥ 0.80 for M0→M1 (per the original El Salvador Division study), and 0.50 for all other dimensions (C, S, I, P, M). Thresholds can be overridden in the Twin Sandbox\'s Thresholds sub-tab for sensitivity analysis, but the production dashboard always uses the defaults.',
    related: ['Milestone', 'Awareness', 'Twin Sandbox'],
  },
  {
    term: 'Bottleneck',
    category: 'Milestones',
    shortDef: 'The dimension whose threshold is preventing a school from advancing to the next milestone.',
    fullDef: 'A bottleneck is the dimension whose threshold is preventing a school from advancing to the next milestone. For example, if a school is at M0 with Awareness (A) = 0.65, the bottleneck is A (which needs to reach 0.80). The Executive Briefs and the Twin Sandbox narrative explicitly identify the bottleneck and the gap that must be closed. In the current dataset, Awareness (A) is the division-wide bottleneck.',
    related: ['Threshold', 'Milestone', 'Executive Brief'],
  },

  // ── Dashboard ──
  {
    term: 'Executive Brief',
    category: 'Dashboard',
    shortDef: 'The auto-generated narrative at the top of each tab that interprets the charts in milestone terms.',
    fullDef: 'The Executive Brief is an auto-generated narrative card that appears at the top of each dashboard tab (Overview, Schools, Research, Twin Sandbox, Trends). It interprets the data in milestone terms, names the weakest/strongest dimensions, identifies the bottleneck, and recommends a specific intervention. The brief\'s tone (green/amber/red/blue) adapts to the data. It is the most important element for non-technical decision-makers.',
    related: ['Narrative', 'Tone', 'Recommended Intervention'],
  },
  {
    term: 'Tone',
    category: 'Dashboard',
    shortDef: 'The color-coded mood of an Executive Brief: green (success), amber (warning), red (danger), or blue (insight).',
    fullDef: 'The tone of an Executive Brief is a color-coded indicator of the data\'s urgency: green (success — schools advancing or sustainable), amber (warning — Awareness gap or declining RCSI), red (danger — critical condition or milestone regression), and blue (insight — general information, no change yet). Decision-makers should read the tone first to know whether to celebrate, plan, or intervene urgently.',
    related: ['Executive Brief'],
  },
  {
    term: 'Recommended Intervention',
    category: 'Dashboard',
    shortDef: 'The single highest-leverage action recommended by the Executive Brief for the current quarter.',
    fullDef: 'The Recommended Intervention is a bolded action item at the bottom of each Executive Brief. It names the specific intervention that would most improve the division\'s or school\'s RCSI, aligned to the M0–M6 milestone ladder. For example: "Launch a division-wide Awareness campaign to push A past 0.80" or "Provide research-methods training targeted at Teacher I and II ranks."',
    related: ['Executive Brief', 'Policy Lever', 'Milestone'],
  },
  {
    term: 'Narrative',
    category: 'Dashboard',
    shortDef: 'The auto-generated text that explains what the charts mean in plain language.',
    fullDef: 'A narrative is any auto-generated text on the dashboard that interprets data in plain language. There are five narrative generators: Overview, Schools, Research, Twin Sandbox (reactive), and Trends. Each produces a title, a list of insights, and a recommended intervention. Narratives are rule-based (not AI-generated) for auditability, except for the AI Research Advisor and Quarterly Report Writer which use the GLM language model.',
    related: ['Executive Brief', 'AI Research Advisor', 'Quarterly Report Writer'],
  },
  {
    term: 'Sparkline',
    category: 'Dashboard',
    shortDef: 'A small inline line chart showing a school\'s RCSI trend over the available quarters.',
    fullDef: 'A sparkline is a small, inline line chart (typically 80×28 pixels) that appears in the Schools tab\'s table. It shows a school\'s RCSI trend across all available quarters at a glance. A rising sparkline indicates improvement; a flat line indicates stagnation; a falling line indicates decline. Sparklines let decision-makers assess 30 schools\' trajectories without opening each school\'s detail dialog.',
    related: ['Schools Tab', 'RCSI'],
  },
  {
    term: 'Quarter Selector',
    category: 'Dashboard',
    shortDef: 'The dropdown in the header that lets you view any historical quarter\'s data.',
    fullDef: 'The Quarter Selector is a dropdown in the dashboard header that lists all available quarters in the database. It defaults to the latest quarter (labeled "(Latest)"). Selecting a different quarter re-fetches all data for that quarter and updates the KPIs, charts, and Executive Briefs. The school count badge next to it dynamically reflects how many schools have data for the selected quarter.',
    related: ['Historical Data', 'Merge Mode'],
  },
  {
    term: 'Download PDF',
    category: 'Dashboard',
    shortDef: 'A button on each sandbox that generates a branded PDF report with the narrative and data tables.',
    fullDef: 'The Download PDF button appears next to the Executive Brief on the Overview, Schools, Research, and Twin Sandbox tabs. It generates a client-side PDF (via jsPDF) that includes the color-coded Executive Brief narrative, key data tables (KPIs, school rankings, dimension comparisons), and the Copyright 2026 El Salvador Division footer with page numbers. The Twin Sandbox PDF captures the current simulation state.',
    related: ['Executive Brief', 'Quarterly Report Writer'],
  },

  // ── Data Collection ──
  {
    term: 'Quarterly Survey',
    category: 'Data Collection',
    shortDef: 'A 35-item Likert-scale questionnaire (5 questions per RCSI dimension) that produces the quarterly_survey_data.csv.',
    fullDef: 'The Quarterly Survey is a 35-item instrument with 5 questions per RCSI dimension (R, A, C, S, I, P, M). Each question uses a 5-point Likert scale: None (0), Low (0.25), Mid (0.5), High (0.75), Full (1.0). The dimension score is the average of its 5 questions, producing a 0–1 value. The survey is conducted once per quarter and produces a CSV file in the exact format expected by the Upload tab.',
    related: ['Research Metadata', 'Likert Scale', 'Upload Tab'],
  },
  {
    term: 'Research Metadata',
    category: 'Data Collection',
    shortDef: 'A 14-field form capturing individual research outputs (abstracts and full papers) by teachers.',
    fullDef: 'Research Metadata is the data collected via the Research Metadata form, capturing individual research outputs produced by teachers. Each record has 14 fields: upload_date, teacher_name, school_id_no, document_type, title, theme, status, publication_link, utilized_by_school, utilization_date, year_undertaken, years_of_service, teacher_rank, educational_attainment. The data is uploaded as research_metadata.csv and powers the Research tab\'s analytics.',
    related: ['Quarterly Survey', 'Upload Tab', 'Research Tab'],
  },
  {
    term: 'Likert Scale',
    category: 'Data Collection',
    shortDef: 'The 5-point response scale used in the Quarterly Survey: None, Low, Mid, High, Full.',
    fullDef: 'The Likert Scale is the 5-point response scale used in the Quarterly Survey: None (0.0), Low (0.25), Mid (0.5), High (0.75), and Full (1.0). Each of the 35 survey questions uses this scale. The dimension score is the average of its 5 questions, so the possible range is 0.0 to 1.0. The scale is designed to be intuitive for teachers — "Full" means the practice is fully realized at the school.',
    related: ['Quarterly Survey', 'Sub-index'],
  },
  {
    term: 'Merge Mode',
    category: 'Data Collection',
    shortDef: 'The default upload mode that adds new rows and updates existing ones, preserving historical data.',
    fullDef: 'Merge Mode is the default upload mode in the Upload tab. It upserts (insert or update) rows by their natural key: school+quarter for survey data, and teacher+title+year for research metadata. This means uploading Q2 data does NOT erase Q1 data — previous quarters are preserved. Merge Mode enables historical trend analysis and quarter-over-quarter comparison in the narratives. Contrast with Replace Mode.',
    related: ['Replace Mode', 'Historical Data', 'Upload Tab'],
  },
  {
    term: 'Replace Mode',
    category: 'Data Collection',
    shortDef: 'An upload mode that wipes all existing data before inserting — use only for full dataset refreshes.',
    fullDef: 'Replace Mode is an upload mode that deletes ALL existing survey and research data before inserting the new file\'s contents. It is irreversible. Use it only when you need a complete dataset refresh (e.g., correcting systemic data errors). For routine quarterly uploads, always use Merge Mode (the default) to preserve historical data.',
    related: ['Merge Mode', 'Upload Tab'],
  },
  {
    term: 'Audit Log',
    category: 'Data Collection',
    shortDef: 'A permanent record of every upload operation, showing timestamp, mode, file, and row counts.',
    fullDef: 'The Audit Log is a database table (UploadBatch) that records every upload operation with its timestamp, mode (Merge or Replace), file name, detected type, row count, inserted/updated/skipped counts, and status (success or failure). It cannot be deleted from the UI and provides a permanent trail for accountability. The Audit Log is visible in the Archive tab.',
    related: ['Archive Tab', 'Merge Mode', 'Replace Mode'],
  },
  {
    term: 'Auto-Theme Detection',
    category: 'Data Collection',
    shortDef: 'Automatic suggestion of the research theme based on keywords in the title.',
    fullDef: 'Auto-Theme Detection is a feature of the Research Metadata form that analyzes the research title as you type and suggests the most likely theme. It scans against 60+ keywords across 6 themes (Assessment & Evaluation, Leadership & Governance, Learner Engagement & Well-being, Professional Development, Teaching Strategies, Technology Integration) and returns a confidence level: Strong (3+ matches), Likely (2), Possible (1), or None. If you manually override the theme, auto-detection pauses until you edit the title again.',
    related: ['Research Metadata', 'Theme'],
  },
  {
    term: 'Print Questionnaire',
    category: 'Data Collection',
    shortDef: 'A button that opens a print-optimized A4 version of the 35-item survey for offline data collection.',
    fullDef: 'The Print Questionnaire button opens a new browser window with a print-optimized A4 version of the 35-item Quarterly Survey and triggers the browser\'s print dialog. The printable version includes a branded header, school/respondent information fields, a response scale legend, all 35 questions organized into 7 dimension sections with 5 checkboxes each, and signature blocks. It is designed for offline paper-based data collection in schools without reliable internet.',
    related: ['Quarterly Survey', 'Likert Scale'],
  },

  // ── AI Features ──
  {
    term: 'AI Research Advisor',
    category: 'AI Features',
    shortDef: 'A floating chat panel where decision-makers ask questions and get data-grounded answers.',
    fullDef: 'The AI Research Advisor is a floating chat panel (sparkle button in the bottom-right corner) powered by the Z.AI GLM large language model. It fetches live dashboard data (schools, RCSI scores, milestones, research outputs, trends) and answers questions in natural language. For example: "Which schools need the most help?" or "What intervention should we prioritize?" The advisor references specific numbers and schools from the data. It is a conversational interface to the dashboard.',
    related: ['Quarterly Report Writer', 'Executive Brief'],
  },
  {
    term: 'Quarterly Report Writer',
    category: 'AI Features',
    shortDef: 'A button that generates a comprehensive 2–3 page narrative quarterly report using AI.',
    fullDef: 'The Quarterly Report Writer is an AI-powered feature (the "Generate Quarterly Report" button in the header) that produces a comprehensive narrative report for the selected quarter. It includes 7 sections: Executive Summary, Division-Wide Progress, Milestone Analysis, Research Pipeline, School Highlights, Recommended Interventions, and Conclusion. The report references specific schools, RCSI scores, and dimension values. It can be downloaded as Markdown (.md) or plain text (.txt).',
    related: ['AI Research Advisor', 'Executive Brief', 'Download PDF'],
  },
  {
    term: 'Twin Sandbox',
    category: 'AI Features',
    shortDef: 'A real-time what-if simulator for modeling interventions before committing resources.',
    fullDef: 'The Twin Sandbox is the centerpiece feature for decision-makers. It creates a virtual copy (twin) of a school\'s seven-dimension profile and lets you adjust policy levers or raw dimension sliders to see the projected RCSI and milestone. The twin recomputes in real time — the Executive Brief, radar chart, and milestone progress bars all update as you drag sliders. It has four sub-tabs: Policy Levers, Intervention, Weights, and Thresholds.',
    related: ['Policy Lever', 'Delta', 'Intervention', 'Twin'],
  },
  {
    term: 'Policy Lever',
    category: 'AI Features',
    shortDef: 'A decision-maker-friendly input (e.g., Training Frequency) that maps to dimension deltas.',
    fullDef: 'A Policy Lever is a decision-maker-friendly input in the Twin Sandbox that translates a human-readable policy choice into dimension deltas. There are 5 policy levers: Training Frequency (→ C, A), Mentorship Ratio (→ S, P), Support Budget (→ S, R), Leadership Commitment (→ I, A), and Collaboration Frequency (→ P, M). Each lever has a baseline (status quo) — moving it above baseline produces positive deltas; below produces negative deltas. The per-dimension impact is shown as colored chips below each lever.',
    related: ['Twin Sandbox', 'Delta', 'Intervention', 'Baseline'],
  },
  {
    term: 'Delta',
    category: 'AI Features',
    shortDef: 'An additive change to a sub-index value, used in the Twin Sandbox (range −0.30 to +0.30).',
    fullDef: 'A delta is an additive change to a sub-index value used in the Twin Sandbox. For example, a delta of +0.15 on the Awareness (A) dimension means the projected A value is the actual A plus 0.15. Deltas range from −0.30 to +0.30 and are clamped to keep the sub-index within [0, 1]. Policy Levers produce deltas automatically; the Intervention tab lets you set them directly.',
    related: ['Policy Lever', 'Twin Sandbox', 'Intervention'],
  },
  {
    term: 'Intervention',
    category: 'AI Features',
    shortDef: 'Direct adjustment of the seven dimension deltas in the Twin Sandbox.',
    fullDef: 'The Intervention tab is a sub-tab of the Twin Sandbox that lets you set raw dimension deltas directly (range −0.30 to +0.30 per dimension). When you adjust Policy Levers, the Intervention sliders update automatically (a "Synced from Policy Levers" badge appears). If you manually edit a dimension slider, a "Manual override" warning appears and the Policy Levers stop syncing until you adjust a lever again.',
    related: ['Twin Sandbox', 'Policy Lever', 'Delta'],
  },
  {
    term: 'Baseline',
    category: 'AI Features',
    shortDef: 'The status-quo value for a policy lever. Moving above baseline produces positive deltas.',
    fullDef: 'The baseline is the status-quo value for a policy lever in the Twin Sandbox. For example, the baseline for Training Frequency is 2 sessions per quarter. Moving the lever above 2 produces positive deltas (improvement); moving it below 2 produces negative deltas (regression). At baseline, all deltas are zero. The baseline values are: Training=2, Mentorship=1:10, Budget=40%, Leadership=30%, Collaboration=1.',
    related: ['Policy Lever', 'Delta'],
  },
  {
    term: 'Twin',
    category: 'AI Features',
    shortDef: 'A virtual copy of a school\'s seven-dimension profile that you can experiment on safely.',
    fullDef: 'A "twin" is a virtual copy of a school\'s seven-dimension profile in the Twin Sandbox. When you adjust sliders, the twin recomputes what the school\'s RCSI and milestone WOULD be if the intervention were actually applied. The actual baseline never changes — only the projected values do. This lets you explore "what if we doubled training frequency?" safely, before spending resources.',
    related: ['Twin Sandbox', 'Policy Lever', 'Delta'],
  },

  // ── Technical ──
  {
    term: 'PWA',
    category: 'Technical',
    shortDef: 'Progressive Web App — the dashboard can be installed on Android/iOS home screens with an app icon.',
    fullDef: 'PWA (Progressive Web App) is a web application that can be installed on a mobile device\'s home screen, runs in standalone mode (no browser chrome), and works offline thanks to a service worker. The RCSI Dashboard is a PWA — on Android (Chrome) and desktop (Chrome/Edge), an "Install" banner appears. On iOS (Safari), users can "Add to Home Screen" manually. The PWA uses the app\'s teal theme color and RCSI icon.',
    related: ['Service Worker'],
  },
  {
    term: 'Service Worker',
    category: 'Technical',
    shortDef: 'A background script that caches assets for offline use and enables PWA installation.',
    fullDef: 'A Service Worker is a JavaScript file that runs in the background, separate from the web page. It intercepts network requests and serves cached responses when offline. The RCSI Dashboard\'s service worker uses three strategies: cache-first for static assets (JS, CSS, images), network-first for API data (fresh when online, cached when offline), and network-first for page navigation (falls back to cached app shell).',
    related: ['PWA'],
  },
  {
    term: 'Clean Slate',
    category: 'Technical',
    shortDef: 'A script that wipes all data from the database for pilot deployment.',
    fullDef: 'The Clean Slate script (scripts/clean-slate.ts) deletes all SurveyScore, ResearchRecord, School, and UploadBatch records from the database, leaving it completely empty. This is used before pilot deployment to ensure schools see a clean dashboard with no pre-existing data. Contrast with the seed script, which populates the database with demo data.',
    related: ['Seed Script', 'Merge Mode'],
  },
  {
    term: 'Seed Script',
    category: 'Technical',
    shortDef: 'A script that populates the database with demo data (30 schools, 4 quarters, 1,899 records).',
    fullDef: 'The Seed Script (scripts/seed.ts) wipes the database and inserts the original demo data from the two CSV files in the upload/ folder: 30 schools, 4 quarters (2026-01 to 2026-10), and 1,899 research records. It is used for development and demonstration only — do NOT run it before pilot deployment, as it would populate the database with fake data. Use the Clean Slate script instead.',
    related: ['Clean Slate'],
  },
  {
    term: 'Prototype — For Approval',
    category: 'Technical',
    shortDef: 'The current status badge indicating the app is pending approval from the Division Superintendents.',
    fullDef: 'The "Prototype — For Approval" badge is an amber indicator in the dashboard header, footer, PDF reports, and printable questionnaire. It signals that the application is a prototype pending formal approval from the Division Superintendents. Upon approval, the badge should be removed and the official El Salvador Division logo added. The badge is transparent about the app\'s status and shows respect for the approval process.',
    related: [],
  },
];

/**
 * Search glossary terms by query string (matches term, shortDef, or fullDef).
 */
export function searchGlossary(query: string): GlossaryTerm[] {
  if (!query.trim()) return GLOSSARY_TERMS;
  const q = query.toLowerCase().trim();
  return GLOSSARY_TERMS.filter(t =>
    t.term.toLowerCase().includes(q) ||
    t.shortDef.toLowerCase().includes(q) ||
    t.fullDef.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  );
}

/**
 * Get terms by category.
 */
export function getTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter(t => t.category === category);
}
