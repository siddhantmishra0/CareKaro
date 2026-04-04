-- Allow verified doctors to search patient profiles (for sending reports)
CREATE POLICY "Doctors can view patient profiles for search"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_doctor(auth.uid())
);