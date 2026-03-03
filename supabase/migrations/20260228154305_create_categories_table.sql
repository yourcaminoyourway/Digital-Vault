-- ============================================================================
-- Migration: create_categories_table
-- Description: Creates the categories table with per-user uniqueness and RLS
-- ============================================================================

CREATE TABLE public.categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users (id),
  name       text        NOT NULL,
  created_at timestamptz DEFAULT timezone('utc', now())
);

-- Index for fast per-user lookups
CREATE INDEX categories_user_id_idx ON public.categories (user_id);

-- Ensure each user has unique category names (case-insensitive, trimmed)
CREATE UNIQUE INDEX categories_user_name_unique
  ON public.categories (user_id, lower(trim(name)));

-- Enable Row-Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all categories"
  ON public.categories FOR SELECT
  USING (is_admin(auth.uid()));
