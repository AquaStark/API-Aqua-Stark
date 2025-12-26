-- Enable Row-Level Security (RLS) on decorations table
-- This migration implements RLS policies for the decorations table based on ownership validation
-- Note: Backend uses service_role which bypasses RLS, but policies serve as defense-in-depth

-- Enable RLS if not already enabled
ALTER TABLE decorations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public read access for decorations" ON decorations;
DROP POLICY IF EXISTS "Decorations insert with valid owner" ON decorations;
DROP POLICY IF EXISTS "Decorations update with valid owner" ON decorations;
DROP POLICY IF EXISTS "Decorations delete with valid owner" ON decorations;

-- SELECT Policy: Allow public read access to all decorations
-- Anyone can read any decoration's data (public information)
CREATE POLICY "Public read access for decorations"
ON decorations
FOR SELECT
TO public
USING (true);

-- INSERT Policy: Allow insert if owner exists in players table
-- Validates that the owner is a valid player before allowing decoration creation
-- This prevents orphaned decoration records and ensures data integrity
CREATE POLICY "Decorations insert with valid owner"
ON decorations
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
-- This ensures decorations can only be updated if the owner relationship is valid
-- Note: Commonly used for updating is_active status in decoration activation/deactivation
CREATE POLICY "Decorations update with valid owner"
ON decorations
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
CREATE POLICY "Decorations delete with valid owner"
ON decorations
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
COMMENT ON TABLE decorations IS 'RLS enabled: Public read, owner validation for write operations. Backend uses service_role which bypasses RLS.';

