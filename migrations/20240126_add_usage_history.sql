-- Create a new table for usage history
CREATE TABLE usage_history (
  id SERIAL PRIMARY KEY,
  user_product_id INTEGER NOT NULL REFERENCES user_products(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_percentage INTEGER NOT NULL CHECK (usage_percentage >= 0 AND usage_percentage <= 100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add an index on user_product_id for faster lookups
CREATE INDEX idx_usage_history_user_product_id ON usage_history(user_product_id); 