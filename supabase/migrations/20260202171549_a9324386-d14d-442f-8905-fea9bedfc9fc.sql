-- Directly backfill missing/empty patient_id without setting NULL first
DO $$
DECLARE
  max_id INT;
  r RECORD;
BEGIN
  -- Align sequence with current max
  SELECT max((substring(patient_id from 5))::INT)
  INTO max_id
  FROM public.profiles
  WHERE patient_id ~ '^PAT-[0-9]{6}$';

  IF max_id IS NULL THEN
    max_id := 0;
  END IF;

  PERFORM setval('patient_id_seq', max_id);

  -- Fill empty or whitespace-only patient_id values
  FOR r IN SELECT id FROM public.profiles WHERE patient_id IS NULL OR btrim(patient_id) = ''
  LOOP
    UPDATE public.profiles
    SET patient_id = 'PAT-' || LPAD(nextval('patient_id_seq')::TEXT, 6, '0')
    WHERE id = r.id;
  END LOOP;
END;
$$;