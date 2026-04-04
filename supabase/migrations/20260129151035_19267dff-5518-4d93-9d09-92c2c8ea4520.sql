-- Insert 6 failed login attempts for a test user to breach the threshold of 5
-- Using a consistent test user ID
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000099';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    INSERT INTO public.audit_logs (
      user_id,
      action_type,
      action_category,
      resource_type,
      details,
      created_at
    ) VALUES (
      test_user_id,
      'login_failed',
      'user_activity',
      'auth',
      jsonb_build_object('attempt', i, 'test', true, 'ip', '192.168.1.' || i),
      now() - (interval '1 minute' * (6 - i))
    );
  END LOOP;
END $$;