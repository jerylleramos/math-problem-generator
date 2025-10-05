import { supabase } from '@/lib/supabaseClient';

export interface MathProblemSession {
  id: string;
  problem_text: string;
  correct_answer: number;
  created_at: string;
}

export interface MathProblemSubmission {
  id: string;
  session_id: string;
  user_answer: number;
  is_correct: boolean;
  feedback_text: string;
  created_at: string;
}

export interface CreateMathProblemSession {
  problem_text: string;
  correct_answer: number;
}

export interface CreateMathProblemSubmission {
  session_id: string;
  user_answer: number;
  is_correct: boolean;
  feedback_text: string;
}

class MathProblemController {
  async createSession(data: CreateMathProblemSession): Promise<MathProblemSession> {
    const { data: session, error } = await supabase
      .from('math_problem_sessions')
      .insert([{
        problem_text: data.problem_text,
        correct_answer: data.correct_answer
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating math problem session:', error);
      throw new Error('Failed to create math problem session');
    }

    return {
      id: session.id,
      problem_text: session.problem_text,
      correct_answer: session.correct_answer,
      created_at: session.created_at
    };
  }

  async getSessionById(id: string): Promise<MathProblemSession | null> {
    const { data: session, error } = await supabase
      .from('math_problem_sessions')
      .select('id, problem_text, correct_answer, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching math problem session:', error);
      throw new Error('Failed to fetch math problem session');
    }

    if (!session) return null;

    return {
      id: session.id,
      problem_text: session.problem_text,
      correct_answer: session.correct_answer,
      created_at: session.created_at
    };
  }

  async createSubmission(data: CreateMathProblemSubmission): Promise<MathProblemSubmission> {
    const { data: submission, error } = await supabase
      .from('math_problem_submissions')
      .insert([{
        session_id: data.session_id,
        user_answer: data.user_answer,
        is_correct: data.is_correct,
        feedback_text: data.feedback_text
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating submission:', error);
      throw new Error('Failed to create submission');
    }

    return submission;
  }
}

export const mathProblemController = new MathProblemController();
