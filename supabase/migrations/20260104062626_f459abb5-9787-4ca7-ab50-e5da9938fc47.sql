-- Create verification_status enum type
CREATE TYPE public.verification_status AS ENUM ('pending_verification', 'verified', 'invalid', 'spam');

-- Add verification columns to issues table
ALTER TABLE public.issues 
ADD COLUMN verification_status public.verification_status DEFAULT 'pending_verification',
ADD COLUMN verified_by uuid REFERENCES auth.users(id),
ADD COLUMN verified_at timestamp with time zone,
ADD COLUMN verification_notes text;

-- Update RLS policies for issues table to support new roles

-- Drop existing update policy and recreate with more granular permissions
DROP POLICY IF EXISTS "Users can update own issues or admins can update any" ON public.issues;

-- Super Admins and Admins can do everything
CREATE POLICY "Super admins and admins can update any issue"
ON public.issues
FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'admin')
);

-- Department Admins (Authority) can update status and add remarks
CREATE POLICY "Authority admins can update issue status"
ON public.issues
FOR UPDATE
USING (has_role(auth.uid(), 'department_admin'))
WITH CHECK (has_role(auth.uid(), 'department_admin'));

-- Field Workers can update issues they are assigned to
CREATE POLICY "Field workers can update assigned issues"
ON public.issues
FOR UPDATE
USING (
  has_role(auth.uid(), 'field_worker') AND 
  assigned_to = auth.uid()
);

-- Moderators can update verification status
CREATE POLICY "Moderators can verify issues"
ON public.issues
FOR UPDATE
USING (has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'moderator'));

-- Users can still update their own issues (withdraw)
CREATE POLICY "Users can update own issues"
ON public.issues
FOR UPDATE
USING (auth.uid() = reporter_id)
WITH CHECK (auth.uid() = reporter_id);

-- Update delete policy to include super_admin
DROP POLICY IF EXISTS "Admins can delete issues" ON public.issues;
CREATE POLICY "Super admins and admins can delete issues"
ON public.issues
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin') OR 
  has_role(auth.uid(), 'admin')
);