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

const PROMPT_TEMPLATE = `Generate a Primary 5 level math word problem based on one of these topics:
- Whole Numbers (up to 10 million, four operations, order of operations, brackets)
- Fractions (division, fraction-decimal conversion, four operations with fractions and mixed numbers)
- Decimals (operations, unit conversions)
- Percentage (expressing part of whole, discounts, GST, interest)
- Rate (rate calculations)
- Area & Volume (area of triangles, composite figures, volume of cube/cuboid, liquid volume)
- Geometry (angles, triangle properties, parallelogram/rhombus/trapezium properties)

The problem should:
1. Be appropriate for Primary 5 students (11-12 years old)
2. Have a clear numerical answer
3. Be engaging and related to real-world situations
4. Include all necessary information to solve the problem

Return the response in this JSON format only, no need to add any markdown characters:
{
  "problem_text": "The complete word problem text",
  "correct_answer": number
}`;

export async function POST() {
  try {
    // Generate problem using Gemini
    const model = genAI.getGenerativeModel(modelConfig);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: PROMPT_TEMPLATE }] }],
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
    });

    // Return the problem with session ID
    return NextResponse.json({
      problem_text: savedProblem.problem_text,
      correct_answer: savedProblem.correct_answer,
      session_id: savedProblem.id,
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
