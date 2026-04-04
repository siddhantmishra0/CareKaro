-- Enable the pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function to call the detect-suspicious edge function
CREATE OR REPLACE FUNCTION public.trigger_suspicious_detection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Get the Supabase URL from environment (set via vault or config)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Only proceed if settings are configured
  IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL THEN
    -- Make async HTTP POST to the edge function
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/detect-suspicious',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'auditEvent', jsonb_build_object(
          'id', NEW.id,
          'user_id', NEW.user_id,
          'action_type', NEW.action_type,
          'action_category', NEW.action_category,
          'details', NEW.details,
          'created_at', NEW.created_at
        )
      )
    ) INTO request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on audit_logs table
DROP TRIGGER IF EXISTS on_audit_log_detect_suspicious ON public.audit_logs;

CREATE TRIGGER on_audit_log_detect_suspicious
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_suspicious_detection();