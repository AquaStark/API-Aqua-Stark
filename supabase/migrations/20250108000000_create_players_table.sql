-- Players table for storing off-chain player metadata
-- Mirrors on-chain player data from Dojo/Starknet with additional off-chain fields

CREATE TABLE IF NOT EXISTS players (
  address TEXT PRIMARY KEY,
  
  -- On-chain mirrored fields (default to 0, synced from blockchain)
  total_xp INTEGER DEFAULT 0 NOT NULL,
  fish_count INTEGER DEFAULT 0 NOT NULL,
  tournaments_won INTEGER DEFAULT 0 NOT NULL,
  reputation INTEGER DEFAULT 0 NOT NULL,
  offspring_created INTEGER DEFAULT 0 NOT NULL,
  
  -- Off-chain only fields
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Unique index on address (already primary key, but explicit for clarity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_address ON players(address);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row modifications
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

