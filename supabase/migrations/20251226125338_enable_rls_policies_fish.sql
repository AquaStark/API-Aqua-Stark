-- Enable Row-Level Security (RLS) on fish table
-- This migration implements RLS policies for the fish table based on ownership validation
-- Note: Backend uses service_role which bypasses RLS, but policies serve as defense-in-depth

-- Enable RLS if not already enabled
ALTER TABLE fish ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public read access for fish" ON fish;
DROP POLICY IF EXISTS "Fish insert with valid owner" ON fish;
DROP POLICY IF EXISTS "Fish update with valid owner" ON fish;
DROP POLICY IF EXISTS "Fish delete with valid owner" ON fish;

-- SELECT Policy: Allow public read access to all fish
-- Anyone can read any fish's data (public information)
CREATE POLICY "Public read access for fish"
ON fish
FOR SELECT
TO public
USING (true);

-- INSERT Policy: Allow insert if owner exists in players table
-- Validates that the owner is a valid player before allowing fish creation
-- This prevents orphaned fish records and ensures data integrity
CREATE POLICY "Fish insert with valid owner"
ON fish
FOR INSERT
TO public
WITH CHECK (
  -- Validate that owner exists in players table
  -- owner refers to NEW.owner in WITH CHECK for INSERT policies
  EXISTS (
    SELECT 1 FROM players WHERE address = owner
  )
);

-- UPDATE Policy: Allow update if owner exists in players table
-- Validates that the owner (existing or new) is a valid player
-- This ensures fish can only be updated if the owner relationship is valid
CREATE POLICY "Fish update with valid owner"
ON fish
FOR UPDATE
TO public
USING (
  -- Validate that current owner exists in players table
  -- owner refers to OLD.owner in USING for UPDATE policies
  EXISTS (
    SELECT 1 FROM players WHERE address = owner
  )
)
WITH CHECK (
  -- Validate that new owner (if changed) exists in players table
  -- owner refers to NEW.owner in WITH CHECK for UPDATE policies
  EXISTS (
    SELECT 1 FROM players WHERE address = owner
  )
);

-- DELETE Policy: Allow delete if owner exists in players table
-- Validates that the owner is a valid player before allowing deletion
-- This ensures data integrity is maintained during deletions
CREATE POLICY "Fish delete with valid owner"
ON fish
FOR DELETE
TO public
USING (
  -- Validate that owner exists in players table
  -- owner refers to OLD.owner in USING for DELETE policies
  EXISTS (
    SELECT 1 FROM players WHERE address = owner
  )
);

-- Add comment documenting RLS policies
COMMENT ON TABLE fish IS 'RLS enabled: Public read, owner validation for write operations. Backend uses service_role which bypasses RLS.';

