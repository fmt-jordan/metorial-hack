/*
  # Add Call History and Transcript Fields

  ## Overview
  This migration extends the webhook_events table to store complete call history
  information including call type, duration, transcript, and recording URL.

  ## Changes to webhook_events table
  - `call_id` (text) - Unique call identifier from Vapi
  - `call_type` (text) - Type of call: 'inbound' or 'outbound'
  - `call_duration` (integer) - Duration of call in seconds
  - `call_status` (text) - Status: 'completed', 'missed', 'failed', etc.
  - `transcript` (jsonb) - Full conversation transcript with timestamps
  - `recording_url` (text) - URL to call recording audio file
  - `cost` (decimal) - Cost of the call in dollars

  ## Indexes
  - Index on call_id for fast lookup
  - Index on call_type for filtering
  - Index on call_status for filtering

  ## Notes
  - All new fields are nullable to maintain backwards compatibility
  - transcript stored as JSONB for flexible querying
*/

-- Add new columns for call history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_events' AND column_name = 'call_id'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN call_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_events' AND column_name = 'call_type'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN call_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_events' AND column_name = 'call_duration'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN call_duration integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_events' AND column_name = 'call_status'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN call_status text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_events' AND column_name = 'transcript'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN transcript jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_events' AND column_name = 'recording_url'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN recording_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_events' AND column_name = 'cost'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN cost decimal(10, 4);
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_call_id ON webhook_events(call_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_call_type ON webhook_events(call_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_call_status ON webhook_events(call_status);