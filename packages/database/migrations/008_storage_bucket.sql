-- Create storage bucket for store assets (banners, product images, logos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-assets',
  'store-assets',
  true,  -- public for read access
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Allow authenticated users to upload to their own tenant folder
CREATE POLICY "Users can upload store assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'store-assets'
  AND (storage.foldername(name))[1] = (
    SELECT COALESCE(t.id::text, 'unknown')
    FROM users u
    JOIN tenants t ON t.id = u.tenant_id
    WHERE u.id = auth.uid()
    LIMIT 1
  )
);

-- Allow public read access to all store assets
CREATE POLICY "Public read access for store assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'store-assets');

-- Allow authenticated users to delete their own tenant's assets
CREATE POLICY "Users can delete their store assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'store-assets'
  AND (storage.foldername(name))[1] = (
    SELECT COALESCE(t.id::text, 'unknown')
    FROM users u
    JOIN tenants t ON t.id = u.tenant_id
    WHERE u.id = auth.uid()
    LIMIT 1
  )
);
