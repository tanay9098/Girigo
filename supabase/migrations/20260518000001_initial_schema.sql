-- Initial schema: wishes and push_subscriptions with row-level security.

-- Wishes table (only ciphertext stored)
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  encrypted_wish TEXT NOT NULL,      -- AES-256 ciphertext, base64
  iv TEXT NOT NULL,                  -- Initialization vector
  expires_at TIMESTAMPTZ NOT NULL,   -- created_at + 24h
  is_granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  subscription JSONB NOT NULL,       -- Web Push subscription object
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users see only their own rows
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_wishes" ON wishes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
