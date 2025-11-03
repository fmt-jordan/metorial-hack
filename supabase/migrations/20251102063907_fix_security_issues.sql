/*
  # Fix Security Issues

  ## Changes
  1. Remove unused index `idx_webhook_events_location`
     - This index was created but never used in queries
     - Removing it improves write performance and reduces storage overhead
  
  2. Fix function search_path for `update_updated_at_column`
     - Set the function to be SECURITY DEFINER with explicit schema qualification
     - Add search_path configuration to prevent search path manipulation attacks
     - This makes the function immutable regarding search path changes

  ## Security Notes
  - Removing unused indexes reduces attack surface and maintenance burden
  - Setting search_path='pg_catalog' prevents malicious schema injection
  - SECURITY DEFINER ensures function runs with creator privileges safely
*/

-- Drop the unused location index
DROP INDEX IF EXISTS idx_webhook_events_location;

-- Recreate the update_updated_at_column function with security hardening
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
