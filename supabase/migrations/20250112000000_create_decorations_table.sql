CREATE TABLE IF NOT EXISTS decorations (
  id INTEGER PRIMARY KEY,
  owner TEXT NOT NULL,
  kind TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT fk_decorations_owner FOREIGN KEY (owner) REFERENCES players(address)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_decorations_owner ON decorations(owner);

CREATE INDEX IF NOT EXISTS idx_decorations_is_active ON decorations(is_active);
