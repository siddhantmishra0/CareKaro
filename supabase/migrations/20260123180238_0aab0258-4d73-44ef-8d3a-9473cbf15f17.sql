-- Create family invite codes table for the family linking feature
CREATE TABLE public.family_invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) NOT NULL UNIQUE,
  inviter_id UUID NOT NULL,
  inviter_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own invite codes
CREATE POLICY "Users can view their own invite codes"
  ON public.family_invite_codes
  FOR SELECT
  USING (auth.uid() = inviter_id);

-- Policy: Users can create their own invite codes
CREATE POLICY "Users can create their own invite codes"
  ON public.family_invite_codes
  FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Policy: Anyone can update codes (for marking as used) - but edge function uses service role
CREATE POLICY "Users can update invite codes"
  ON public.family_invite_codes
  FOR UPDATE
  USING (true);

-- Index for faster code lookups
CREATE INDEX idx_family_invite_codes_code ON public.family_invite_codes(code);
CREATE INDEX idx_family_invite_codes_inviter ON public.family_invite_codes(inviter_id);