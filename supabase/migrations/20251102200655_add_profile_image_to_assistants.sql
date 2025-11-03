/*
  # Add Profile Image to Assistants

  ## Overview
  This migration adds profile_image_url field to assistants table for storing assistant profile images.

  ## Changes
  - Add `profile_image_url` (text) column to assistants table

  ## Notes
  - Profile images can be uploaded and stored via Supabase Storage
  - URL will point to the storage location
*/

-- Add profile_image_url column to assistants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assistants' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE assistants ADD COLUMN profile_image_url text;
  END IF;
END $$;