-- Fix: Recreate the issues_public view to bypass RLS for public read access
-- This allows anonymous users to see public issue data without sensitive fields

-- Drop the existing view
DROP VIEW IF EXISTS public.issues_public;

-- Create a new view with security_invoker = false (default)
-- This means the view runs with the permissions of the view owner, not the caller
-- Combined with the GRANT statements, this allows public read access
CREATE VIEW public.issues_public 
WITH (security_barrier = true) AS
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
  -- Intentionally exclude reporter_id and reporter_email for privacy
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

-- Grant SELECT access to both authenticated and anonymous users
GRANT SELECT ON public.issues_public TO authenticated;
GRANT SELECT ON public.issues_public TO anon;

-- Create a security definer function to get public issues (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_public_issues()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  issue_type issue_type,
  priority issue_priority,
  status issue_status,
  latitude double precision,
  longitude double precision,
  address text,
  image_url text,
  resolved_image_url text,
  department_id uuid,
  assigned_to uuid,
  terms_accepted boolean,
  verification_status verification_status,
  verified_by uuid,
  verified_at timestamptz,
  verification_notes text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.title,
    i.description,
    i.issue_type,
    i.priority,
    i.status,
    i.latitude,
    i.longitude,
    i.address,
    i.image_url,
    i.resolved_image_url,
    i.department_id,
    i.assigned_to,
    i.terms_accepted,
    i.verification_status,
    i.verified_by,
    i.verified_at,
    i.verification_notes,
    i.created_at,
    i.updated_at,
    i.resolved_at
  FROM public.issues i
  ORDER BY i.created_at DESC;
$$;

-- Grant execute permission to both authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_issues() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_issues() TO anon;