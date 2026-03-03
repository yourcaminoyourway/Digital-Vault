-- ============================================================================
-- Migration: create_documents_table
-- Description: Creates the documents table with indexes and RLS policies
-- ============================================================================

CREATE TABLE public.documents (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users (id),
  title              text        NOT NULL,
  description        text,
  category           text        NOT NULL,
  item_name          text        NOT NULL,
  item_brand         text,
  purchase_date      date,
  warranty_expiry    date,
  file_path          text,
  preview_image_path text,
  created_at         timestamptz DEFAULT timezone('utc', now()),
  updated_at         timestamptz DEFAULT timezone('utc', now())
);

-- Index for fast per-user lookups (used by RLS and queries)
CREATE INDEX documents_user_id_idx ON public.documents (user_id);

-- Enable Row-Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any document"
  ON public.documents FOR DELETE
  USING (is_admin(auth.uid()));
