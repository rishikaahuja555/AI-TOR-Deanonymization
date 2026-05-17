/*
  # Add threat alerts and AI analyses tables

  1. New Tables
    - `threat_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (text) - alert type: onion_detected, wallet_found, threat_spike, exploit_detected, breach_intel, malware_signature
      - `severity` (text) - low, medium, high, critical
      - `title` (text) - alert headline
      - `description` (text) - alert details
      - `metadata` (jsonb) - additional structured data
      - `is_read` (boolean, default false) - read status
      - `created_at` (timestamptz, default now())
    - `ai_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `input_text` (text) - the text that was analyzed
      - `classification` (text) - normal, suspicious, critical
      - `confidence` (numeric) - 0-1 confidence score
      - `threat_score` (integer) - 0-100 predicted threat score
      - `nlp_sentiment` (text) - malicious, neutral, benign
      - `nlp_topics` (jsonb) - array of detected topic tags
      - `nlp_key_indicators` (jsonb) - array of key threat indicators
      - `named_entities` (jsonb) - extracted named entities
      - `iocs` (jsonb) - extracted indicators of compromise
      - `onion_urls` (jsonb) - parsed onion URL data
      - `wallet_clusters` (jsonb) - wallet clustering results
      - `threat_actors` (jsonb) - threat actor profiles
      - `summary` (text) - AI-generated intelligence summary
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add restrictive policies: users can only CRUD their own data
*/

CREATE TABLE IF NOT EXISTS threat_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'threat_spike',
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE threat_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own threat alerts"
  ON threat_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own threat alerts"
  ON threat_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own threat alerts"
  ON threat_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own threat alerts"
  ON threat_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text text NOT NULL DEFAULT '',
  classification text NOT NULL DEFAULT 'normal',
  confidence numeric DEFAULT 0,
  threat_score integer DEFAULT 0,
  nlp_sentiment text DEFAULT 'neutral',
  nlp_topics jsonb DEFAULT '[]',
  nlp_key_indicators jsonb DEFAULT '[]',
  named_entities jsonb DEFAULT '{}',
  iocs jsonb DEFAULT '[]',
  onion_urls jsonb DEFAULT '[]',
  wallet_clusters jsonb DEFAULT '[]',
  threat_actors jsonb DEFAULT '[]',
  summary text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own AI analyses"
  ON ai_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI analyses"
  ON ai_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI analyses"
  ON ai_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI analyses"
  ON ai_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_threat_alerts_user_id ON threat_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_alerts_severity ON threat_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_threat_alerts_created_at ON threat_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at DESC);
