-- Add hero_media column to proposals table
-- This column stores the URL for a background image or video in the hero section

ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS hero_media TEXT;

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN proposals.hero_media IS 'URL for background image or video in the hero section (appears behind company name with blur/opacity effect)';
