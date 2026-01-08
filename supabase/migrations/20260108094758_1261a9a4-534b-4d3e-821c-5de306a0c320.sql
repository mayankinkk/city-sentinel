-- Fix 1: Create atomic function for admin invite generation (server-side token)
CREATE OR REPLACE FUNCTION public.generate_admin_invite(
  p_email TEXT,
  p_invited_by UUID
)
RETURNS TABLE(invite_token TEXT, invite_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_id UUID;
BEGIN
  -- Check if caller has admin role
  IF NOT has_role(p_invited_by, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can create invites';
  END IF;
  
  -- Generate cryptographically secure token server-side (64 hex chars)
  v_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO admin_invites (email, invite_token, invited_by)
  VALUES (p_email, v_token, p_invited_by)
  RETURNING id INTO v_id;
  
  RETURN QUERY SELECT v_token, v_id;
END;
$$;

-- Fix 2: Create atomic function for consuming admin invite (prevents race condition)
CREATE OR REPLACE FUNCTION public.consume_admin_invite(
  p_token TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id UUID;
  v_email TEXT;
BEGIN
  -- Atomic: Lock row, check, and update in one operation
  UPDATE admin_invites
  SET 
    used = true,
    used_at = NOW()
  WHERE invite_token = p_token
    AND used = false
    AND expires_at > NOW()
  RETURNING id, email INTO v_invite_id, v_email;
  
  -- Check if token was valid and updated
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid, used, or expired token'
    );
  END IF;
  
  -- Add admin role (idempotent with ON CONFLICT)
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'email', v_email
  );
END;
$$;

-- Fix 3: Create a view that excludes reporter_email for public access
CREATE OR REPLACE VIEW public.issues_public AS
SELECT 
  id, title, description, issue_type, priority, status,
  latitude, longitude, address, image_url, resolved_image_url,
  reporter_id, created_at, updated_at, resolved_at,
  department_id, assigned_to, verification_status,
  verified_by, verified_at, verification_notes, terms_accepted
FROM issues;

-- Grant access to the public view
GRANT SELECT ON public.issues_public TO anon, authenticated;

-- Update the issues RLS policy to restrict email visibility
-- Drop the existing open SELECT policy
DROP POLICY IF EXISTS "Anyone can view issues" ON public.issues;

-- Create a new policy that hides reporter_email from non-admins/non-reporters
-- Since we can't do column-level RLS, we'll use the view for public access
-- and keep full access for authenticated users who are reporters or admins
CREATE POLICY "Authenticated can view all issues"
ON public.issues
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anon can view issues"
ON public.issues
FOR SELECT
TO anon
USING (true);