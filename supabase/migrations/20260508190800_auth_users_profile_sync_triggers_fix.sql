-- Fix auth.users → public.users profile sync
--
-- Root cause (typical on Supabase):
-- - Triggers on auth.users run as the auth table owner (supabase_auth_admin), not as end users.
-- - After REVOKE ALL ON FUNCTION private.handle_auth_user_sync() FROM PUBLIC, that role had no
--   EXECUTE privilege on the SECURITY DEFINER trigger function, so the AFTER INSERT/UPDATE trigger
--   could not run the function → public.users rows were never created (or inserts errored and
--   were retried via alternate paths leaving orphans — depending on client).
-- - Separately: migrations may not have been applied on a given environment; this file re-applies
--   the function + triggers idempotently and backfills missing profiles.
--
-- Requirements preserved:
-- - public.users remains the operational profile; role from raw_app_meta_data only
-- - SECURITY DEFINER + fixed search_path on private.handle_auth_user_sync
-- - ON CONFLICT upsert for safe replays

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;

COMMENT ON SCHEMA private IS 'Internal helpers not exposed to PostgREST; keep SECURITY DEFINER functions here';

-- Allow Supabase auth subsystem to invoke our trigger function (required for triggers on auth.users).
DO $grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA private TO supabase_auth_admin';
  END IF;
END
$grant$;

CREATE OR REPLACE FUNCTION private.handle_auth_user_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_display text;
  v_avatar text;
  v_phone text;
  v_role public.user_role;
  v_active boolean;
  v_meta jsonb;
BEGIN
  v_display := coalesce(
    nullif(btrim(coalesce(NEW.raw_user_meta_data->>'full_name', '')), ''),
    nullif(btrim(coalesce(NEW.raw_user_meta_data->>'name', '')), ''),
    nullif(btrim(coalesce(NEW.raw_user_meta_data->>'display_name', '')), '')
  );

  v_avatar := coalesce(
    nullif(btrim(coalesce(NEW.raw_user_meta_data->>'avatar_url', '')), ''),
    nullif(btrim(coalesce(NEW.raw_user_meta_data->>'picture', '')), '')
  );

  v_phone := coalesce(
    nullif(btrim(coalesce(NEW.phone, '')), ''),
    nullif(btrim(coalesce(NEW.raw_user_meta_data->>'phone', '')), '')
  );

  IF v_phone IS NOT NULL AND v_phone !~ '^\+[1-9]\d{1,14}$' THEN
    v_phone := NULL;
  END IF;

  v_role := CASE lower(btrim(coalesce(NEW.raw_app_meta_data->>'role', '')))
    WHEN 'admin' THEN 'admin'::public.user_role
    WHEN 'dispatcher' THEN 'dispatcher'::public.user_role
    WHEN 'cleaner' THEN 'cleaner'::public.user_role
    WHEN 'customer' THEN 'customer'::public.user_role
    ELSE 'customer'::public.user_role
  END;

  v_active :=
    NEW.deleted_at IS NULL
    AND (
      NEW.banned_until IS NULL
      OR NEW.banned_until <= now()
    );

  v_meta := jsonb_strip_nulls(
    jsonb_build_object(
      'auth_sync',
      jsonb_build_object(
        'at', to_jsonb(now()),
        'email_verified', to_jsonb(NEW.email_confirmed_at IS NOT NULL),
        'phone_verified', to_jsonb(NEW.phone_confirmed_at IS NOT NULL)
      )
    )
  );

  INSERT INTO public.users (
    id,
    role,
    display_name,
    phone,
    avatar_url,
    is_active,
    metadata
  )
  VALUES (
    NEW.id,
    v_role,
    v_display,
    v_phone,
    v_avatar,
    v_active,
    coalesce(v_meta, '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    role = excluded.role,
    display_name = excluded.display_name,
    phone = excluded.phone,
    avatar_url = excluded.avatar_url,
    is_active = excluded.is_active,
    metadata = public.users.metadata || excluded.metadata,
    updated_at = now();

  RETURN NEW;
END;
$$;

ALTER FUNCTION private.handle_auth_user_sync() OWNER TO postgres;

REVOKE ALL ON FUNCTION private.handle_auth_user_sync() FROM PUBLIC;

-- Critical: auth trigger runtime role must execute this function.
DO $grant_exec$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION private.handle_auth_user_sync() TO supabase_auth_admin';
  END IF;
END
$grant_exec$;

COMMENT ON FUNCTION private.handle_auth_user_sync IS
  'Syncs auth.users → public.users. Role from raw_app_meta_data only; SECURITY DEFINER; EXECUTE granted to supabase_auth_admin for auth triggers.';

-- ---------------------------------------------------------------------------
-- Triggers (idempotent)
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.handle_auth_user_sync();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF
  raw_user_meta_data,
  raw_app_meta_data,
  phone,
  banned_until,
  deleted_at,
  email_confirmed_at,
  phone_confirmed_at
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.handle_auth_user_sync();

-- ---------------------------------------------------------------------------
-- Backfill: auth users without an operational profile (repair past failures)
-- ---------------------------------------------------------------------------

INSERT INTO public.users (
  id,
  role,
  display_name,
  phone,
  avatar_url,
  is_active,
  metadata
)
SELECT
  au.id,
  CASE lower(btrim(coalesce(au.raw_app_meta_data->>'role', '')))
    WHEN 'admin' THEN 'admin'::public.user_role
    WHEN 'dispatcher' THEN 'dispatcher'::public.user_role
    WHEN 'cleaner' THEN 'cleaner'::public.user_role
    WHEN 'customer' THEN 'customer'::public.user_role
    ELSE 'customer'::public.user_role
  END AS role,
  coalesce(
    nullif(btrim(coalesce(au.raw_user_meta_data->>'full_name', '')), ''),
    nullif(btrim(coalesce(au.raw_user_meta_data->>'name', '')), ''),
    nullif(btrim(coalesce(au.raw_user_meta_data->>'display_name', '')), '')
  ) AS display_name,
  CASE
    WHEN coalesce(nullif(btrim(coalesce(au.phone, '')), ''), nullif(btrim(coalesce(au.raw_user_meta_data->>'phone', '')), '')) IS NOT NULL
      AND coalesce(nullif(btrim(coalesce(au.phone, '')), ''), nullif(btrim(coalesce(au.raw_user_meta_data->>'phone', '')), '')) !~ '^\+[1-9]\d{1,14}$'
    THEN NULL
    ELSE coalesce(nullif(btrim(coalesce(au.phone, '')), ''), nullif(btrim(coalesce(au.raw_user_meta_data->>'phone', '')), ''))
  END AS phone,
  coalesce(
    nullif(btrim(coalesce(au.raw_user_meta_data->>'avatar_url', '')), ''),
    nullif(btrim(coalesce(au.raw_user_meta_data->>'picture', '')), '')
  ) AS avatar_url,
  (
    au.deleted_at IS NULL
    AND (au.banned_until IS NULL OR au.banned_until <= now())
  ) AS is_active,
  jsonb_strip_nulls(
    jsonb_build_object(
      'auth_sync',
      jsonb_build_object(
        'at', to_jsonb(now()),
        'source', to_jsonb('backfill_migration'::text),
        'email_verified', to_jsonb(au.email_confirmed_at IS NOT NULL),
        'phone_verified', to_jsonb(au.phone_confirmed_at IS NOT NULL)
      )
    )
  ) AS metadata
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO UPDATE SET
  role = excluded.role,
  display_name = coalesce(nullif(excluded.display_name, ''), public.users.display_name),
  phone = coalesce(excluded.phone, public.users.phone),
  avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
  is_active = excluded.is_active,
  metadata = public.users.metadata || excluded.metadata,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Verification (run manually in SQL editor after deploy)
-- ---------------------------------------------------------------------------
-- 1) Orphans (should return 0 rows after fix + backfill):
--    SELECT au.id, au.email
--    FROM auth.users au
--    LEFT JOIN public.users pu ON pu.id = au.id
--    WHERE pu.id IS NULL;
--
-- 2) Triggers exist:
--    SELECT tgname, tgenabled
--    FROM pg_trigger
--    WHERE tgrelid = 'auth.users'::regclass
--      AND tgname IN ('on_auth_user_created', 'on_auth_user_updated');
--
-- 3) Function privileges (supabase_auth_admin should have EXECUTE when role exists):
--    SELECT grantee, privilege_type
--    FROM information_schema.routine_privileges
--    WHERE routine_schema = 'private'
--      AND routine_name = 'handle_auth_user_sync';
--
-- 4) New signup smoke test: create a test auth user in Dashboard, then:
--    SELECT * FROM public.users WHERE id = '<that_user_id>';
