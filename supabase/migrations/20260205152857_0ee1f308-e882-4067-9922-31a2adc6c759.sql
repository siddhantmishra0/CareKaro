-- First make patient_id nullable
ALTER TABLE public.profiles ALTER COLUMN patient_id DROP NOT NULL;

-- Recreate the trigger function that generates patient_id from user_id (first 8 chars)
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate patient_id if it's NULL and user is not a doctor or admin
  IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
    -- Check if user is a doctor or admin
    IF NOT EXISTS (
      SELECT 1 FROM public.doctor_profiles WHERE user_id = NEW.user_id AND verification_status = 'approved'
    ) AND NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role IN ('admin', 'doctor')
    ) THEN
      -- Generate patient_id from first 8 characters of user_id (UUID)
      NEW.patient_id := 'PAT-' || UPPER(SUBSTRING(NEW.user_id::text, 1, 8));
    ELSE
      -- User is a doctor or admin, set patient_id to NULL
      NEW.patient_id := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (drop first if exists from previous attempt)
DROP TRIGGER IF EXISTS generate_patient_id_trigger ON public.profiles;
CREATE TRIGGER generate_patient_id_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_patient_id();

-- Create function to clear patient_id when user becomes doctor or admin (drop first if exists)
DROP FUNCTION IF EXISTS public.clear_patient_id_on_role_change() CASCADE;
CREATE OR REPLACE FUNCTION public.clear_patient_id_on_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When user gets doctor or admin role, clear their patient_id
  IF NEW.role IN ('admin', 'doctor') THEN
    UPDATE public.profiles 
    SET patient_id = NULL 
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles
CREATE TRIGGER clear_patient_id_on_role_trigger
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_patient_id_on_role_change();

-- Create function to clear patient_id when doctor profile is approved (drop first if exists)
DROP FUNCTION IF EXISTS public.clear_patient_id_on_doctor_approval() CASCADE;
CREATE OR REPLACE FUNCTION public.clear_patient_id_on_doctor_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When doctor is approved, clear their patient_id
  IF NEW.verification_status = 'approved' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'approved') THEN
    UPDATE public.profiles 
    SET patient_id = NULL 
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on doctor_profiles
CREATE TRIGGER clear_patient_id_on_doctor_approval_trigger
  AFTER INSERT OR UPDATE ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_patient_id_on_doctor_approval();

-- Update existing patient_ids to new format (for patients only)
UPDATE public.profiles p
SET patient_id = 'PAT-' || UPPER(SUBSTRING(p.user_id::text, 1, 8))
WHERE NOT EXISTS (
  SELECT 1 FROM public.doctor_profiles dp WHERE dp.user_id = p.user_id AND dp.verification_status = 'approved'
) AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role IN ('admin', 'doctor')
);

-- Clear patient_id for existing doctors and admins
UPDATE public.profiles p
SET patient_id = NULL
WHERE EXISTS (
  SELECT 1 FROM public.doctor_profiles dp WHERE dp.user_id = p.user_id AND dp.verification_status = 'approved'
) OR EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role IN ('admin', 'doctor')
);