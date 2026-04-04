-- Create audit_logs table for tracking user actions and compliance
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_action_category ON public.audit_logs(action_category);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Any authenticated user can insert their own audit logs
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create a function to log audit events (can be called from triggers or edge functions)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action_type TEXT,
  p_action_category TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action_type, action_category, resource_type, resource_id, details)
  VALUES (p_user_id, p_action_type, p_action_category, p_resource_type, p_resource_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create triggers to automatically log key actions

-- Trigger for medical report uploads
CREATE OR REPLACE FUNCTION public.audit_report_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      NEW.user_id,
      'report_uploaded',
      'reports',
      'medical_report',
      NEW.id,
      jsonb_build_object('title', NEW.title, 'report_type', NEW.report_type)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.log_audit_event(
      NEW.user_id,
      'report_status_changed',
      'reports',
      'medical_report',
      NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_medical_reports
AFTER INSERT OR UPDATE ON public.medical_reports
FOR EACH ROW EXECUTE FUNCTION public.audit_report_changes();

-- Trigger for doctor reports
CREATE OR REPLACE FUNCTION public.audit_doctor_report_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      NEW.patient_id,
      'doctor_report_received',
      'doctor_interactions',
      'doctor_report',
      NEW.id,
      jsonb_build_object('doctor_id', NEW.doctor_id, 'title', NEW.title, 'report_type', NEW.report_type)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.is_read = false AND NEW.is_read = true THEN
    PERFORM public.log_audit_event(
      NEW.patient_id,
      'doctor_report_viewed',
      'doctor_interactions',
      'doctor_report',
      NEW.id,
      jsonb_build_object('doctor_id', NEW.doctor_id, 'title', NEW.title)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_doctor_reports
AFTER INSERT OR UPDATE ON public.doctor_reports
FOR EACH ROW EXECUTE FUNCTION public.audit_doctor_report_changes();

-- Trigger for report shares
CREATE OR REPLACE FUNCTION public.audit_report_share_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      NEW.user_id,
      'report_shared',
      'data_sharing',
      'report_share',
      NEW.id,
      jsonb_build_object('report_id', NEW.report_id, 'recipient_email', NEW.recipient_email, 'expires_at', NEW.expires_at)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_report_shares
AFTER INSERT ON public.report_shares
FOR EACH ROW EXECUTE FUNCTION public.audit_report_share_changes();

-- Trigger for family connections
CREATE OR REPLACE FUNCTION public.audit_family_connection_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      NEW.inviter_id,
      'family_member_invited',
      'family_access',
      'family_connection',
      NEW.id,
      jsonb_build_object('member_id', NEW.member_id, 'status', NEW.status)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.log_audit_event(
      NEW.inviter_id,
      'family_connection_status_changed',
      'family_access',
      'family_connection',
      NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_family_connections
AFTER INSERT OR UPDATE ON public.family_connections
FOR EACH ROW EXECUTE FUNCTION public.audit_family_connection_changes();

-- Trigger for doctor profile verification
CREATE OR REPLACE FUNCTION public.audit_doctor_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.verification_status != NEW.verification_status THEN
    PERFORM public.log_audit_event(
      COALESCE(NEW.verified_by, NEW.user_id),
      'doctor_verification_changed',
      'admin_actions',
      'doctor_profile',
      NEW.id,
      jsonb_build_object('doctor_user_id', NEW.user_id, 'old_status', OLD.verification_status, 'new_status', NEW.verification_status, 'doctor_name', NEW.full_name)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_doctor_profiles
AFTER UPDATE ON public.doctor_profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_doctor_verification();

-- Create a view for audit log analytics
CREATE VIEW public.audit_analytics AS
SELECT
  date_trunc('day', created_at)::date as date,
  action_category,
  action_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.audit_logs
GROUP BY date_trunc('day', created_at)::date, action_category, action_type
ORDER BY date DESC, count DESC;