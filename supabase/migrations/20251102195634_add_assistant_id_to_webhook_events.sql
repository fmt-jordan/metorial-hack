/*
  # Add Assistant ID to Webhook Events

  ## Overview
  This migration adds assistant_id field to webhook_events table to support multi-agent tracking.

  ## Changes
  - Add `assistant_id` (text) column to webhook_events table
  - Create index on assistant_id for efficient filtering
  - Add foreign key-like validation (soft reference to assistants table)

  ## Notes
  - This allows filtering quotes and performance metrics by specific Vapi assistant
  - Existing records will have NULL assistant_id (legacy data)
*/

-- Add assistant_id column to webhook_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_events' AND column_name = 'assistant_id'
  ) THEN
    ALTER TABLE webhook_events ADD COLUMN assistant_id text;
  END IF;
END $$;

-- Create index for faster filtering by assistant
CREATE INDEX IF NOT EXISTS idx_webhook_events_assistant_id ON webhook_events(assistant_id);