-- Add next_check_at to products table
-- New rows default to 24h from now; existing rows backfilled from created_at

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS next_check_at TIMESTAMPTZ
    DEFAULT (NOW() + INTERVAL '24 hours');

-- Backfill existing rows using their creation date
UPDATE products
SET next_check_at = created_at + INTERVAL '24 hours'
WHERE next_check_at IS NULL;

-- Index so the cron query (WHERE next_check_at <= now()) is fast
CREATE INDEX IF NOT EXISTS idx_products_next_check_at
  ON products (next_check_at)
  WHERE is_active = true;
