-- Create enum types for suspicious activities
CREATE TYPE suspicious_activity_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE suspicious_activity_status AS ENUM ('pending', 'reviewed', 'dismissed', 'escalated');

-- Create suspicious_activities table
CREATE TABLE public.suspicious_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL,
  severity suspicious_activity_severity NOT NULL DEFAULT 'medium',
  details JSONB DEFAULT '{}'::jsonb,
  status suspicious_activity_status NOT NULL DEFAULT 'pending',
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_suspicious_activities_user_id ON public.suspicious_activities(user_id);
CREATE INDEX idx_suspicious_activities_status ON public.suspicious_activities(status);
CREATE INDEX idx_suspicious_activities_severity ON public.suspicious_activities(severity);
CREATE INDEX idx_suspicious_activities_detected_at ON public.suspicious_activities(detected_at DESC);
CREATE INDEX idx_suspicious_activities_pattern_type ON public.suspicious_activities(pattern_type);

-- Enable RLS
ALTER TABLE public.suspicious_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies: Only admins can view and manage suspicious activities
CREATE POLICY "Admins can view all suspicious activities"
  ON public.suspicious_activities
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert suspicious activities"
  ON public.suspicious_activities
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update suspicious activities"
  ON public.suspicious_activities
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Service role policy for edge function to insert
CREATE POLICY "Service role can insert suspicious activities"
  ON public.suspicious_activities
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_suspicious_activities_updated_at
  BEFORE UPDATE ON public.suspicious_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.suspicious_activities;