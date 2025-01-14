-- Create routine_steps table
CREATE TABLE routine_steps (
    id SERIAL PRIMARY KEY,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uuid UUID DEFAULT gen_random_uuid(),
    UNIQUE(routine_id, step_order)
);

-- Create routine_step_products table to link products to steps
CREATE TABLE routine_step_products (
    id SERIAL PRIMARY KEY,
    routine_step_id INTEGER NOT NULL REFERENCES routine_steps(id) ON DELETE CASCADE,
    user_product_id INTEGER NOT NULL REFERENCES user_products(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uuid UUID DEFAULT gen_random_uuid(),
    UNIQUE(routine_step_id, user_product_id)
);

-- Migrate existing data
INSERT INTO routine_steps (routine_id, step_order, step_name)
SELECT DISTINCT routine_id, step_order, COALESCE(step_name, '') as step_name
FROM routine_products;

INSERT INTO routine_step_products (routine_step_id, user_product_id, notes)
SELECT rs.id, rp.user_product_id, rp.notes
FROM routine_products rp
JOIN routine_steps rs ON rs.routine_id = rp.routine_id AND rs.step_order = rp.step_order;

-- Drop old table
DROP TABLE routine_products; 