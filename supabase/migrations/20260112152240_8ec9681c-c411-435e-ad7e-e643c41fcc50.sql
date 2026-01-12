-- Create table for storing multiple images per issue
CREATE TABLE public.issue_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'reported' CHECK (image_type IN ('reported', 'resolved', 'additional')),
  caption TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.issue_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view issue images (public data)
CREATE POLICY "Issue images are viewable by everyone" 
ON public.issue_images 
FOR SELECT 
USING (true);

-- Users can insert images to issues (authenticated users)
CREATE POLICY "Authenticated users can add images" 
ON public.issue_images 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own images or admins can delete any
CREATE POLICY "Users can delete own images or admins can delete any" 
ON public.issue_images 
FOR DELETE 
USING (
  uploaded_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create table for status change history (timeline)
CREATE TABLE public.issue_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  changed_by_name TEXT,
  changed_by_role TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.issue_status_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view status history (public data)
CREATE POLICY "Status history is viewable by everyone" 
ON public.issue_status_history 
FOR SELECT 
USING (true);

-- Only authenticated users with proper roles can insert
CREATE POLICY "Authenticated users with roles can add status history" 
ON public.issue_status_history 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster queries
CREATE INDEX idx_issue_images_issue_id ON public.issue_images(issue_id);
CREATE INDEX idx_issue_status_history_issue_id ON public.issue_status_history(issue_id);
CREATE INDEX idx_issue_status_history_created_at ON public.issue_status_history(created_at DESC);

-- Enable realtime for status history
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_status_history;