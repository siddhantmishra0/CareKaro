-- Add 'doctor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'doctor';

-- Create doctor_profiles table for verified doctor information
CREATE TABLE public.doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  specialization text NOT NULL,
  license_number text NOT NULL,
  hospital_affiliation text,
  phone text,
  bio text,
  avatar_url text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create doctor_reports table for reports sent by doctors to patients
CREATE TABLE public.doctor_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  report_type text NOT NULL,
  title text NOT NULL,
  file_url text,
  file_name text,
  file_size integer,
  examination_date date,
  doctor_remarks text,
  observations text,
  risk_indicators text[],
  follow_up_advice text,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reports ENABLE ROW LEVEL SECURITY;

-- Doctor profiles policies
-- Doctors can view and update their own profile
CREATE POLICY "Doctors can view their own profile"
  ON public.doctor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own profile"
  ON public.doctor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create doctor profile during registration"
  ON public.doctor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view and manage all doctor profiles
CREATE POLICY "Admins can view all doctor profiles"
  ON public.doctor_profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all doctor profiles"
  ON public.doctor_profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Patients can view approved doctors (for display purposes)
CREATE POLICY "Anyone can view approved doctors"
  ON public.doctor_profiles FOR SELECT
  USING (verification_status = 'approved');

-- Doctor reports policies
-- Doctors can create reports for any patient
CREATE POLICY "Doctors can create reports"
  ON public.doctor_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = doctor_id
        AND dp.user_id = auth.uid()
        AND dp.verification_status = 'approved'
    )
  );

-- Doctors can view and update their own reports
CREATE POLICY "Doctors can view their own reports"
  ON public.doctor_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = doctor_id AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update their own reports"
  ON public.doctor_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = doctor_id AND dp.user_id = auth.uid()
    )
  );

-- Patients can view reports sent to them
CREATE POLICY "Patients can view their received reports"
  ON public.doctor_reports FOR SELECT
  USING (auth.uid() = patient_id);

-- Patients can update read status
CREATE POLICY "Patients can update read status"
  ON public.doctor_reports FOR UPDATE
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all doctor reports"
  ON public.doctor_reports FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create updated_at triggers
CREATE TRIGGER update_doctor_profiles_updated_at
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_doctor_reports_updated_at
  BEFORE UPDATE ON public.doctor_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to check if user is a verified doctor
CREATE OR REPLACE FUNCTION public.is_doctor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.doctor_profiles
    WHERE user_id = _user_id
      AND verification_status = 'approved'
  )
$$;