-- Create enum types for better data integrity
CREATE TYPE public.report_type AS ENUM ('blood_test', 'ecg', 'xray', 'mri', 'ct_scan', 'ultrasound', 'other');
CREATE TYPE public.report_status AS ENUM ('processing', 'completed', 'failed');
CREATE TYPE public.notification_type AS ENUM ('critical_finding', 'report_ready', 'follow_up_reminder', 'health_alert');
CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Medical Reports Table
CREATE TABLE public.medical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type public.report_type NOT NULL,
  status public.report_status NOT NULL DEFAULT 'processing',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  report_date DATE,
  ai_summary TEXT,
  key_findings TEXT[],
  has_critical_findings BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Health Metrics Table
CREATE TABLE public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT NOT NULL,
  reference_range_min NUMERIC,
  reference_range_max NUMERIC,
  is_abnormal BOOLEAN DEFAULT false,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Specialist Recommendations Table
CREATE TABLE public.specialist_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  urgency public.urgency_level NOT NULL DEFAULT 'medium',
  reasoning TEXT NOT NULL,
  recommended_actions TEXT[],
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_report_id UUID REFERENCES public.medical_reports(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_reports
CREATE POLICY "Users can view their own reports"
  ON public.medical_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
  ON public.medical_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.medical_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.medical_reports FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for health_metrics
CREATE POLICY "Users can view their own health metrics"
  ON public.health_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics"
  ON public.health_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics"
  ON public.health_metrics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics"
  ON public.health_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for specialist_recommendations
CREATE POLICY "Users can view their own recommendations"
  ON public.specialist_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations"
  ON public.specialist_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON public.specialist_recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendations"
  ON public.specialist_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_medical_reports_user_id ON public.medical_reports(user_id);
CREATE INDEX idx_medical_reports_status ON public.medical_reports(status);
CREATE INDEX idx_medical_reports_report_date ON public.medical_reports(report_date DESC);
CREATE INDEX idx_health_metrics_user_id ON public.health_metrics(user_id);
CREATE INDEX idx_health_metrics_report_id ON public.health_metrics(report_id);
CREATE INDEX idx_health_metrics_metric_name ON public.health_metrics(metric_name);
CREATE INDEX idx_health_metrics_recorded_at ON public.health_metrics(recorded_at DESC);
CREATE INDEX idx_specialist_recommendations_user_id ON public.specialist_recommendations(user_id);
CREATE INDEX idx_specialist_recommendations_urgency ON public.specialist_recommendations(urgency);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_medical_reports_updated_at
  BEFORE UPDATE ON public.medical_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create notification when critical findings detected
CREATE OR REPLACE FUNCTION public.handle_critical_findings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.has_critical_findings = true AND (OLD.has_critical_findings IS NULL OR OLD.has_critical_findings = false) THEN
    INSERT INTO public.notifications (user_id, notification_type, title, message, related_report_id)
    VALUES (
      NEW.user_id,
      'critical_finding',
      'Critical Health Finding Detected',
      'Your recent report "' || NEW.title || '" contains critical findings that require immediate attention.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_critical_findings_notification
  AFTER INSERT OR UPDATE ON public.medical_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_critical_findings();

-- Create function to create notification when report analysis is complete
CREATE OR REPLACE FUNCTION public.handle_report_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'processing' THEN
    INSERT INTO public.notifications (user_id, notification_type, title, message, related_report_id)
    VALUES (
      NEW.user_id,
      'report_ready',
      'Report Analysis Complete',
      'Your report "' || NEW.title || '" has been analyzed and is ready for review.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_report_completion_notification
  AFTER UPDATE ON public.medical_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_report_completion();