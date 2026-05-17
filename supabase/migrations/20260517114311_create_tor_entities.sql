/*
  # Create tor_entities table

  1. New Table
    - `tor_entities`
      - `id` (uuid, primary key)
      - `type` (text) - entity type: onion_url, crypto_wallet, email, ip_address, username, domain
      - `value` (text) - the actual entity value
      - `threat_score` (integer, 0-100) - threat severity score
      - `confidence` (numeric, 0-1) - detection confidence
      - `context` (text) - surrounding context where entity was found
      - `source` (text) - data source (darknet_scan, manual_entry, api_import)
      - `metadata` (jsonb) - additional structured data
      - `is_verified` (boolean, default false) - whether entity has been verified
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `tor_entities`
    - Add restrictive policies: authenticated users can only access their own data
*/

CREATE TABLE IF NOT EXISTS tor_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'onion_url',
  value text NOT NULL DEFAULT '',
  threat_score integer DEFAULT 0,
  confidence numeric DEFAULT 0,
  context text DEFAULT '',
  source text DEFAULT 'darknet_scan',
  metadata jsonb DEFAULT '{}',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tor_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tor entities"
  ON tor_entities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tor entities"
  ON tor_entities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tor entities"
  ON tor_entities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tor entities"
  ON tor_entities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tor_entities_user_id ON tor_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_tor_entities_type ON tor_entities(type);
CREATE INDEX IF NOT EXISTS idx_tor_entities_threat_score ON tor_entities(threat_score DESC);
CREATE INDEX IF NOT EXISTS idx_tor_entities_created_at ON tor_entities(created_at DESC);
