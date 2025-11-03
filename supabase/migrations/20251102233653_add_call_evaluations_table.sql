/*
  # Add Call Evaluations Table

  1. New Tables
    - `call_evaluations`
      - `id` (uuid, primary key) - Unique identifier for the evaluation
      - `call_id` (text, unique) - Reference to the call ID from webhook_events
      - `assistant_id` (text) - Reference to the assistant
      - `call_quality_score` (numeric) - Overall quality score (0.0-1.0)
      - `sale_outcome` (text) - Outcome: closed, pending, lost, or other
      - `sale_amount` (numeric, nullable) - Quote amount if mentioned
      - `call_duration_score` (numeric) - Score for call duration efficiency
      - `conversation_flow_score` (numeric) - Score for conversation quality
      - `objection_handling_score` (numeric) - Score for handling objections
      - `rapport_building_score` (numeric) - Score for building rapport
      - `strengths` (jsonb) - Array of strength points
      - `improvements` (jsonb) - Array of improvement suggestions
      - `system_prompt_suggestion` (text, nullable) - Suggested prompt improvements
      - `created_at` (timestamptz) - Evaluation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `call_evaluations` table
    - Add policies for public read access (for demo purposes)
    - Production would restrict based on user authentication

  3. Indexes
    - Index on call_id for fast lookups
    - Index on assistant_id for filtering by agent
    - Index on created_at for time-based queries
*/

CREATE TABLE IF NOT EXISTS call_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id text UNIQUE NOT NULL,
  assistant_id text NOT NULL,
  call_quality_score numeric NOT NULL DEFAULT 0,
  sale_outcome text NOT NULL DEFAULT 'other',
  sale_amount numeric,
  call_duration_score numeric NOT NULL DEFAULT 0,
  conversation_flow_score numeric NOT NULL DEFAULT 0,
  objection_handling_score numeric NOT NULL DEFAULT 0,
  rapport_building_score numeric NOT NULL DEFAULT 0,
  strengths jsonb DEFAULT '[]'::jsonb,
  improvements jsonb DEFAULT '[]'::jsonb,
  system_prompt_suggestion text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE call_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to call_evaluations"
  ON call_evaluations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to call_evaluations"
  ON call_evaluations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to call_evaluations"
  ON call_evaluations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_call_evaluations_call_id ON call_evaluations(call_id);
CREATE INDEX IF NOT EXISTS idx_call_evaluations_assistant_id ON call_evaluations(assistant_id);
CREATE INDEX IF NOT EXISTS idx_call_evaluations_created_at ON call_evaluations(created_at DESC);
