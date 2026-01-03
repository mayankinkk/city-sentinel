-- Add column for resolved/after image
ALTER TABLE public.issues 
ADD COLUMN resolved_image_url text;