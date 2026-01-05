-- Create user_departments table to link authority admins to departments
CREATE TABLE public.user_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Enable RLS
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Only admins can manage user-department assignments
CREATE POLICY "Admins can manage user departments"
ON public.user_departments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- Users can view their own department assignments
CREATE POLICY "Users can view their own department assignments"
ON public.user_departments
FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- Create function to check if user is assigned to a department
CREATE OR REPLACE FUNCTION public.user_has_department(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_departments
    WHERE user_id = _user_id
      AND department_id = _department_id
  )
$$;

-- Create function to get all department IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_department_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id
  FROM public.user_departments
  WHERE user_id = _user_id
$$;

-- Update issues RLS policy for department_admin to only see their department's issues
DROP POLICY IF EXISTS "Authority admins can update issue status" ON public.issues;

CREATE POLICY "Authority admins can update their department issues"
ON public.issues
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'department_admin'::app_role) 
  AND (
    department_id IN (SELECT public.get_user_department_ids(auth.uid()))
    OR department_id IS NULL
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'department_admin'::app_role)
  AND (
    department_id IN (SELECT public.get_user_department_ids(auth.uid()))
    OR department_id IS NULL
  )
);