import { mathProblemController } from '@/lib/mathProblemController';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Configuration for the Gemini model
const modelConfig = {
  model: "gemini-2.5-flash",
  temperature: 0.7,
  topK: 1,
  topP: 0.8,
};

const HINT_PROMPT = `Generate a helpful hint for a Primary 5 student solving this math problem. The hint should guide them towards the solution without giving it away.

Problem: {problem_text}
Difficulty: {difficulty}
Operation Type: {problem_type}
Current Hint Level: {hint_level} (1=basic guidance, 2=problem-solving strategy, 3=detailed approach)

Requirements:
1. Be encouraging and supportive
2. Help identify key information or steps
3. Don't reveal the complete solution
4. Use age-appropriate language
5. Progressive difficulty based on hint level

Return just the hint text with no additional formatting or quotes.`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    // Get problem session and existing hints
    const session = await mathProblemController.getSessionById(sessionId);
    const hints = await mathProblemController.getSessionHints(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Problem session not found' },
        { status: 404 }
      );
    }

    // Return existing hints if available
    if (hints.length > 0) {
      return NextResponse.json({ hints });
    }

    // Generate new hints if none exist
    const model = genAI.getGenerativeModel(modelConfig);
    const hintRequests = [1, 2, 3].map(level => {
      const prompt = HINT_PROMPT
        .replace('{problem_text}', session.problem_text)
        .replace('{difficulty}', session.difficulty)
        .replace('{problem_type}', session.problem_type)
        .replace('{hint_level}', level.toString());

      return model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: modelConfig.temperature,
          topK: modelConfig.topK,
          topP: modelConfig.topP,
        },
      });
    });

    // Wait for all hints to be generated
    const results = await Promise.all(hintRequests);
    const hintTexts = results.map(result => result.response?.text() || '');

    // Save generated hints
    const savedHints = await Promise.all(
      hintTexts.map((text, index) => 
        mathProblemController.createHint({
          session_id: sessionId,
          hint_text: text,
          hint_order: index + 1,
        })
      )
    );

    return NextResponse.json({ hints: savedHints });
  } catch (error) {
    console.error('Error generating hints:', error);
    return NextResponse.json(
      { error: 'Failed to generate hints' },
      { status: 500 }
    );
  }
}