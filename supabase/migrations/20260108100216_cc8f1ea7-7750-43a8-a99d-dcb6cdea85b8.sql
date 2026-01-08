-- Fix 1: Change issues_public view from SECURITY DEFINER to SECURITY INVOKER
-- This ensures the view uses the querying user's permissions rather than the view creator's

DROP VIEW IF EXISTS public.issues_public;

CREATE VIEW public.issues_public
WITH (security_invoker = true)
AS
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
  reporter_id,
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

-- Grant appropriate access on the view
GRANT SELECT ON public.issues_public TO anon, authenticated;

-- Fix 2: Replace the overly permissive notifications INSERT policy
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create a more restrictive policy - only authenticated users can insert notifications for themselves
-- OR we allow through an RPC function that does proper validation
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a SECURITY DEFINER function for edge functions to insert notifications with validation
CREATE OR REPLACE FUNCTION public.insert_notification(
  p_user_id UUID,
  p_issue_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'status_update'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Validate user exists
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Invalid user_id: user does not exist';
  END IF;
  
  -- Validate issue exists if provided
  IF p_issue_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.issues WHERE id = p_issue_id) THEN
    RAISE EXCEPTION 'Invalid issue_id: issue does not exist';
  END IF;
  
  -- Validate title length
  IF p_title IS NULL OR length(p_title) = 0 THEN
    RAISE EXCEPTION 'Title cannot be empty';
  END IF;
  
  IF length(p_title) > 200 THEN
    RAISE EXCEPTION 'Title too long (max 200 characters)';
  END IF;
  
  -- Validate message length
  IF p_message IS NULL OR length(p_message) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  IF length(p_message) > 1000 THEN
    RAISE EXCEPTION 'Message too long (max 1000 characters)';
  END IF;
  
  -- Validate notification type
  IF p_type NOT IN (
    'status_update', 'status_pending', 'status_in_progress', 'status_resolved', 'status_withdrawn',
    'verification_pending_verification', 'verification_verified', 'verification_invalid', 'verification_spam'
  ) THEN
    RAISE EXCEPTION 'Invalid notification type';
  END IF;
  
  -- Rate limiting: max 50 notifications per hour per user
  IF (SELECT COUNT(*) FROM public.notifications 
      WHERE user_id = p_user_id 
      AND created_at > NOW() - INTERVAL '1 hour') > 50 THEN
    RAISE EXCEPTION 'Rate limit exceeded for user notifications';
  END IF;
  
  -- Insert the notification
  INSERT INTO public.notifications (user_id, issue_id, title, message, type)
  VALUES (p_user_id, p_issue_id, p_title, p_message, p_type)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Add security documentation comments
COMMENT ON FUNCTION public.insert_notification IS 
'SECURITY CRITICAL: Validates and inserts notifications. Used by edge functions.
Includes rate limiting (50/hour/user), input validation, and existence checks.
Any changes require security review.';

COMMENT ON FUNCTION public.has_role IS 
'SECURITY CRITICAL: Used by RLS policies for authorization. 
Any changes require security review and comprehensive testing.
Must maintain SECURITY DEFINER and search_path = public.';

COMMENT ON FUNCTION public.user_has_department IS 
'SECURITY CRITICAL: Used by RLS policies for department access control.
Any changes require security review.
Must maintain SECURITY DEFINER and search_path = public.';

COMMENT ON FUNCTION public.get_user_department_ids IS 
'SECURITY CRITICAL: Used by RLS policies for department-scoped queries.
Any changes require security review.
Must maintain SECURITY DEFINER and search_path = public.';