/**
 * Theme Auto-Detector
 * -------------------
 * Parses a research title and suggests the most likely theme
 * based on keyword matching. The 7 themes match the enum in the
 * research_metadata.csv data dictionary.
 */

export type ResearchTheme =
  | 'Assessment & Evaluation'
  | 'Leadership & Governance'
  | 'Learner Engagement & Well-being'
  | 'Others'
  | 'Professional Development'
  | 'Teaching Strategies'
  | 'Technology Integration';

interface ThemeRule {
  theme: ResearchTheme;
  keywords: string[]; // lowercase; matched as whole-word or substring
}

// Ordered by specificity (most specific first). "Others" is the fallback.
const RULES: ThemeRule[] = [
  {
    theme: 'Assessment & Evaluation',
    keywords: [
      'assessment', 'evaluate', 'evaluation', 'evaluating',
      'test', 'testing', 'exam', 'examination',
      'measure', 'measurement', 'measuring',
      'rubric', 'grading', 'score', 'scoring',
      'diagnostic', 'formative', 'summative',
    ],
  },
  {
    theme: 'Leadership & Governance',
    keywords: [
      'leadership', 'leader', 'governance', 'governing',
      'principal', 'school head', 'head teacher',
      'management', 'manager', 'administer', 'administration', 'administrative',
      'policy', 'policies', 'decision', 'decision-making',
      'supervision', 'supervisor', 'instructional leadership',
    ],
  },
  {
    theme: 'Learner Engagement & Well-being',
    keywords: [
      'engagement', 'engaged', 'engage',
      'well-being', 'wellbeing', 'welfare',
      'motivation', 'motivate', 'motivated',
      'mental', 'emotional', 'social', 'psychological',
      'behavior', 'behaviour', 'behavioral', 'behavioural',
      'attendance', 'absenteeism', 'dropout', 'drop-out',
      'bullying', 'cyberbullying', 'anti-bullying', 'peer victimization',
      'mental health', 'stress', 'anxiety', 'depression',
      'child protection', 'safe school', 'school climate', 'school safety',
      'resilience', 'trauma', 'peer pressure', 'social isolation',
    ],
  },
  {
    theme: 'Professional Development',
    keywords: [
      'professional development', 'pd ', 'inset',
      'training', 'workshop', 'seminar', 'seminars',
      'upskilling', 'capacity building', 'capacity-building',
      'lac', 'learning action cell',
      'mentoring', 'mentorship', 'coaching',
      'teacher development', 'continuing education',
    ],
  },
  {
    theme: 'Technology Integration',
    keywords: [
      'technology', 'tech ', 'digital',
      'ict', 'information and communication',
      'computer', 'computers', 'computing',
      'online', 'e-learning', 'elearning', 'e-learning',
      'blended', 'hybrid', 'distance learning',
      'internet', 'web-based', 'mobile', 'app',
      'virtual', 'augmented reality', 'artificial intelligence',
      'multimedia', 'interactive whiteboard',
    ],
  },
  {
    theme: 'Teaching Strategies',
    keywords: [
      'teaching', 'teach', 'taught',
      'strategy', 'strategies', 'strategic',
      'pedagogy', 'pedagogical',
      'methodology', 'method', 'methods', 'methodological',
      'instruction', 'instructional', 'instruct',
      'approach', 'approaches',
      'technique', 'techniques',
      'differentiated', 'scaffold', 'scaffolding',
      'cooperative', 'collaborative learning',
      'project-based', 'inquiry-based', 'problem-based',
    ],
  },
];

/**
 * Detect the most likely theme for a given research title.
 * Returns the theme and the matched keywords (for UI display).
 * If no keywords match, returns 'Others'.
 */
export function detectTheme(title: string): {
  theme: ResearchTheme;
  matchedKeywords: string[];
  confidence: 'high' | 'medium' | 'low' | 'none';
} {
  const lower = title.toLowerCase().trim();
  if (!lower) {
    return { theme: 'Others', matchedKeywords: [], confidence: 'none' };
  }

  // Score each theme by counting keyword matches
  const scores: { theme: ResearchTheme; count: number; matched: string[] }[] = [];

  for (const rule of RULES) {
    const matched: string[] = [];
    for (const kw of rule.keywords) {
      // Use word-boundary-aware search for short keywords, substring for phrases
      const needle = kw.trim();
      if (needle.length <= 4) {
        // Short keyword: match as whole word (avoid matching "test" inside "contest")
        const re = new RegExp(`\\b${escapeRegex(needle)}\\b`, 'i');
        if (re.test(lower)) matched.push(needle);
      } else {
        // Longer phrase: substring match is fine
        if (lower.includes(needle)) matched.push(needle);
      }
    }
    scores.push({ theme: rule.theme, count: matched.length, matched });
  }

  // Sort by match count descending
  scores.sort((a, b) => b.count - a.count);
  const best = scores[0];

  if (!best || best.count === 0) {
    return { theme: 'Others', matchedKeywords: [], confidence: 'none' };
  }

  // Confidence: high if 3+ matches, medium if 2, low if 1
  const confidence = best.count >= 3 ? 'high' : best.count === 2 ? 'medium' : 'low';

  return {
    theme: best.theme,
    matchedKeywords: best.matched,
    confidence,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get a human-readable label for the confidence level.
 */
export function confidenceLabel(confidence: 'high' | 'medium' | 'low' | 'none'): string {
  switch (confidence) {
    case 'high': return 'Strong match';
    case 'medium': return 'Likely match';
    case 'low': return 'Possible match';
    case 'none': return 'No keywords detected';
  }
}
