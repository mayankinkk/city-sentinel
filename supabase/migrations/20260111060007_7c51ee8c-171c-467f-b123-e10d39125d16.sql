-- Fix the security definer view issue by using security_invoker
-- Drop and recreate the view with security_invoker = true but the function will handle bypassing RLS

DROP VIEW IF EXISTS public.issues_public;

-- Create view with security_invoker = true (the secure pattern)
-- This view will inherit RLS from the caller, but we'll use the function for public access
CREATE VIEW public.issues_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  description,
  issue_type,
  priority,
  status,
  latitude,
  longitude,
  address,
  image_url,
  resolved_image_url,
  NULL::uuid as reporter_id, -- Always null for privacy
  department_id,
  assigned_to,
  terms_accepted,
  verification_status,
  verified_by,
  verified_at,
  verification_notes,
  created_at,
  updated_at,
  resolved_at
FROM public.issues;

-- Grant SELECT access
GRANT SELECT ON public.issues_public TO authenticated;
GRANT SELECT ON public.issues_public TO anon;