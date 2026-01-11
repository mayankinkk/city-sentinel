-- Fix: The admin_invites SELECT policy should be PERMISSIVE not RESTRICTIVE
-- RESTRICTIVE policies are AND'ed together, but we need a PERMISSIVE policy that only allows admins

-- First, drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can view all invites" ON public.admin_invites;

-- Create a new PERMISSIVE SELECT policy that only allows admins to view invites
-- This ensures non-admins cannot read admin emails or invite tokens
CREATE POLICY "Only admins can view invites" 
ON public.admin_invites 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Explicitly deny anonymous access (no policy = no access for anon users)
-- RLS is already enabled, so anon users are blocked by default