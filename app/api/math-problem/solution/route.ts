import { mathProblemController } from '@/lib/mathProblemController';
import { supabase } from '@/lib/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Configuration for the Gemini model
const modelConfig = {
  model: "gemini-2.5-flash",
  temperature: 0.5, // Lower temperature for more deterministic solutions
  topK: 1,
  topP: 0.8,
};

const SOLUTION_PROMPT = `Generate a detailed, step-by-step solution for this Primary 5 math problem. The solution should be clear, thorough, and educational.

Problem: {problem_text}
Difficulty: {difficulty}
Operation Type: {problem_type}
Final Answer: {correct_answer}

Guidelines for the solution:
1. Break down the problem into clear, numbered steps
2. Explain the reasoning at each step
3. Show all calculations clearly
4. Include relevant formulas or rules used
5. Conclude with the final answer and check
6. Use age-appropriate language (Primary 5 level)

Return a step-by-step solution with no additional formatting or quotes.
Each step should be a sentence or two, clearly numbered.`;

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

    // Get problem session
    const session = await mathProblemController.getSessionById(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Problem session not found' },
        { status: 404 }
      );
    }

    // If solution already exists, return it
    if (session.solution_steps) {
      return NextResponse.json({ solution: session.solution_steps });
    }

    // Generate step-by-step solution
    const prompt = SOLUTION_PROMPT
      .replace('{problem_text}', session.problem_text)
      .replace('{difficulty}', session.difficulty)
      .replace('{problem_type}', session.problem_type)
      .replace('{correct_answer}', session.correct_answer.toString());

    const model = genAI.getGenerativeModel(modelConfig);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: modelConfig.temperature,
        topK: modelConfig.topK,
        topP: modelConfig.topP,
      },
    });

    if (!result.response) {
      throw new Error('Failed to generate solution');
    }

    const solution = result.response.text();

    // Update session with solution
    const { data: updatedSession, error } = await supabase
      .from('math_problem_sessions')
      .update({ solution_steps: solution })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to save solution');
    }

    return NextResponse.json({ solution: updatedSession.solution_steps });
  } catch (error) {
    console.error('Error generating solution:', error);
    return NextResponse.json(
      { error: 'Failed to generate solution' },
      { status: 500 }
    );
  }
}