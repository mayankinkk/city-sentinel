-- Fix: Remove anonymous access to the main issues table to protect sensitive user data
-- Anonymous users should only access issues through the issues_public view

-- Drop the existing anonymous policy
DROP POLICY IF EXISTS "Anon can view issues" ON public.issues;

-- Update the authenticated policy to only allow viewing issues where:
-- 1. User is the reporter (can see their own issues)
-- 2. User has admin/super_admin role (can see all issues)
-- 3. User has moderator role (can see all issues for verification)
-- 4. User has department_admin role for the issue's department
-- 5. User has field_worker role and is assigned to the issue
DROP POLICY IF EXISTS "Authenticated can view all issues" ON public.issues;

-- Create a more restrictive SELECT policy for authenticated users
-- Regular authenticated users can only see public issue data, while privileged users can see everything
CREATE POLICY "Authenticated users can view issues with restrictions" 
ON public.issues 
FOR SELECT 
TO authenticated
USING (
  -- User is the reporter
  auth.uid() = reporter_id
  OR
  -- User has admin/super_admin role
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- User has moderator role
  has_role(auth.uid(), 'moderator'::app_role)
  OR
  -- User has department_admin role
  has_role(auth.uid(), 'department_admin'::app_role)
  OR
  -- User is assigned to this issue
  auth.uid() = assigned_to
  OR
  -- All authenticated users can view issues, but sensitive columns will be null for non-privileged users
  -- This is handled via the query itself - we still allow SELECT for basic access
  true
);

-- Note: The above policy allows all authenticated users to SELECT, but the application 
-- should be updated to use the issues_public view for general display.
-- However, since we can't do column-level security in RLS, we need a different approach.

-- Let's instead create a security-definer function that returns issues without sensitive data
-- and update the RLS to be more restrictive

-- Actually, let's take a cleaner approach:
-- 1. Keep authenticated access but enforce that regular users can only see their own issues
-- 2. Use the issues_public view for public listing

-- Remove the policy we just created
DROP POLICY IF EXISTS "Authenticated users can view issues with restrictions" ON public.issues;

-- Create a policy where regular users can see all issues BUT sensitive fields are protected
-- Since RLS can't hide columns, we need a different approach

-- For now, let's restrict the base table access and create a function for public listing
-- Regular authenticated users will use the issues_public view

-- Create restrictive policy: only privileged users or issue owners can access the full table
CREATE POLICY "Users can view own issues" 
ON public.issues 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = reporter_id
);

CREATE POLICY "Privileged users can view all issues" 
ON public.issues 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR has_role(auth.uid(), 'department_admin'::app_role)
  OR has_role(auth.uid(), 'field_worker'::app_role)
);

-- Update the issues_public view to be accessible for general browsing
-- Grant access to authenticated users to use the view
GRANT SELECT ON public.issues_public TO authenticated;
GRANT SELECT ON public.issues_public TO anon;