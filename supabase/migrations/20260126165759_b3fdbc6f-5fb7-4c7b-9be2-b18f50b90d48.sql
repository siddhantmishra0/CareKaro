-- Fix security definer view issue by dropping and recreating as normal view
DROP VIEW IF EXISTS public.audit_analytics;

-- Recreate audit_analytics view without SECURITY DEFINER (regular view)
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

-- Fix permissive RLS policy on family_invite_codes (update with true)
DROP POLICY IF EXISTS "Users can update invite codes" ON public.family_invite_codes;

-- Create more restrictive update policy
CREATE POLICY "Users can update invite codes they created or are using"
ON public.family_invite_codes
FOR UPDATE
TO authenticated
USING (auth.uid() = inviter_id OR auth.uid() = used_by);

-- Add admin policies for audit logs to allow admin full access for management
CREATE POLICY "Admins can update audit logs"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add admin policies for specialist_recommendations
CREATE POLICY "Admins can view all recommendations"
ON public.specialist_recommendations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all recommendations"
ON public.specialist_recommendations
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all recommendations"
ON public.specialist_recommendations
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));