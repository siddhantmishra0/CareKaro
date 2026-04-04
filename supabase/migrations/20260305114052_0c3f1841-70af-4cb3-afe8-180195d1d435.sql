
-- Create medical_files table for WhatsApp and website file uploads
CREATE TABLE public.medical_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_by_role TEXT NOT NULL DEFAULT 'patient',
  source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('whatsapp', 'website')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  mime_type TEXT,
  description TEXT,
  doctor_report_id UUID REFERENCES public.doctor_reports(id),
  sender_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;

-- Patients can see their own files
CREATE POLICY "Patients can view their own files"
  ON public.medical_files FOR SELECT
  USING (auth.uid() = user_id);

-- Patients can insert their own files
CREATE POLICY "Patients can insert their own files"
  ON public.medical_files FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = uploaded_by);

-- Doctors can view files of patients they have reports with
CREATE POLICY "Doctors can view mapped patient files"
  ON public.medical_files FOR SELECT
  USING (
    is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.doctor_reports dr
      JOIN public.doctor_profiles dp ON dp.id = dr.doctor_id
      WHERE dr.patient_id = medical_files.user_id
        AND dp.user_id = auth.uid()
    )
  );

-- Doctors can insert files for mapped patients
CREATE POLICY "Doctors can insert files for mapped patients"
  ON public.medical_files FOR INSERT
  WITH CHECK (
    is_doctor(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.doctor_reports dr
      JOIN public.doctor_profiles dp ON dp.id = dr.doctor_id
      WHERE dr.patient_id = medical_files.user_id
        AND dp.user_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins can view all files"
  ON public.medical_files FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert all files"
  ON public.medical_files FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update all files"
  ON public.medical_files FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all files"
  ON public.medical_files FOR DELETE
  USING (is_admin(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER handle_medical_files_updated_at
  BEFORE UPDATE ON public.medical_files
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
