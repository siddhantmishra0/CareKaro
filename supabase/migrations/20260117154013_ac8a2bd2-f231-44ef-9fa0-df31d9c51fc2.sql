-- First create the helper function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create family connections table (invite codes table was already created)
CREATE TABLE IF NOT EXISTS public.family_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_name TEXT,
  member_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unlinked')),
  share_vitals BOOLEAN DEFAULT true,
  allow_medicine_management BOOLEAN DEFAULT false,
  emergency_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unlinked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(inviter_id, member_id),
  CHECK (inviter_id != member_id)
);

-- Enable RLS on family_connections
ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for family connections
CREATE POLICY "Users can view connections they are part of"
ON public.family_connections FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = member_id);

CREATE POLICY "Users can create connections as member"
ON public.family_connections FOR INSERT
WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can update their own connection settings"
ON public.family_connections FOR UPDATE
USING (auth.uid() = inviter_id OR auth.uid() = member_id);

-- Create trigger for updated_at
CREATE TRIGGER update_family_connections_updated_at
BEFORE UPDATE ON public.family_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();