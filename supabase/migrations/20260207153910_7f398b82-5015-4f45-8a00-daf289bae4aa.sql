-- Allow doctors to upload files to the doctor-reports folder
-- Doctors can upload to: doctor-reports/{doctor_profile_id}/{patient_id}/...

-- Insert policy for doctors
CREATE POLICY "Doctors can upload to doctor-reports folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = 'doctor-reports' AND
  public.is_doctor(auth.uid())
);

-- Select policy for doctors to read their uploaded files
CREATE POLICY "Doctors can read their doctor-reports files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = 'doctor-reports' AND
  public.is_doctor(auth.uid())
);

-- Update policy for doctors
CREATE POLICY "Doctors can update their doctor-reports files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = 'doctor-reports' AND
  public.is_doctor(auth.uid())
)
WITH CHECK (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = 'doctor-reports' AND
  public.is_doctor(auth.uid())
);

-- Delete policy for doctors
CREATE POLICY "Doctors can delete their doctor-reports files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = 'doctor-reports' AND
  public.is_doctor(auth.uid())
);

-- Patients can read doctor-reports sent to them
-- The path is: doctor-reports/{doctor_id}/{patient_user_id}/...
CREATE POLICY "Patients can read doctor-reports sent to them"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = 'doctor-reports' AND
  (storage.foldername(name))[3] = auth.uid()::text
);