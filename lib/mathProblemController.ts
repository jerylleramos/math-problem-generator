import { supabase } from '@/lib/supabaseClient';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type ProblemType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface MathProblemHint {
  id: string;
  session_id: string;
  hint_text: string;
  hint_order: number;
  created_at: string;
}

export interface MathProblemSession {
  id: string;
  problem_text: string;
  correct_answer: number;
  difficulty: DifficultyLevel;
  problem_type: ProblemType;
  solution_steps?: string;
  hints_available: number;
  score: number;
  created_at: string;
}

export interface MathProblemSubmission {
  id: string;
  session_id: string;
  user_answer: number;
  is_correct: boolean;
  feedback_text: string;
  points_earned?: number;
  created_at: string;
}

export interface CreateMathProblemSession {
  problem_text: string;
  correct_answer: number;
  difficulty: DifficultyLevel;
  problem_type: ProblemType;
  solution_steps?: string;
}

export interface CreateMathProblemSubmission {
  session_id: string;
  user_answer: number;
  is_correct: boolean;
  feedback_text: string;
  points_earned?: number;
}

export interface CreateMathProblemHint {
  session_id: string;
  hint_text: string;
  hint_order: number;
}

export interface UserScore {
  total_score: number;
  problems_attempted: number;
  problems_solved: number;
}

class MathProblemController {
  async createSession(data: CreateMathProblemSession): Promise<MathProblemSession> {
    const { data: session, error } = await supabase
      .from('math_problem_sessions')
      .insert([{
        problem_text: data.problem_text,
        correct_answer: data.correct_answer,
        difficulty: data.difficulty,
        problem_type: data.problem_type,
        solution_steps: data.solution_steps
      }])
      .select('*, score') // Include the generated score field
      .single();

    if (error) {
      console.error('Error creating math problem session:', error);
      throw new Error('Failed to create math problem session');
    }

    return session;
  }

  async getSessionById(id: string): Promise<MathProblemSession | null> {
    const { data: session, error } = await supabase
      .from('math_problem_sessions')
      .select('*, score') // Include the generated score field
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching math problem session:', error);
      throw new Error('Failed to fetch math problem session');
    }

    if (!session) return null;

    return session;
  }

  async createSubmission(data: CreateMathProblemSubmission): Promise<MathProblemSubmission> {
    // Calculate points based on session's score value if correct
    if (data.is_correct) {
      const session = await this.getSessionById(data.session_id);
      data.points_earned = session?.score ?? 0;
    } else {
      data.points_earned = 0;
    }

    const { data: submission, error } = await supabase
      .from('math_problem_submissions')
      .insert([{
        session_id: data.session_id,
        user_answer: data.user_answer,
        is_correct: data.is_correct,
        feedback_text: data.feedback_text,
        points_earned: data.points_earned
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating submission:', error);
      throw new Error('Failed to create submission');
    }

    return submission;
  }

  async createHint(data: CreateMathProblemHint): Promise<MathProblemHint> {
    const { data: hint, error } = await supabase
      .from('math_problem_hints')
      .insert([{
        session_id: data.session_id,
        hint_text: data.hint_text,
        hint_order: data.hint_order
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating hint:', error);
      throw new Error('Failed to create hint');
    }

    return hint;
  }

  async getSessionHints(sessionId: string): Promise<MathProblemHint[]> {
    const { data: hints, error } = await supabase
      .from('math_problem_hints')
      .select('*')
      .eq('session_id', sessionId)
      .order('hint_order', { ascending: true });

    if (error) {
      console.error('Error fetching hints:', error);
      throw new Error('Failed to fetch hints');
    }

    return hints;
  }

  async getUserHistory(limit: number = 10): Promise<(MathProblemSession & { submission?: MathProblemSubmission })[]> {
    const { data: sessions, error } = await supabase
      .from('math_problem_sessions')
      .select(`
        *,
        submissions:math_problem_submissions(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user history:', error);
      throw new Error('Failed to fetch user history');
    }

    return sessions.map(session => ({
      ...session,
      submission: session.submissions?.[0]
    }));
  }

  async getUserScore(): Promise<UserScore> {
    const { data: score, error } = await supabase
      .from('user_scores')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching user score:', error);
      throw new Error('Failed to fetch user score');
    }

    return score;
  }
}

export const mathProblemController = new MathProblemController();
