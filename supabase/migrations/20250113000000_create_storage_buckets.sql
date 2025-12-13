-- Storage buckets for game assets
-- Public read access for Unity client, authenticated write access only

-- Create fish bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('fish', 'fish', true)
ON CONFLICT (id) DO NOTHING;

-- Create tanks bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tanks', 'tanks', true)
ON CONFLICT (id) DO NOTHING;

-- Create decorations bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('decorations', 'decorations', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policies for all buckets
CREATE POLICY "Public read access for fish"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'fish');

CREATE POLICY "Public read access for tanks"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tanks');

CREATE POLICY "Public read access for decorations"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'decorations');

CREATE POLICY "Public read access for avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Authenticated write policies for all buckets
CREATE POLICY "Authenticated upload for fish"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fish');

CREATE POLICY "Authenticated upload for tanks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tanks');

CREATE POLICY "Authenticated upload for decorations"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'decorations');

CREATE POLICY "Authenticated upload for avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated update for fish"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'fish');

CREATE POLICY "Authenticated update for tanks"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'tanks');

CREATE POLICY "Authenticated update for decorations"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'decorations');

CREATE POLICY "Authenticated update for avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated delete for fish"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'fish');

CREATE POLICY "Authenticated delete for tanks"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tanks');

CREATE POLICY "Authenticated delete for decorations"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'decorations');

CREATE POLICY "Authenticated delete for avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
