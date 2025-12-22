-- Add sprite_url column to fish table for storing 2D sprites or 3D assets for Unity
-- This field is separate from image_url which is used for the profile picture

ALTER TABLE fish
  ADD COLUMN IF NOT EXISTS sprite_url TEXT;

-- Add comment documenting the column purpose
COMMENT ON COLUMN fish.sprite_url IS 'URL to the 2D sprite or 3D asset (Unity model) for this fish.';
