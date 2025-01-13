-- Create categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial cosmetic product categories
INSERT INTO categories (name) VALUES
  ('Skincare'),
  ('Makeup'),
  ('Haircare'),
  ('Fragrance'),
  ('Body Care'),
  ('Tools'); 