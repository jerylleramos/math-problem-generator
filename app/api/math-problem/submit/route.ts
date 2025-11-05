import { mathProblemController } from '@/lib/mathProblemController';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Configuration for the Gemini model
const modelConfig = {
  model: "gemini-2.5-flash",
  temperature: 0.7, // Balanced between creativity and consistency
  topK: 1,
  topP: 0.8,
};

const FEEDBACK_PROMPT_TEMPLATE = `Generate brief, encouraging feedback for a Primary 5 (11-12 years old) student who just attempted a math problem.

Original Problem: {problem_text}
Correct Answer: {correct_answer}
Student's Answer: {user_answer}
Is Correct: {is_correct}

Requirements:
1. Keep feedback concise but insightful.
2. Be encouraging and positive
3. If incorrect, briefly mention why without giving away the answer
4. Use age-appropriate language
5. Focus on learning and growth

Limit your response to a maximum of 2048 tokens.
Return only the feedback text with no additional formatting or quotes.`;

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { session_id, user_answer } = body;

    // Validate request body
    if (!session_id || user_answer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id and user_answer' },
        { status: 400 }
      );
    }

    // Fetch the original problem
    const session = await mathProblemController.getSessionById(session_id);

    if (!session) {
      return NextResponse.json(
        { error: 'Problem session not found' },
        { status: 404 }
      );
    }

    // Compare answers (using approximate equality for floating-point numbers)
    const isCorrect = Math.abs(Number(user_answer) - Number(session.correct_answer)) < 0.0001;

    // Generate AI feedback
    const prompt = FEEDBACK_PROMPT_TEMPLATE
      .replace('{problem_text}', session.problem_text)
      .replace('{correct_answer}', session.correct_answer.toString())
      .replace('{user_answer}', user_answer.toString())
      .replace('{is_correct}', isCorrect.toString());

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
      throw new Error('Failed to generate AI feedback');
    }
    
    const feedback = result.response.text();

    // Save submission to database
    let submission;
    try {
      submission = await mathProblemController.createSubmission({
        session_id,
        user_answer,
        is_correct: isCorrect,
        feedback_text: feedback,
      });
    } catch (error) {
      console.error('Error saving submission:', error);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    // Return response
    return NextResponse.json({
      is_correct: isCorrect,
      feedback,
      points_earned: submission.points_earned || 0,
    });
  } catch (error) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
