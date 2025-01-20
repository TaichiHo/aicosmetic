-- Create user_steps table for shared steps
CREATE TABLE user_steps (
    id SERIAL PRIMARY KEY,
    clerk_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uuid UUID DEFAULT gen_random_uuid(),
    UNIQUE(clerk_id, name)
);

-- Add default steps for existing users
INSERT INTO user_steps (clerk_id, name)
SELECT DISTINCT clerk_id, step_name
FROM (
    SELECT clerk_id, unnest(ARRAY['Cleansing', 'Toning', 'Moisturizing']) as step_name
    FROM users
) as default_steps;

-- Add custom steps from existing routines
INSERT INTO user_steps (clerk_id, name)
SELECT DISTINCT r.clerk_id, rs.step_name
FROM routine_steps rs
JOIN routines r ON rs.routine_id = r.id
WHERE rs.step_name NOT IN ('Cleansing', 'Toning', 'Moisturizing')
ON CONFLICT (clerk_id, name) DO NOTHING;

-- Modify routine_steps to reference user_steps
ALTER TABLE routine_steps
ADD COLUMN user_step_id INTEGER REFERENCES user_steps(id) ON DELETE CASCADE;

-- Migrate existing steps
UPDATE routine_steps rs
SET user_step_id = us.id
FROM routines r, user_steps us
WHERE rs.routine_id = r.id 
AND r.clerk_id = us.clerk_id 
AND rs.step_name = us.name;

-- Make user_step_id required
ALTER TABLE routine_steps
ALTER COLUMN user_step_id SET NOT NULL;

-- Drop the now redundant step_name column
ALTER TABLE routine_steps
DROP COLUMN step_name; 