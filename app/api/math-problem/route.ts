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

const PROMPT_TEMPLATE = `Generate a Primary 5 level math word problem with the following specifications:

Difficulty: {difficulty}
Operation Type: {operation_type}

Guidelines for {difficulty} difficulty:
{difficulty_guidelines}

The problem should focus on {operation_type} and be structured as follows:
{operation_guidelines}

Additional requirements:
1. Be engaging and related to real-world situations
2. Have a clear numerical answer
3. Include all necessary information to solve the problem
4. Be appropriate for Primary 5 students (11-12 years old)

Return the response in this JSON format only, no need to add any markdown characters:
{
  "problem_text": "The complete word problem text",
  "correct_answer": number,
  "suggested_hints": ["hint1", "hint2", "hint3"]  // Progressive hints from basic to detailed
}`;

const DIFFICULTY_GUIDELINES = {
  easy: "Use single-step problems with straightforward calculations. Focus on basic concepts. Numbers should be friendly and manageable.",
  medium: "Use two-step problems that require some planning. Include mixed operations or unit conversions. Numbers can be more challenging.",
  hard: "Use multi-step problems that require strategic thinking. Combine multiple concepts. Include more complex numbers and relationships."
};

const OPERATION_GUIDELINES = {
  addition: "Focus on combining quantities, totals, or increments. Include scenarios like shopping, collecting, or growing quantities.",
  subtraction: "Focus on finding differences, reductions, or remaining amounts. Include scenarios like spending, decreasing quantities, or comparing amounts.",
  multiplication: "Focus on repeated addition, scaling, or area calculations. Include scenarios like bulk purchases, conversions, or geometric calculations.",
  division: "Focus on sharing, grouping, or rate calculations. Include scenarios like distribution, finding unit rates, or portioning."
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
    const generatedProblem = JSON.parse(text);
    
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
