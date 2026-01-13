-- Create profile access audit log table
CREATE TABLE public.profile_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  profile_viewed UUID NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_context TEXT -- e.g., 'user_management', 'support', 'issue_review'
);

-- Enable RLS on audit log
ALTER TABLE public.profile_access_log ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view the audit log
CREATE POLICY "Super admins can view profile access logs"
ON public.profile_access_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Audit logs are inserted by the system via SECURITY DEFINER function
CREATE POLICY "System can insert audit logs"
ON public.profile_access_log
FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid());

-- Create a security definer function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(
  p_profile_id UUID,
  p_context TEXT DEFAULT 'general'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if caller has admin privileges
  IF has_role(auth.uid(), 'admin'::app_role) 
     OR has_role(auth.uid(), 'super_admin'::app_role) 
     OR has_role(auth.uid(), 'department_admin'::app_role) THEN
    INSERT INTO public.profile_access_log (admin_id, profile_viewed, access_context)
    VALUES (auth.uid(), p_profile_id, p_context);
  END IF;
END;
$$;

-- Add index for efficient querying
CREATE INDEX idx_profile_access_log_admin ON public.profile_access_log(admin_id);
CREATE INDEX idx_profile_access_log_accessed_at ON public.profile_access_log(accessed_at DESC);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.log_profile_access TO authenticated;

COMMENT ON FUNCTION public.log_profile_access IS 'Security-critical: Logs admin access to user profiles for audit trail. Only logs if caller has admin privileges.';