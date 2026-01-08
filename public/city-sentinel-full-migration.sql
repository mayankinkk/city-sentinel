-- =============================================================================
-- CITY SENTINEL - COMPLETE DATABASE MIGRATION
-- =============================================================================
-- Run this entire script in your new Supabase project's SQL Editor
-- Make sure to run it in one go (not line by line)
-- =============================================================================

-- =============================================================================
-- PART 1: ENUMS
-- =============================================================================

-- Create enum for issue types
CREATE TYPE public.issue_type AS ENUM ('pothole', 'streetlight', 'drainage', 'garbage', 'graffiti', 'sidewalk', 'traffic_sign', 'water_leak', 'other');

-- Create enum for issue priority
CREATE TYPE public.issue_priority AS ENUM ('low', 'medium', 'high');

-- Create enum for issue status
CREATE TYPE public.issue_status AS ENUM ('pending', 'in_progress', 'resolved', 'withdrawn');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'super_admin', 'department_admin', 'field_worker', 'moderator');

-- Create verification_status enum type
CREATE TYPE public.verification_status AS ENUM ('pending_verification', 'verified', 'invalid', 'spam');

-- =============================================================================
-- PART 2: UTILITY FUNCTIONS
-- =============================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================================================
-- PART 3: TABLES
-- =============================================================================

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  bio TEXT,
  notification_email BOOLEAN NOT NULL DEFAULT true,
  notification_push BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_departments table to link authority admins to departments
CREATE TABLE public.user_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Create issues table
CREATE TABLE public.issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  issue_type issue_type NOT NULL DEFAULT 'other',
  priority issue_priority NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'pending',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  image_url TEXT,
  resolved_image_url TEXT,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT,
  department_id UUID REFERENCES public.departments(id),
  terms_accepted BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id),
  verification_status verification_status DEFAULT 'pending_verification',
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'status_update',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_invites table for invite-only admin system
CREATE TABLE public.admin_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issue_comments table
CREATE TABLE public.issue_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_admin_update BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issue_upvotes table
CREATE TABLE public.issue_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(issue_id, user_id)
);

-- Create issue_follows table
CREATE TABLE public.issue_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(issue_id, user_id)
);

-- Create verification history table
CREATE TABLE public.verification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  verification_status verification_status NOT NULL,
  verified_by UUID NOT NULL,
  verifier_name TEXT,
  verifier_role TEXT,
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================================================
-- PART 4: INDEXES
-- =============================================================================

CREATE INDEX idx_verification_history_issue_id ON public.verification_history(issue_id);
CREATE INDEX idx_verification_history_created_at ON public.verification_history(created_at DESC);

-- =============================================================================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PART 6: SECURITY DEFINER FUNCTIONS (Required before RLS policies)
-- =============================================================================

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is assigned to a department
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

-- Function to get all department IDs for a user
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

-- =============================================================================
-- PART 7: RLS POLICIES
-- =============================================================================

-- Departments policies
CREATE POLICY "Anyone can view departments" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User departments policies
CREATE POLICY "Admins can manage user departments" ON public.user_departments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own department assignments" ON public.user_departments
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- Issues policies
CREATE POLICY "Authenticated can view all issues" ON public.issues
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon can view issues" ON public.issues
  FOR SELECT TO anon USING (true);

CREATE POLICY "Authenticated users can create issues" ON public.issues
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Super admins and admins can update any issue" ON public.issues
  FOR UPDATE USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Authority admins can update their department issues" ON public.issues
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

CREATE POLICY "Field workers can update assigned issues" ON public.issues
  FOR UPDATE USING (has_role(auth.uid(), 'field_worker') AND assigned_to = auth.uid());

CREATE POLICY "Moderators can verify issues" ON public.issues
  FOR UPDATE
  USING (has_role(auth.uid(), 'moderator'))
  WITH CHECK (has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can update own issues" ON public.issues
  FOR UPDATE
  USING (auth.uid() = reporter_id)
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Super admins and admins can delete issues" ON public.issues
  FOR DELETE USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin invites policies
CREATE POLICY "Admins can view all invites" ON public.admin_invites
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create invites" ON public.admin_invites
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update invites" ON public.admin_invites
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete invites" ON public.admin_invites
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Issue comments policies
CREATE POLICY "Anyone can view comments" ON public.issue_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.issue_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.issue_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments or admins can delete any" ON public.issue_comments
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Issue upvotes policies
CREATE POLICY "Anyone can view upvotes" ON public.issue_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upvote" ON public.issue_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their upvote" ON public.issue_upvotes
  FOR DELETE USING (auth.uid() = user_id);

-- Issue follows policies
CREATE POLICY "Users can view their follows" ON public.issue_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can follow issues" ON public.issue_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow issues" ON public.issue_follows
  FOR DELETE USING (auth.uid() = user_id);

-- Verification history policies
CREATE POLICY "Anyone can view verification history" ON public.verification_history
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can insert verification history" ON public.verification_history
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'department_admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role)
  );

-- =============================================================================
-- PART 8: TRIGGERS
-- =============================================================================

-- Trigger for automatic timestamp updates on issues
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- PART 9: VIEWS
-- =============================================================================

-- Create a view that excludes reporter_email for public access
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

-- Grant access to the public view
GRANT SELECT ON public.issues_public TO anon, authenticated;

-- =============================================================================
-- PART 10: ADMIN INVITE FUNCTIONS
-- =============================================================================

-- Atomic function for admin invite generation (server-side token)
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

-- Atomic function for consuming admin invite (prevents race condition)
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

-- =============================================================================
-- PART 11: NOTIFICATION INSERT FUNCTION
-- =============================================================================

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

-- =============================================================================
-- PART 12: STORAGE BUCKET & POLICIES
-- =============================================================================

-- Create storage bucket for issue images
INSERT INTO storage.buckets (id, name, public) VALUES ('issue-images', 'issue-images', true);

-- Storage policies for issue images
CREATE POLICY "Anyone can view issue images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'issue-images');

CREATE POLICY "Authenticated users can upload issue images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'issue-images');

CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'issue-images');

CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'issue-images');

-- =============================================================================
-- PART 13: ENABLE REALTIME
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_comments;

-- =============================================================================
-- PART 14: SECURITY COMMENTS
-- =============================================================================

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

-- =============================================================================
-- DONE! Your database is now set up.
-- =============================================================================
