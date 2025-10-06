import { useState } from 'react';

interface MathProblem {
  problem_text: string;
  final_answer: number;
  session_id: string;
}

interface SubmissionResponse {
  is_correct: boolean;
  feedback: string;
}

export function useMathProblem() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);

  const generateProblem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/math-problem', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate problem');
      }
      
      const data = await response.json();
      setCurrentProblem(data);
      setSubmission(null); // Reset submission when new problem is generated
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentProblem,
    submission,
    isLoading,
    isSubmitting,
    error,
    generateProblem,
    submitAnswer,
  };
}
