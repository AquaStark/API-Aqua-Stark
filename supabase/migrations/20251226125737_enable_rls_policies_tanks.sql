-- Enable Row-Level Security (RLS) on tanks table
-- This migration implements RLS policies for the tanks table based on ownership validation
-- Note: Backend uses service_role which bypasses RLS, but policies serve as defense-in-depth

-- Enable RLS if not already enabled
ALTER TABLE tanks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public read access for tanks" ON tanks;
DROP POLICY IF EXISTS "Tanks insert with valid owner" ON tanks;
DROP POLICY IF EXISTS "Tanks update with valid owner" ON tanks;
DROP POLICY IF EXISTS "Tanks delete with valid owner" ON tanks;

-- SELECT Policy: Allow public read access to all tanks
-- Anyone can read any tank's data (public information)
CREATE POLICY "Public read access for tanks"
ON tanks
FOR SELECT
TO public
USING (true);

-- INSERT Policy: Allow insert if owner exists in players table
-- Validates that the owner is a valid player before allowing tank creation
-- This prevents orphaned tank records and ensures data integrity
CREATE POLICY "Tanks insert with valid owner"
ON tanks
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
-- This ensures tanks can only be updated if the owner relationship is valid
CREATE POLICY "Tanks update with valid owner"
ON tanks
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
-- Note: When a tank is deleted, fish.tank_id is set to NULL via FK constraint (ON DELETE SET NULL)
-- This ensures data integrity is maintained during deletions
CREATE POLICY "Tanks delete with valid owner"
ON tanks
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
COMMENT ON TABLE tanks IS 'RLS enabled: Public read, owner validation for write operations. Backend uses service_role which bypasses RLS.';

