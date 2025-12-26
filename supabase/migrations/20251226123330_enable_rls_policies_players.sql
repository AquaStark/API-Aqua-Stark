-- Enable Row-Level Security (RLS) on players table
-- This migration implements RLS policies for the players table based on ownership
-- Note: Backend uses service_role which bypasses RLS, but policies serve as defense-in-depth

-- Enable RLS if not already enabled
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public read access for players" ON players;
DROP POLICY IF EXISTS "Public insert access for players" ON players;
DROP POLICY IF EXISTS "Players can update own record" ON players;
DROP POLICY IF EXISTS "Players can delete own record" ON players;

-- SELECT Policy: Allow public read access to all players
-- Anyone can read any player's data (public profile information)
CREATE POLICY "Public read access for players"
ON players
FOR SELECT
TO public
USING (true);

-- INSERT Policy: Allow public insert for new player registration
-- Anyone can create a new player record (for registration)
CREATE POLICY "Public insert access for players"
ON players
FOR INSERT
TO public
WITH CHECK (true);

-- UPDATE Policy: Allow users to update only their own player record
-- Ownership is validated by checking that the address matches the session variable
-- Note: Backend uses service_role which bypasses RLS, so this policy applies to direct DB access
-- For direct database access, clients should set app.player_address session variable
-- Example: SET app.player_address = '0x...';
CREATE POLICY "Players can update own record"
ON players
FOR UPDATE
TO public
USING (
  -- Only allow if address matches session variable (validates ownership)
  current_setting('app.player_address', true) IS NOT NULL 
  AND address = current_setting('app.player_address', true)
)
WITH CHECK (
  -- Ensure address matches session variable (validates ownership)
  -- Also prevents address from being changed (it's the primary key)
  current_setting('app.player_address', true) IS NOT NULL 
  AND address = current_setting('app.player_address', true)
);

-- DELETE Policy: Allow users to delete only their own player record
-- Ownership is validated by checking the address matches the session variable
-- Note: Backend uses service_role which bypasses RLS, so this policy applies to direct DB access
-- For direct database access, clients should set app.player_address session variable
-- Example: SET app.player_address = '0x...';
CREATE POLICY "Players can delete own record"
ON players
FOR DELETE
TO public
USING (
  -- Only allow if address matches session variable (validates ownership)
  current_setting('app.player_address', true) IS NOT NULL 
  AND address = current_setting('app.player_address', true)
);

-- Add comment documenting RLS policies
COMMENT ON TABLE players IS 'RLS enabled: Public read/insert, ownership-based update/delete. Backend uses service_role which bypasses RLS.';

