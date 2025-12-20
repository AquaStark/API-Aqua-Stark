-- Add parent_id columns to fish table for breeding/lineage tracking
-- This migration updates existing fish tables that were created before parent_ids were added

ALTER TABLE fish
  ADD COLUMN IF NOT EXISTS parent1_id INTEGER,
  ADD COLUMN IF NOT EXISTS parent2_id INTEGER;

-- Add foreign key constraints for parent references
-- Both parents must exist in the fish table
-- ON DELETE SET NULL: If a parent fish is deleted, set parent_id to NULL
-- This preserves lineage history even if parent fish are removed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_fish_parent1'
  ) THEN
    ALTER TABLE fish
      ADD CONSTRAINT fk_fish_parent1 
        FOREIGN KEY (parent1_id) REFERENCES fish(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_fish_parent2'
  ) THEN
    ALTER TABLE fish
      ADD CONSTRAINT fk_fish_parent2 
        FOREIGN KEY (parent2_id) REFERENCES fish(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
  END IF;
END $$;

-- Add indexes for efficient parent lookups and family tree queries
CREATE INDEX IF NOT EXISTS idx_fish_parent1 ON fish(parent1_id);
CREATE INDEX IF NOT EXISTS idx_fish_parent2 ON fish(parent2_id);
CREATE INDEX IF NOT EXISTS idx_fish_parents ON fish(parent1_id, parent2_id);

