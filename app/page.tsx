"use client";

import { useMathProblem } from "@/hooks/useMathProblem";
import { useState } from "react";

interface MathProblem {
  problem_text: string;
  final_answer: number;
}

export default function Home() {
  const [userAnswer, setUserAnswer] = useState("");
  const {
    currentProblem: problem,
    submission,
    isLoading,
    isSubmitting,
    error,
    generateProblem,
    submitAnswer,
  } = useMathProblem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAnswer = parseFloat(userAnswer);
    if (isNaN(numericAnswer)) {
      return; // Could add error handling for invalid input
    }
    await submitAnswer(numericAnswer);
    setUserAnswer(""); // Reset input after submission
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white flex items-center justify-center p-4">
      <main className="container mx-auto px-4 py-10 max-w-2xl w-full flex flex-col items-center">
        <h1 className="text-5xl font-extrabold text-center mb-10 text-sky-700 tracking-tight drop-shadow-sm">
          Math Fun Zone ✨
        </h1>

        {/* Generate Button */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-4 border-sky-200 w-full">
          <button
            onClick={generateProblem}
            disabled={isLoading || isSubmitting}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 text-white text-xl font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            {isLoading && (
              <svg
                className="animate-spin h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            {isLoading ? "Generating..." : "🎲 Generate New Problem"}
          </button>
        </div>

        {/* Problem Card */}
        {problem && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-4 border-yellow-200 w-full">
            <h2 className="text-2xl font-bold mb-4 text-yellow-700 text-center">
              Problem:
            </h2>

            {isSubmitting ? (
              <div className="animate-pulse space-y-3 mb-6">
                <div className="h-6 bg-yellow-100 rounded w-3/4"></div>
                <div className="h-6 bg-yellow-100 rounded w-2/4"></div>
              </div>
            ) : (
              <p className="text-2xl text-gray-800 leading-relaxed mb-6 text-center">
                {problem.problem_text}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
              <div className="text-center">
                <label
                  htmlFor="answer"
                  className="block text-lg font-semibold text-green-700 mb-2"
                >
                  ✍️ Your Answer:
                </label>
                <input
                  type="number"
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-5 py-3 text-xl border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 text-black"
                  placeholder="Type your answer here"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!userAnswer || isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white text-xl font-bold py-4 px-6 rounded-xl transition duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center gap-3"
              >
                {isSubmitting && (
                  <svg
                    className="animate-spin h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                )}
                🚀 Submit Answer
              </button>
            </form>
          </div>
        )}

        {/* Submission Feedback */}
        {submission && (
          <div
            className={`rounded-2xl shadow-lg p-8 border-4 transition duration-300 ${
              submission.is_correct
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <h3 className="text-2xl font-bold mb-3 text-black">
              {submission.is_correct ? "🎉 Correct!" : "😅 Not quite right"}
            </h3>
            <p className="text-lg text-gray-800 leading-relaxed">
              {submission.feedback}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
