"use client";

import { useState } from "react";
import { useMathProblem } from "@/hooks/useMathProblem";

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Math Problem Generator
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={generateProblem}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
          >
            {isLoading ? "Generating..." : "Generate New Problem"}
          </button>
        </div>

        {problem && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Problem:
            </h2>
            <p className="text-lg text-gray-800 leading-relaxed mb-6">
              {problem.problem_text}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="answer"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Answer:
                </label>
                <input
                  type="number"
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your answer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!userAnswer || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
              >
                Submit Answer
              </button>
            </form>
          </div>
        )}

        {submission && (
          <div
            className={`rounded-lg shadow-lg p-6 ${
              submission.is_correct
                ? "bg-green-50 border-2 border-green-200"
                : "bg-yellow-50 border-2 border-yellow-200"
            }`}
          >
            <h3 className="text-xl font-semibold mb-2">
              {submission.is_correct ? "✅ Correct!" : "❌ Not quite right"}
            </h3>
            <p className="text-gray-800 leading-relaxed">
              {submission.feedback}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
