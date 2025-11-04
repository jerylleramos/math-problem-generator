import { useState } from 'react';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type ProblemType = 'addition' | 'subtraction' | 'multiplication' | 'division';

interface MathProblem {
  problem_text: string;
  final_answer: number;
  session_id: string;
  difficulty: DifficultyLevel;
  problem_type: ProblemType;
  hints_available: number;
  score: number;
}

interface SubmissionResponse {
  is_correct: boolean;
  feedback: string;
  points_earned: number;
}

interface MathProblemHint {
  id: string;
  hint_text: string;
  hint_order: number;
}

interface UserHistory {
  history: Array<{
    problem_text: string;
    difficulty: DifficultyLevel;
    problem_type: ProblemType;
    created_at: string;
    submission?: {
      is_correct: boolean;
      points_earned: number;
    };
  }>;
  score: {
    total_score: number;
    problems_attempted: number;
    problems_solved: number;
  };
}

export function useMathProblem() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
  const [hints, setHints] = useState<MathProblemHint[]>([]);
  const [solution, setSolution] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<UserHistory | null>(null);

  const generateProblem = async (
    difficulty: DifficultyLevel = 'medium',
    problem_type: ProblemType = 'addition'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty, problem_type }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate problem');
      }
      
      const data = await response.json();
      setCurrentProblem(data);
      setSubmission(null);
      setHints([]);
      setSolution(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (answer: number) => {
    if (!currentProblem) {
      setError('No active problem to submit answer for');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/math-problem/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentProblem.session_id,
          user_answer: answer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();
      setSubmission(data);
      
      // Refresh user history after submission
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadHints = async () => {
    if (!currentProblem) {
      setError('No active problem to get hints for');
      return;
    }

    setIsLoadingHints(true);
    setError(null);
    try {
      const response = await fetch(`/api/math-problem/hints?sessionId=${currentProblem.session_id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load hints');
      }

      const data = await response.json();
      setHints(data.hints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingHints(false);
    }
  };

  const loadSolution = async () => {
    if (!currentProblem) {
      setError('No active problem to get solution for');
      return;
    }

    setIsLoadingSolution(true);
    setError(null);
    try {
      const response = await fetch(`/api/math-problem/solution?sessionId=${currentProblem.session_id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load solution');
      }

      const data = await response.json();
      setSolution(data.solution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingSolution(false);
    }
  };

  const loadHistory = async (limit: number = 10) => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const response = await fetch(`/api/math-problem/history?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to load history');
      }

      const data = await response.json();
      setUserHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return {
    // Problem state
    currentProblem,
    submission,
    hints,
    solution,
    userHistory,

    // Loading states
    isLoading,
    isSubmitting,
    isLoadingHints,
    isLoadingSolution,
    isLoadingHistory,
    error,

    // Actions
    generateProblem,
    submitAnswer,
    loadHints,
    loadSolution,
    loadHistory,
  };
}
