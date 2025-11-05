import { parseGeminiJson } from '@/lib/helpers';
import { mathProblemController } from '@/lib/mathProblemController';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Configuration for the Gemini model - optimized for faster responses
const modelConfig = {
  model: "gemini-2.5-flash",
  temperature: 0.3, // Lower temperature for more focused outputs
  topK: 1,
  topP: 0.1, // Lower topP for more deterministic responses
  maxOutputTokens: 500, // Limit token usage
};

const PROMPT_TEMPLATE = `Create a concise Primary 5 math problem:
- Difficulty: {difficulty}
- Operation: {operation_type}
- Context: {difficulty_guidelines}
- Focus: {operation_guidelines}

Requirements:
1. Real-world scenario
2. Clear numerical answer
3. Age-appropriate (11-12 years)
4. All needed info included

Format (JSON only), no markdown characters or extra text:
{
  "problem_text": "word problem here",
  "correct_answer": number,
  "suggested_hints": ["basic hint", "detailed hint"]
}`;

const DIFFICULTY_GUIDELINES = {
  easy: "Single-step, basic numbers, straightforward calculation",
  medium: "Two-step problem, mixed operations or conversions",
  hard: "Multi-step problem, strategic thinking required"
};

const OPERATION_GUIDELINES = {
  addition: "Combining quantities (shopping/collecting)",
  subtraction: "Finding differences/remaining amounts",
  multiplication: "Repeated addition/scaling scenarios",
  division: "Sharing/rate calculations"
};

export async function POST(request: Request) {
  try {
    // Parse request body for difficulty and problem type
    const body = await request.json();
    const { 
      difficulty = 'medium',  // Default to medium if not specified
      problem_type = 'addition'  // Default to addition if not specified
    } = body;

    // Validate parameters
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new Error('Invalid difficulty level');
    }
    if (!['addition', 'subtraction', 'multiplication', 'division'].includes(problem_type)) {
      throw new Error('Invalid problem type');
    }

    // Generate personalized prompt
    const prompt = PROMPT_TEMPLATE
      .replace('{difficulty}', difficulty)
      .replace('{operation_type}', problem_type)
      .replace('{difficulty_guidelines}', DIFFICULTY_GUIDELINES[difficulty as keyof typeof DIFFICULTY_GUIDELINES])
      .replace('{operation_guidelines}', OPERATION_GUIDELINES[problem_type as keyof typeof OPERATION_GUIDELINES]);

    // Generate problem using Gemini
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
      throw new Error('Failed to generate response from AI');
    }
    
    const response = result.response;
    const text = response.text();

    console.log('Generated text:', text);
    
    // Parse the JSON response
    const generatedProblem = parseGeminiJson(text);

    if (!generatedProblem) {
      throw new Error('Failed to parse generated problem');
    }

    // Save to Supabase and get session ID
    const savedProblem = await mathProblemController.createSession({
      problem_text: generatedProblem.problem_text,
      correct_answer: generatedProblem.correct_answer,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      problem_type: problem_type as 'addition' | 'subtraction' | 'multiplication' | 'division',
    });

    // Save initial hints
    const hints = generatedProblem.suggested_hints || [];
    if (hints.length > 0) {
      await Promise.all(hints.map((hint: string, index: number) => 
        mathProblemController.createHint({
          session_id: savedProblem.id,
          hint_text: hint,
          hint_order: index + 1,
        })
      ));
    }

    // Return the problem with session ID
    return NextResponse.json({
      problem_text: savedProblem.problem_text,
      correct_answer: savedProblem.correct_answer,
      session_id: savedProblem.id,
      difficulty: savedProblem.difficulty,
      problem_type: savedProblem.problem_type,
      hints_available: savedProblem.hints_available,
      score_value: savedProblem.score,
    });
  } catch (error) {
    console.error('Error generating math problem:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found for API version')) {
        return NextResponse.json(
          { error: 'Invalid Google AI configuration. Please check your API key and model settings.' },
          { status: 500 }
        );
      } else if (error.message.includes('Failed to generate response from AI')) {
        return NextResponse.json(
          { error: 'AI failed to generate a valid response. Please try again.' },
          { status: 500 }
        );
      } else if (error.message === 'Failed to save math problem') {
        return NextResponse.json(
          { error: 'Database error: Failed to save the problem.' },
          { status: 500 }
        );
      }
    }

    // Generic error case
    return NextResponse.json(
      { error: 'Failed to generate math problem' },
      { status: 500 }
    );
  }
}
