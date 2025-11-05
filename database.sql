-- Create enum types for difficulty and problem type
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE problem_type AS ENUM ('addition', 'subtraction', 'multiplication', 'division');

-- Create math_problem_sessions table with new fields
CREATE TABLE IF NOT EXISTS math_problem_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    problem_text TEXT NOT NULL,
    correct_answer NUMERIC NOT NULL,
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    problem_type problem_type NOT NULL,
    solution_steps TEXT, -- Stored when user requests solution
    score INTEGER GENERATED ALWAYS AS (
        CASE difficulty
            WHEN 'easy' THEN 10
            WHEN 'medium' THEN 20
            WHEN 'hard' THEN 30
        END
    ) STORED,
    hints_available INTEGER NOT NULL DEFAULT 3 -- Number of hints available for this session
);

-- Create math_problem_submissions table
CREATE TABLE IF NOT EXISTS math_problem_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES math_problem_sessions(id) ON DELETE CASCADE,
    user_answer NUMERIC NOT NULL,
    is_correct BOOLEAN NOT NULL,
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_earned INTEGER -- Points earned for this submission
);

-- Create hints table
CREATE TABLE IF NOT EXISTS math_problem_hints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES math_problem_sessions(id) ON DELETE CASCADE,
    hint_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hint_order INTEGER NOT NULL -- Order of hints for progressive difficulty
);

-- Enable Row Level Security
ALTER TABLE math_problem_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_problem_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_problem_hints ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for anonymous access (for assessment purposes)
-- In production, you would want more restrictive policies

-- Allow anonymous users to read and insert math_problem_sessions
CREATE POLICY "Allow anonymous access to math_problem_sessions" ON math_problem_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow anonymous users to read and insert math_problem_submissions
CREATE POLICY "Allow anonymous access to math_problem_submissions" ON math_problem_submissions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow anonymous users to read and insert math_problem_hints
CREATE POLICY "Allow anonymous access to math_problem_hints" ON math_problem_hints
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_math_problem_submissions_session_id ON math_problem_submissions(session_id);
CREATE INDEX idx_math_problem_sessions_created_at ON math_problem_sessions(created_at DESC);
CREATE INDEX idx_math_problem_sessions_difficulty_type ON math_problem_sessions(difficulty, problem_type);
CREATE INDEX idx_math_problem_hints_session_order ON math_problem_hints(session_id, hint_order);

-- Create materialized view for user scores (refreshed periodically)
CREATE MATERIALIZED VIEW user_scores AS
SELECT 
    COALESCE(SUM(points_earned), 0) as total_score,
    COUNT(DISTINCT session_id) as problems_attempted,
    COUNT(CASE WHEN is_correct THEN 1 END) as problems_solved
FROM math_problem_submissions
WHERE points_earned IS NOT NULL;

-- Drop existing functions and triggers first
DROP FUNCTION IF EXISTS refresh_user_scores() CASCADE;
DROP FUNCTION IF EXISTS refresh_user_scores_trigger_fn() CASCADE;
DROP TRIGGER IF EXISTS refresh_user_scores_trigger ON math_problem_submissions;

-- Create a function to refresh the user_scores materialized view (for trigger)
CREATE OR REPLACE FUNCTION refresh_user_scores_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_scores;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a separate function that can be called via RPC
CREATE OR REPLACE FUNCTION refresh_user_scores()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW user_scores;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; -- Allow this function to be called by any authenticated user

-- Grant execute permission to public (needed for Supabase RPC)
GRANT EXECUTE ON FUNCTION refresh_user_scores() TO PUBLIC;

-- Create a trigger to refresh the materialized view after each submission
CREATE TRIGGER refresh_user_scores_trigger
AFTER INSERT OR UPDATE ON math_problem_submissions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_user_scores_trigger_fn();