-- Auth → public.users profile sync (Supabase-compatible)
-- - Creates profile on auth.users insert
-- - Syncs profile when auth metadata, phone, or ban state changes
-- - Role is read ONLY from raw_app_meta_data (never user_metadata)
-- - Display fields use whitelisted keys from raw_user_meta_data + auth.phone

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;

COMMENT ON SCHEMA private IS 'Internal helpers not exposed to PostgREST; keep SECURITY DEFINER functions here';

-- ---------------------------------------------------------------------------
-- Trigger function: SECURITY DEFINER with fixed search_path
-- ---------------------------------------------------------------------------

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
  -- Whitelisted display keys only (do not copy entire raw_user_meta_data blob)
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

  -- Role: server-controlled app_metadata only; unknown values → customer
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

  -- Small, intentional audit subset (no full JWT metadata dump)
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

  -- Single upsert: handles INSERT/UPDATE on auth and backfills missing profiles
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

COMMENT ON FUNCTION private.handle_auth_user_sync() IS
  'Syncs auth.users → public.users. Role from raw_app_meta_data only; display from whitelisted user_meta keys; SECURITY DEFINER with locked search_path.';

-- ---------------------------------------------------------------------------
-- Triggers on auth.users
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
