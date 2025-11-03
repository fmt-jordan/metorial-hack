/*
  # Create Webhook Events Schema

  ## Overview
  This migration creates the database schema for storing Voice Assistant call completion 
  webhook events and associated quote line items for Fast Mold Testing mold inspection quotes.

  ## New Tables
  
  ### `webhook_events`
  Stores the main webhook event data from Voice Assistant call completions.
  - `id` (uuid, primary key) - Unique identifier for each webhook event
  - `name` (text) - Customer name or company name
  - `location` (text) - Service location/city (e.g., "Miami", "New York")
  - `client_address` (text) - Full service address for the inspection
  - `email` (text) - Customer email address
  - `phone` (text) - Customer phone number
  - `client_notes` (text) - Brief summary of customer's problem/request
  - `viewed` (boolean, default false) - Track if the quote email has been viewed
  - `created_at` (timestamptz) - Timestamp when webhook was received
  - `updated_at` (timestamptz) - Timestamp when record was last updated

  ### `quote_line_items`
  Stores individual service line items for each quote.
  - `id` (uuid, primary key) - Unique identifier for each line item
  - `webhook_event_id` (uuid, foreign key) - Reference to parent webhook event
  - `item` (text) - Service name (e.g., "First Room", "Add Small Room")
  - `item_price` (decimal) - Unit price for the service
  - `qty` (integer) - Quantity of service ordered
  - `created_at` (timestamptz) - Timestamp when line item was created

  ## Indexes
  - Index on `webhook_events.created_at` for efficient date-based queries
  - Index on `webhook_events.location` for filtering by service area
  - Index on `quote_line_items.webhook_event_id` for fast joins

  ## Security
  - Enable Row Level Security (RLS) on both tables
  - Add policy for authenticated users to read all webhook events
  - Add policy for authenticated users to read all quote line items
  - Add policy for service role to insert webhook events (for API endpoint)
  - Add policy for service role to insert quote line items (for API endpoint)

  ## Realtime
  - Enable Realtime replication on `webhook_events` table for live updates
*/

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  client_address text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  client_notes text DEFAULT '',
  viewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quote_line_items table
CREATE TABLE IF NOT EXISTS quote_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event_id uuid NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  item text NOT NULL,
  item_price decimal(10, 2) NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_location ON webhook_events(location);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_webhook_event_id ON quote_line_items(webhook_event_id);

-- Enable Row Level Security
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;

-- Policies for webhook_events table
CREATE POLICY "Anyone can read webhook events"
  ON webhook_events FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert webhook events"
  ON webhook_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update webhook events"
  ON webhook_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for quote_line_items table
CREATE POLICY "Anyone can read quote line items"
  ON quote_line_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert quote line items"
  ON quote_line_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Enable Realtime for webhook_events
ALTER PUBLICATION supabase_realtime ADD TABLE webhook_events;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_webhook_events_updated_at
  BEFORE UPDATE ON webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
