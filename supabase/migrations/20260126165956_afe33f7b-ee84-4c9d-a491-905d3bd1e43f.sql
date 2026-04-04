-- Fix email_analytics security definer view 
DROP VIEW IF EXISTS public.email_analytics;

-- Recreate email_analytics without security definer
CREATE VIEW public.email_analytics AS
SELECT
  date_trunc('day', sent_at)::date as date,
  email_type,
  status,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.email_logs
GROUP BY date_trunc('day', sent_at)::date, email_type, status
ORDER BY date DESC;