-- Add patient_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN patient_id TEXT UNIQUE;

-- Add doctor_id column to doctor_profiles table
ALTER TABLE public.doctor_profiles 
ADD COLUMN doctor_id TEXT UNIQUE;

-- Create sequence for patient IDs
CREATE SEQUENCE IF NOT EXISTS patient_id_seq START 1;

-- Create sequence for doctor IDs
CREATE SEQUENCE IF NOT EXISTS doctor_id_seq START 1;

-- Function to generate patient ID
CREATE OR REPLACE FUNCTION public.generate_patient_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.patient_id IS NULL THEN
    NEW.patient_id := 'PAT-' || LPAD(nextval('patient_id_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Function to generate doctor ID
CREATE OR REPLACE FUNCTION public.generate_doctor_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.doctor_id IS NULL THEN
    NEW.doctor_id := 'DOC-' || LPAD(nextval('doctor_id_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for auto-generating patient_id on insert
CREATE TRIGGER set_patient_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_patient_id();

-- Trigger for auto-generating doctor_id on insert
CREATE TRIGGER set_doctor_id
  BEFORE INSERT ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_doctor_id();

-- Populate existing profiles with patient IDs
UPDATE public.profiles 
SET patient_id = 'PAT-' || LPAD(nextval('patient_id_seq')::TEXT, 6, '0')
WHERE patient_id IS NULL;

-- Populate existing doctor_profiles with doctor IDs
UPDATE public.doctor_profiles 
SET doctor_id = 'DOC-' || LPAD(nextval('doctor_id_seq')::TEXT, 6, '0')
WHERE doctor_id IS NULL;

-- Make columns NOT NULL after populating existing data
ALTER TABLE public.profiles 
ALTER COLUMN patient_id SET NOT NULL;

ALTER TABLE public.doctor_profiles 
ALTER COLUMN doctor_id SET NOT NULL;