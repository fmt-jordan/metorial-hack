/*
  # Add Raw Payload and Headers to Webhook Events

  ## Overview
  This migration adds columns to store the complete webhook request data including
  the raw payload and HTTP headers for debugging and audit purposes.

  ## Changes to webhook_events table
  1. New Columns
    - `raw_payload` (jsonb) - Stores the complete raw JSON payload received from the webhook
    - `headers` (jsonb) - Stores HTTP headers from the webhook request (Content-Type, User-Agent, etc.)

  ## Notes
  - Both columns are nullable to maintain backward compatibility with existing records
  - JSONB format allows efficient querying and indexing of the stored data
  - Existing webhook_events records will have NULL values for these new columns
*/

-- Add raw_payload column to store the complete webhook request payload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_events' AND column_name = 'raw_payload'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN raw_payload jsonb;
  END IF;
END $$;

-- Add headers column to store HTTP headers from the webhook request
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_events' AND column_name = 'headers'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN headers jsonb;
  END IF;
END $$;
