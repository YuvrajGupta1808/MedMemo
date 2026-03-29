-- RLS policies for the users table.
-- The frontend uses the Supabase anon key, so anon must be allowed to
-- INSERT (patient creation) and SELECT (patient listing / lookup).
--
-- ⚠️  Review before running: these policies grant broad anon access.
--     Tighten WITH CHECK / USING clauses once proper auth is in place.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_insert" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow_anon_select" ON users
  FOR SELECT
  TO anon
  USING (true);

-- Sessions, documents, and notes also need SELECT for the frontend.

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_select" ON sessions
  FOR SELECT
  TO anon
  USING (true);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_select" ON documents
  FOR SELECT
  TO anon
  USING (true);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_select" ON notes
  FOR SELECT
  TO anon
  USING (true);
