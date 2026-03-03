-- ============================================================================
-- Migration: create_user_roles_table
-- Description: Creates the user_roles table for RBAC with RLS policies
-- ============================================================================

CREATE TABLE public.user_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES auth.users (id),
  role       text        DEFAULT 'user'
                         CHECK (role = ANY (ARRAY['user', 'admin'])),
  created_at timestamptz DEFAULT timezone('utc', now())
);

-- Enable Row-Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
