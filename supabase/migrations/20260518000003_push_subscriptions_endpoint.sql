-- Promote the Web Push endpoint to a first-class, unique column.

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS endpoint TEXT;

-- Backfill endpoint for any existing rows from the stored JSON
UPDATE push_subscriptions
  SET endpoint = subscription->>'endpoint'
  WHERE endpoint IS NULL;

ALTER TABLE push_subscriptions
  ALTER COLUMN endpoint SET NOT NULL;

ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
