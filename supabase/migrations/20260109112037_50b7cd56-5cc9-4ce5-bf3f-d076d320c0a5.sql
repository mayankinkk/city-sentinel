-- Fix 1: Profiles PII Exposure
-- Drop the overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a public view with only safe, non-PII fields for authenticated users
-- This allows fetching names/avatars for display purposes without exposing phone/address/email preferences
CREATE OR REPLACE VIEW public.profiles_public 
WITH (security_invoker = true) AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  bio
FROM public.profiles;

-- Grant select on the public view to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Add RLS policy for admins to view all profiles (needed for user management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Security comment
COMMENT ON VIEW public.profiles_public IS 'Public profile view exposing only non-sensitive fields (name, avatar, bio). Use this for displaying user info without exposing PII like phone, address, or email preferences.';