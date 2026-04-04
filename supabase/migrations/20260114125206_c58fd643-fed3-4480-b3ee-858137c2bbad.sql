-- Drop the overly permissive INSERT policy on email_logs
-- Edge functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
-- so this policy is unnecessary and creates a security vulnerability
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;