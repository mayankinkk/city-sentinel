-- Fix storage security: Add DELETE policy with ownership check and update UPDATE policy

-- Drop the existing UPDATE policy if it exists (from migration 20251224175939)
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;

-- Create UPDATE policy with ownership check
CREATE POLICY "Only owner can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'issue-images' AND auth.uid() = owner);

-- Create DELETE policy with ownership check (was missing entirely)
CREATE POLICY "Only owner or admin can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'issue-images' AND (
    -- Owner can delete their own images
    auth.uid() = owner 
    OR
    -- Admins can delete any image
    public.has_role(auth.uid(), 'admin'::app_role)
    OR
    public.has_role(auth.uid(), 'super_admin'::app_role)
  )
);