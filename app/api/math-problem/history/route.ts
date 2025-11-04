import { mathProblemController } from '@/lib/mathProblemController';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get user history with submissions
    const history = await mathProblemController.getUserHistory(limit);

    // Get user's overall score
    const userScore = await mathProblemController.getUserScore();

    return NextResponse.json({
      history,
      score: userScore,
    });
  } catch (error) {
    console.error('Error fetching user history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user history' },
      { status: 500 }
    );
  }
}