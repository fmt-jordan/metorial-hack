/*
  # Add Quote Status to Webhook Events

  1. Changes
    - Add `quote_status` column to `webhook_events` table
      - Type: text with CHECK constraint for valid values
      - Allowed values: 'pending', 'won', 'lost'
      - Default: 'pending'
      - Nullable to support existing records and calls without quotes
  
  2. Purpose
    - Track the lifecycle of quotes generated from calls
    - Enable performance metrics like win/loss rates
    - Support quote state management in the UI
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_events' AND column_name = 'quote_status'
  ) THEN
    ALTER TABLE webhook_events 
    ADD COLUMN quote_status text 
    CHECK (quote_status IN ('pending', 'won', 'lost'))
    DEFAULT 'pending';
  END IF;
END $$;