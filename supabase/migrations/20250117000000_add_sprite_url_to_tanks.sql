-- Add sprite_url column to tanks table for storing 2D sprites for Unity
-- This field stores the visual representation of the tank

ALTER TABLE tanks
  ADD COLUMN IF NOT EXISTS sprite_url TEXT;

-- Add comment documenting the column purpose
COMMENT ON COLUMN tanks.sprite_url IS 'URL to the 2D sprite for this tank.';

