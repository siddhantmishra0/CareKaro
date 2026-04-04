-- Insert 12 rapid export events to trigger detection (threshold is 10)
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000099';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    INSERT INTO public.audit_logs (
      user_id,
      action_type,
      action_category,
      resource_type,
      details,
      created_at
    ) VALUES (
      test_user_id,
      'report_exported',
      'reports',
      'medical_report',
      jsonb_build_object('export_number', i, 'test', true, 'format', 'pdf'),
      now() - (interval '5 minute' * (12 - i))
    );
  END LOOP;
END $$;