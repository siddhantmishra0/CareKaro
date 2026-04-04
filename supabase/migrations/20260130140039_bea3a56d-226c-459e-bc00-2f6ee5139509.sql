-- Test 1: Update status to 'dismissed' with resolution notes
UPDATE public.suspicious_activities 
SET 
  status = 'dismissed',
  resolution_notes = 'Test dismissal: Verified as false positive - test data for system validation',
  reviewed_at = now(),
  reviewed_by = '00000000-0000-0000-0000-000000000001'
WHERE id = '44a04eaa-c8d0-4ebe-a66c-3fc6274231a6';

-- Insert an audit log for this action
INSERT INTO public.audit_logs (user_id, action_type, action_category, resource_type, resource_id, details)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'suspicious_activity_dismissed',
  'admin_actions',
  'suspicious_activity',
  '44a04eaa-c8d0-4ebe-a66c-3fc6274231a6',
  '{"new_status": "dismissed", "resolution_notes": "Test dismissal: Verified as false positive"}'::jsonb
);