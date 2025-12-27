-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments" ON public.departments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- Add department_id to issues table
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Add terms_accepted to issues table  
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;

-- Add assigned_to field for department/worker assignment
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

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

ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.issue_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.issue_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.issue_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments or admins can delete any" ON public.issue_comments
  FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create issue_upvotes table
CREATE TABLE public.issue_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(issue_id, user_id)
);

ALTER TABLE public.issue_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes" ON public.issue_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upvote" ON public.issue_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their upvote" ON public.issue_upvotes
  FOR DELETE USING (auth.uid() = user_id);

-- Create issue_follows table
CREATE TABLE public.issue_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(issue_id, user_id)
);

ALTER TABLE public.issue_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their follows" ON public.issue_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can follow issues" ON public.issue_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow issues" ON public.issue_follows
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_comments;