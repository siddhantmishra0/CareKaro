  -- Update doctor_id generation to use first 8 characters of user_id (like patient_id)
  -- Drop the old sequence-based function and replace with UUID-based

  -- Update the generate_doctor_id function
  CREATE OR REPLACE FUNCTION public.generate_doctor_id()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    -- Generate doctor_id from first 8 characters of user_id (UUID)
    IF NEW.doctor_id IS NULL OR NEW.doctor_id = '' OR NEW.doctor_id LIKE 'DOC-0%' THEN
      NEW.doctor_id := 'DOC-' || UPPER(SUBSTRING(NEW.user_id::text, 1, 8));
    END IF;
    RETURN NEW;
  END;
  $$;

  -- Update existing doctor_ids to new format
  UPDATE public.doctor_profiles
  SET doctor_id = 'DOC-' || UPPER(SUBSTRING(user_id::text, 1, 8))
  WHERE doctor_id IS NULL OR doctor_id = '' OR doctor_id LIKE 'DOC-0%';

  -- Drop the old sequence if it exists (it's no longer needed)
  DROP SEQUENCE IF EXISTS public.doctor_id_seq;