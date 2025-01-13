-- Create routines table
CREATE TABLE routines (
  id SERIAL PRIMARY KEY,
  clerk_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'evening', 'both')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uuid TEXT NOT NULL DEFAULT gen_random_uuid()
);

-- Create routine_products table for products in each routine
CREATE TABLE routine_products (
  id SERIAL PRIMARY KEY,
  routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_product_id INTEGER NOT NULL REFERENCES user_products(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uuid TEXT NOT NULL DEFAULT gen_random_uuid(),
  UNIQUE(routine_id, step_order)
);

-- Create indexes
CREATE INDEX idx_routines_clerk_id ON routines(clerk_id);
CREATE INDEX idx_routine_products_routine_id ON routine_products(routine_id);
CREATE INDEX idx_routine_products_user_product_id ON routine_products(user_product_id); 