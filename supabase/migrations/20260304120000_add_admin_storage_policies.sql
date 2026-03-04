-- ============================================================================
-- Migration: add_admin_storage_policies
-- Description: Allows admins to read and delete any file in the documents bucket
-- ============================================================================

-- Admins can view (SELECT) any file in the documents bucket
CREATE POLICY "Admins can view all files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND is_admin(auth.uid())
  );

-- Admins can delete any file in the documents bucket
CREATE POLICY "Admins can delete all files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND is_admin(auth.uid())
  );
