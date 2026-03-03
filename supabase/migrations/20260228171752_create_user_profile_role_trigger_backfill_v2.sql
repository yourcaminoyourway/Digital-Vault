-- ============================================================================
-- Migration: create_user_profile_role_trigger_backfill_v2
-- Description: Trigger to auto-create profile + role when a new auth user signs up,
--              and backfill any existing auth users that are missing rows.
-- ============================================================================

-- Trigger function: runs after INSERT on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'User')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill: create missing profiles for existing auth users
INSERT INTO public.profiles (id, email, full_name)
SELECT
  id,
  email,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1), 'User')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Backfill: create missing roles for existing auth users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
