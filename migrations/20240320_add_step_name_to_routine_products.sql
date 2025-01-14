-- Add step_name column to routine_products table
ALTER TABLE routine_products
ADD COLUMN step_name TEXT NOT NULL DEFAULT '';

-- Update existing records to have empty string as step_name
UPDATE routine_products
SET step_name = ''
WHERE step_name IS NULL; 