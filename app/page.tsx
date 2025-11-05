"use client";

import { DifficultyLevel, ProblemType, useMathProblem } from "@/hooks/useMathProblem";
import { useEffect, useState } from "react";

interface MathProblem {
  problem_text: string;
  final_answer: number;
}

import { Toast } from './components/Toast';

export default function Home() {
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("medium");
  const [selectedType, setSelectedType] = useState<ProblemType>("addition");
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const {
    currentProblem: problem,
    submission,
    hints,
    solution,
    userHistory,
    isLoading,
    isSubmitting,
    isLoadingHints,
    isLoadingSolution,
    isLoadingHistory,
    error,
    generateProblem,
    submitAnswer,
    loadHints,
    loadSolution,
    loadHistory,
  } = useMathProblem();

  // Load user history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAnswer = parseFloat(userAnswer);
    if (isNaN(numericAnswer)) {
      return; // Could add error handling for invalid input
    }
    await submitAnswer(numericAnswer);
    setUserAnswer(""); // Reset input after submission
  };

  // Watch for error changes and show toast
  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
    }
  }, [error]);

  // Error handler function
  const handleError = (message: string) => {
    setToast({ message, type: 'error' });
  };

  // Success handler function
  const handleSuccess = (message: string) => {
    setToast({ message, type: 'success' });
  };

  // Handle generate problem with error feedback
  const handleGenerateProblem = async () => {
    try {
      await generateProblem(selectedDifficulty, selectedType);
      setShowHistory(false);
    } catch (err) {
      // Error is already set in the hook and will trigger toast via useEffect
    }
  };

  // Handle submit with error feedback
  const handleSubmitWithFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAnswer = parseFloat(userAnswer);
    if (isNaN(numericAnswer)) {
      handleError('Please enter a valid number');
      return;
    }
    try {
      await submitAnswer(numericAnswer);
      setUserAnswer("");
    } catch (err) {
      // Error is already set in the hook and will trigger toast via useEffect
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white p-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <main className="container mx-auto px-4 py-10 max-w-6xl w-full">
        {/* Header with Score */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-5xl font-extrabold text-sky-700 tracking-tight drop-shadow-sm">
            Math Fun Zone ✨
          </h1>
          <div className="mb-4" />
          {userHistory?.score && (
            <div className="bg-white rounded-xl shadow-md p-4 flex gap-6 justify-center">
              <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-sky-700">Total Score:</span>
            <span className="text-3xl font-bold text-sky-900">{userHistory.score.total_score}</span>
              </div>
              <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-sky-700">Problems:</span>
            <span className="text-3xl font-bold text-sky-900">
              {userHistory.score.problems_solved}/{userHistory.score.problems_attempted}
            </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls Card */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full">
            {/* Difficulty Selection */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-sky-700 mb-4 text-center">Select Difficulty</h3>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      selectedDifficulty === difficulty
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Type Selection */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-sky-700 mb-4 text-center">Choose Operation</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['addition', 'subtraction', 'multiplication', 'division'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`py-3 px-4 rounded-xl font-medium transition-all ${
                      selectedType === type
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateProblem}
              disabled={isLoading || isSubmitting}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 text-white text-xl font-bold py-5 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
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
              {isLoading ? "Generating..." : "🎲 Generate Problem"}
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setShowHistory(false)}
            className={`py-2 px-6 rounded-lg font-medium transition-all ${
              !showHistory
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Current Problem
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`py-2 px-6 rounded-lg font-medium transition-all ${
              showHistory
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Problem History
          </button>
        </div>

        {showHistory ? (
          /* History View */
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
            <h2 className="text-2xl font-bold mb-6 text-sky-700">Problem History</h2>
            {isLoadingHistory ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-100 p-4 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : userHistory?.history?.length ? (
              <div className="space-y-4">
                {userHistory.history.map((problem, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-lg font-medium text-gray-900">
                        {problem.problem_text}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                        </span>
                        <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded text-sm font-medium">
                          {problem.problem_type.charAt(0).toUpperCase() + problem.problem_type.slice(1)}
                        </span>
                      </div>
                    </div>
                    {problem.submission && (
                      <div className={`mt-2 p-2 rounded ${
                        problem.submission.is_correct ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <p className={`${problem.submission.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                          {problem.submission.is_correct ? '✅ Correct' : '❌ Incorrect'} 
                          {problem.submission.points_earned > 0 && 
                            ` • ${problem.submission.points_earned} points`}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No problems attempted yet.</p>
            )}
          </div>
        ) : (
          /* Current Problem View */
          <>
            {problem && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Problem Card */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex justify-between items-start mb-6">
                      <h2 className="text-2xl font-bold text-sky-700">Problem:</h2>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                        </span>
                        <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-medium">
                          {problem.problem_type.charAt(0).toUpperCase() + problem.problem_type.slice(1)}
                        </span>
                      </div>
                    </div>

                    {isSubmitting ? (
                      <div className="animate-pulse space-y-3 mb-6">
                        <div className="h-6 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-100 rounded w-2/4"></div>
                      </div>
                    ) : (
                      <p className="text-2xl text-gray-800 leading-relaxed mb-6">
                        {problem.problem_text}
                      </p>
                    )}

                    <form onSubmit={handleSubmitWithFeedback} className="space-y-6">
                      <div>
                        <label
                          htmlFor="answer"
                          className="block text-lg font-semibold text-gray-700 mb-2"
                        >
                          ✍️ Your Answer:
                        </label>
                        <input
                          type="number"
                          id="answer"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="w-full px-5 py-3 text-xl border-2 border-sky-200 rounded-xl focus:ring-4 focus:ring-sky-100 focus:border-sky-500 text-black"
                          placeholder="Type your answer here"
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={!userAnswer || isSubmitting}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 text-white text-xl font-bold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-3"
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
                      </div>
                    </form>

                    {submission && (
                      <div className={`mt-6 rounded-xl p-6 ${
                        submission.is_correct
                          ? "bg-green-50 border-2 border-green-200"
                          : "bg-red-50 border-2 border-red-200"
                      }`}>
                        <h3 className="text-2xl font-bold mb-2 text-black">
                          {submission.is_correct ? "🎉 Correct!" : "😅 Not quite right"}
                          {submission.points_earned > 0 && 
                            <span className="text-lg ml-2">
                              (+{submission.points_earned} points)
                            </span>
                          }
                        </h3>
                        <p className="text-lg text-gray-800 leading-relaxed">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hints and Solution Panel */}
                <div className="space-y-6">
                  {/* Hints Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-yellow-700 mb-4 flex justify-between items-center">
                      <span>💡 Hints</span>
                      {problem.hints_available > 0 && (
                        <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {hints.length}/{problem.hints_available} Available
                        </span>
                      )}
                    </h3>

                    {hints.length === 0 ? (
                      <button
                        onClick={loadHints}
                        disabled={isLoadingHints || hints.length >= problem.hints_available}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                      >
                        {isLoadingHints ? "Loading hints..." : "Get a Hint"}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {hints.map((hint, index) => (
                          <div key={hint.id} className="bg-yellow-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-yellow-800 mb-1">
                              Hint #{index + 1}:
                            </p>
                            <p className="text-gray-800">{hint.hint_text}</p>
                          </div>
                        ))}
                        {hints.length < problem.hints_available && (
                          <button
                            onClick={loadHints}
                            disabled={isLoadingHints}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                          >
                            {isLoadingHints ? "Loading next hint..." : "Get Another Hint"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Solution Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-purple-700 mb-4">
                      📝 Step-by-Step Solution
                    </h3>

                    {solution ? (
                      <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                        {solution.split('\n').map((step, index) => (
                          <p key={index} className="text-gray-800">
                            {step}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={loadSolution}
                        disabled={isLoadingSolution || !submission?.is_correct}
                        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                      >
                        {isLoadingSolution ? "Loading solution..." : 
                         !submission?.is_correct ? "Solve the problem first" : 
                         "Show Solution"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
