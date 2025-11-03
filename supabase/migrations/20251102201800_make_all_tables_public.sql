/*
  # Make All Tables Public (Prototype Only)

  ## Overview
  This migration removes restrictive RLS policies and makes all tables publicly accessible.
  WARNING: This is for prototype purposes only and should NOT be used in production.

  ## Changes
  - Drop all existing restrictive policies on webhook_events
  - Drop all existing restrictive policies on quote_line_items
  - Drop all existing restrictive policies on assistants
  - Add public access policies for all operations

  ## Security Warning
  This configuration allows unrestricted access to all data. Only use in development/prototype environments.
*/

-- Drop existing policies for webhook_events
DROP POLICY IF EXISTS "Anyone can read webhook events" ON webhook_events;
DROP POLICY IF EXISTS "Service role can insert webhook events" ON webhook_events;
DROP POLICY IF EXISTS "Authenticated users can update webhook events" ON webhook_events;

-- Drop existing policies for quote_line_items
DROP POLICY IF EXISTS "Anyone can read quote line items" ON quote_line_items;
DROP POLICY IF EXISTS "Service role can insert quote line items" ON quote_line_items;

-- Drop existing policies for assistants
DROP POLICY IF EXISTS "Anyone can view active assistants" ON assistants;
DROP POLICY IF EXISTS "Authenticated users can view all assistants" ON assistants;
DROP POLICY IF EXISTS "Authenticated users can insert assistants" ON assistants;
DROP POLICY IF EXISTS "Authenticated users can update assistants" ON assistants;
DROP POLICY IF EXISTS "Authenticated users can delete assistants" ON assistants;

-- Create public access policies for webhook_events
CREATE POLICY "Public access for all operations on webhook_events"
  ON webhook_events
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create public access policies for quote_line_items
CREATE POLICY "Public access for all operations on quote_line_items"
  ON quote_line_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create public access policies for assistants
CREATE POLICY "Public access for all operations on assistants"
  ON assistants
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);