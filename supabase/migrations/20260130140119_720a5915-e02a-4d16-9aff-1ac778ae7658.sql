-- Create a new suspicious activity to test escalate action
INSERT INTO public.suspicious_activities (
  user_id, pattern_type, severity, details, status, detected_at
) VALUES (
  '00000000-0000-0000-0000-000000000099',
  'excessive_downloads',
  'critical',
  '{"action_type": "report_downloaded", "event_count": 25, "threshold_count": 20, "window_minutes": 60, "action_category": "reports", "test": true}'::jsonb,
  'pending',
  now()
);

-- Now test escalate by updating to escalated status
UPDATE public.suspicious_activities 
SET 
  status = 'escalated',
  resolution_notes = 'Test escalation: Critical pattern requires further investigation - forwarded to security team',
  reviewed_at = now(),
  reviewed_by = '00000000-0000-0000-0000-000000000001'
WHERE pattern_type = 'excessive_downloads' AND status = 'pending';

-- Log the escalation action
INSERT INTO public.audit_logs (user_id, action_type, action_category, resource_type, details)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'suspicious_activity_escalated',
  'admin_actions',
  'suspicious_activity',
  '{"new_status": "escalated", "pattern_type": "excessive_downloads", "resolution_notes": "Test escalation: Critical pattern requires further investigation"}'::jsonb
);