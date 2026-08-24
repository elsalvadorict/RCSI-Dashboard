import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 30;

const VALID_THEMES = [
  'Assessment & Evaluation',
  'Leadership & Governance',
  'Learner Engagement & Well-being',
  'Others',
  'Professional Development',
  'Teaching Strategies',
  'Technology Integration',
];

const SYSTEM_PROMPT = `You are a research theme classifier for the Philippine Department of Education, El Salvador Division.

Given a research title, classify it into exactly ONE of these 7 themes:

1. "Assessment & Evaluation" — testing, grading, rubrics, measuring learning outcomes, formative/summative assessment
2. "Leadership & Governance" — school management, principal/school head practices, policy implementation, instructional leadership, administration
3. "Learner Engagement & Well-being" — student motivation, bullying, mental health, attendance, dropout, behavior, child protection, school climate
4. "Others" — topics that don't fit any of the above categories
5. "Professional Development" — teacher training, seminars, workshops, mentoring, INSET, LAC sessions, capacity building
6. "Teaching Strategies" — pedagogy, instructional methods, differentiated instruction, cooperative learning, lesson design
7. "Technology Integration" — ICT, digital tools, e-learning, blended learning, educational technology, multimedia

Rules:
- Respond with ONLY the theme name from the list above. No explanation, no extra text.
- The title may be in English, Filipino, or mixed. Classify based on the research topic, not the language.
- If the title is ambiguous or covers multiple themes, pick the MOST prominent one.
- If the title genuinely doesn't fit any theme, respond with "Others".
- Match the exact spelling and capitalization from the list.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json({
        theme: 'Others',
        confidence: 'none',
        source: 'fallback',
        reason: 'Title too short for classification',
      });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT },
        { role: 'user', content: `Classify this research title:\n\n"${title.trim()}"` },
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
      return NextResponse.json({
        theme: 'Others',
        confidence: 'none',
        source: 'ai',
        reason: 'AI returned empty response',
      });
    }

    // Find the closest matching theme (handles minor formatting differences)
    const normalizedResponse = response.replace(/["']/g, '').trim();
    const matchedTheme = VALID_THEMES.find(
      t => t.toLowerCase() === normalizedResponse.toLowerCase()
    ) || VALID_THEMES.find(
      t => normalizedResponse.toLowerCase().includes(t.toLowerCase())
    );

    if (matchedTheme) {
      return NextResponse.json({
        theme: matchedTheme,
        confidence: 'high',
        source: 'ai',
        reason: `AI classified as "${matchedTheme}"`,
      });
    }

    // If AI returned something that doesn't match any theme, fall back to Others
    return NextResponse.json({
      theme: 'Others',
      confidence: 'low',
      source: 'ai',
      reason: `AI response "${response}" did not match any known theme`,
      rawResponse: response,
    });
  } catch (e) {
    console.error('Theme classification error:', e);
    return NextResponse.json({
      theme: 'Others',
      confidence: 'none',
      source: 'fallback',
      reason: 'AI classification failed — using fallback',
      error: String(e),
    }, { status: 200 }); // Return 200 so the client doesn't crash
  }
}
