-- Create storage bucket for medical reports (private for security)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-reports',
  'medical-reports',
  false,
  52428800, -- 50MB limit per file
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'application/dicom'
  ]
);

-- RLS Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload their own medical reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can view their own files
CREATE POLICY "Users can view their own medical reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can update their own files
CREATE POLICY "Users can update their own medical reports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can delete their own files
CREATE POLICY "Users can delete their own medical reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);