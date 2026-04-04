-- Create report_shares table for secure sharing
CREATE TABLE IF NOT EXISTS public.report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  recipient_email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create index for fast token lookup
CREATE INDEX idx_report_shares_token ON public.report_shares(share_token);
CREATE INDEX idx_report_shares_report_id ON public.report_shares(report_id);
CREATE INDEX idx_report_shares_user_id ON public.report_shares(user_id);

-- Enable RLS
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own shares
CREATE POLICY "Users can view their own shares"
  ON public.report_shares
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares for their own reports"
  ON public.report_shares
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.medical_reports
      WHERE id = report_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own shares"
  ON public.report_shares
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares"
  ON public.report_shares
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 32-character token
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');
    token := replace(token, '=', '');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.report_shares WHERE share_token = token) INTO token_exists;
    
    -- Exit loop if token is unique
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$;

-- Function to cleanup expired shares
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.report_shares
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
END;
$$;