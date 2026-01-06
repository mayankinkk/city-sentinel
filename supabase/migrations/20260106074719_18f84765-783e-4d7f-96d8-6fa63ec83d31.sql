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

-- Enable RLS
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view verification history
CREATE POLICY "Anyone can view verification history"
ON public.verification_history
FOR SELECT
USING (true);

-- Only authorized roles can insert verification history
CREATE POLICY "Authorized users can insert verification history"
ON public.verification_history
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'department_admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Create index for faster lookups
CREATE INDEX idx_verification_history_issue_id ON public.verification_history(issue_id);
CREATE INDEX idx_verification_history_created_at ON public.verification_history(created_at DESC);