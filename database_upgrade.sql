-- Create new enum types safely
DO $$ 
BEGIN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE problem_type AS ENUM ('addition', 'subtraction', 'multiplication', 'division');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to math_problem_sessions table safely
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check and add difficulty column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'math_problem_sessions' AND column_name = 'difficulty'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE math_problem_sessions ADD COLUMN difficulty difficulty_level NOT NULL DEFAULT 'medium';
    END IF;

    -- Check and add problem_type column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'math_problem_sessions' AND column_name = 'problem_type'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE math_problem_sessions ADD COLUMN problem_type problem_type NOT NULL DEFAULT 'addition';
    END IF;

    -- Check and add solution_steps column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'math_problem_sessions' AND column_name = 'solution_steps'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE math_problem_sessions ADD COLUMN solution_steps TEXT;
    END IF;

    -- Check and add hints_available column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'math_problem_sessions' AND column_name = 'hints_available'
    ) INTO col_exists;
    IF NOT col_exists THEN
        ALTER TABLE math_problem_sessions ADD COLUMN hints_available INTEGER NOT NULL DEFAULT 3;
    END IF;
END $$;

-- Add generated score column
DO $$ 
DECLARE
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'math_problem_sessions'
        AND column_name = 'score'
    ) INTO column_exists;

    IF column_exists THEN
        ALTER TABLE math_problem_sessions DROP COLUMN score;
    END IF;

    ALTER TABLE math_problem_sessions
        ADD COLUMN score INTEGER GENERATED ALWAYS AS (
            CASE difficulty
                WHEN 'easy' THEN 10
                WHEN 'medium' THEN 20
                WHEN 'hard' THEN 30
            END
        ) STORED;
END $$;

-- Add points_earned column safely
DO $$
BEGIN
    ALTER TABLE math_problem_submissions ADD COLUMN points_earned INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create hints table safely
DO $$
BEGIN
    CREATE TABLE math_problem_hints (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES math_problem_sessions(id) ON DELETE CASCADE,
        hint_text TEXT NOT NULL,
        hint_order INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Enable RLS on new table
ALTER TABLE math_problem_hints ENABLE ROW LEVEL SECURITY;

-- Create new indexes safely
DO $$
BEGIN
    CREATE INDEX idx_math_problem_sessions_difficulty_type 
        ON math_problem_sessions(difficulty, problem_type);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE INDEX idx_math_problem_hints_session_order 
        ON math_problem_hints(session_id, hint_order);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create policy safely
DO $$
BEGIN
    CREATE POLICY "Allow anonymous access to math_problem_hints" 
        ON math_problem_hints
        FOR ALL
        USING (true)
        WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create materialized view safely
DO $$
BEGIN
    CREATE MATERIALIZED VIEW user_scores AS
    SELECT 
        COALESCE(SUM(points_earned), 0) as total_score,
        COUNT(DISTINCT session_id) as problems_attempted,
        COUNT(CASE WHEN is_correct THEN 1 END) as problems_solved
    FROM math_problem_submissions
    WHERE points_earned IS NOT NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create index on the materialized view safely
DO $$
BEGIN
    CREATE INDEX idx_user_scores_total 
        ON user_scores(total_score);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions (adjust as needed based on your setup)
GRANT SELECT ON user_scores TO PUBLIC;