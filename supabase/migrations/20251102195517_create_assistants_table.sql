/*
  # Create Assistants Table for Multi-Agent Support

  ## Overview
  This migration creates the assistants table to store configuration data for multiple Vapi AI agents.

  ## New Tables
  - `assistants`
    - `id` (uuid, primary key) - Unique identifier for the assistant record
    - `assistant_id` (text, unique, not null) - Vapi Assistant ID
    - `name` (text, not null) - Display name for the assistant
    - `description` (text) - Optional description of the assistant's purpose
    - `is_active` (boolean, default true) - Whether the assistant is currently active
    - `created_at` (timestamptz, default now()) - Record creation timestamp
    - `updated_at` (timestamptz, default now()) - Record update timestamp

  ## Security
  - Enable RLS on assistants table
  - Add policies for authenticated users to read assistant data
  - Add policies for authenticated users to manage assistants

  ## Notes
  - This table supports multiple Vapi agents in the application
  - Each agent can be selected from a dropdown to filter calls, quotes, and performance data
*/

-- Create assistants table
CREATE TABLE IF NOT EXISTS assistants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active assistants (for dropdown selection)
CREATE POLICY "Anyone can view active assistants"
  ON assistants
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can view all assistants
CREATE POLICY "Authenticated users can view all assistants"
  ON assistants
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert assistants
CREATE POLICY "Authenticated users can insert assistants"
  ON assistants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update assistants
CREATE POLICY "Authenticated users can update assistants"
  ON assistants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete assistants
CREATE POLICY "Authenticated users can delete assistants"
  ON assistants
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assistants_assistant_id ON assistants(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistants_is_active ON assistants(is_active);