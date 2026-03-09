-- DropZoneSquads Supabase schema
-- Run in Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ======================================
-- PROFILES (Supabase Auth user metadata)
-- ======================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    username TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Crossplay',
    activision_id TEXT NOT NULL DEFAULT '',
    marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_opt_in_at TIMESTAMPTZ,
    supporter BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'Crossplay';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activision_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supporter BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill defaults for existing NULL rows
UPDATE public.profiles
SET
    platform = COALESCE(NULLIF(TRIM(platform), ''), 'Crossplay'),
    activision_id = COALESCE(activision_id, ''),
    marketing_opt_in = COALESCE(marketing_opt_in, FALSE),
    supporter = COALESCE(supporter, FALSE),
    is_admin = COALESCE(is_admin, FALSE),
    updated_at = COALESCE(updated_at, NOW()),
    created_at = COALESCE(created_at, NOW())
WHERE
    platform IS NULL
    OR activision_id IS NULL
    OR marketing_opt_in IS NULL
    OR supporter IS NULL
    OR is_admin IS NULL
    OR updated_at IS NULL
    OR created_at IS NULL;

-- Keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile rows when auth users are created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_username TEXT;
  meta_platform TEXT;
  meta_activision_id TEXT;
  meta_marketing_opt_in BOOLEAN;
  meta_marketing_opt_in_at TIMESTAMPTZ;
BEGIN
  meta_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    split_part(NEW.email, '@', 1),
    'Operator'
  );
  meta_platform := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'platform'), ''),
    'Crossplay'
  );
  meta_activision_id := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'activision_id'), ''),
    ''
  );
  meta_marketing_opt_in := COALESCE(
    (NEW.raw_user_meta_data->>'marketing_opt_in')::BOOLEAN,
    FALSE
  );
  meta_marketing_opt_in_at := CASE
    WHEN meta_marketing_opt_in THEN NOW()
    ELSE NULL
  END;

  INSERT INTO public.profiles (
    id,
    email,
    username,
    platform,
    activision_id,
    marketing_opt_in,
    marketing_opt_in_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    meta_username,
    meta_platform,
    meta_activision_id,
    meta_marketing_opt_in,
    meta_marketing_opt_in_at
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    username = COALESCE(NULLIF(TRIM(public.profiles.username), ''), EXCLUDED.username),
    platform = COALESCE(NULLIF(TRIM(public.profiles.platform), ''), EXCLUDED.platform),
    activision_id = COALESCE(public.profiles.activision_id, EXCLUDED.activision_id),
    marketing_opt_in = COALESCE(public.profiles.marketing_opt_in, EXCLUDED.marketing_opt_in),
    marketing_opt_in_at = COALESCE(public.profiles.marketing_opt_in_at, EXCLUDED.marketing_opt_in_at);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = TRUE
  );
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can read all profiles'
  ) THEN
    CREATE POLICY "Admins can read all profiles"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (public.is_admin_user());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- ======================================
-- MARKETING SUBSCRIBERS
-- ======================================
CREATE TABLE IF NOT EXISTS public.marketing_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    username TEXT,
    source TEXT NOT NULL DEFAULT 'signup_form',
    consent_text TEXT NOT NULL,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subscribed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.marketing_subscribers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.marketing_subscribers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.marketing_subscribers ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.marketing_subscribers ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'signup_form';
ALTER TABLE public.marketing_subscribers ADD COLUMN IF NOT EXISTS consent_text TEXT;
ALTER TABLE public.marketing_subscribers ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.marketing_subscribers ADD COLUMN IF NOT EXISTS subscribed BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.marketing_subscribers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.marketing_subscribers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.marketing_subscribers
SET
    source = COALESCE(NULLIF(TRIM(source), ''), 'signup_form'),
    consent_text = COALESCE(NULLIF(consent_text, ''), 'I agree to receive updates and offers from Drop Zone Squads.'),
    subscribed = COALESCE(subscribed, TRUE),
    consented_at = COALESCE(consented_at, NOW()),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE
    source IS NULL
    OR consent_text IS NULL
    OR consent_text = ''
    OR subscribed IS NULL
    OR consented_at IS NULL
    OR created_at IS NULL
    OR updated_at IS NULL;

DROP TRIGGER IF EXISTS trg_marketing_subscribers_updated_at ON public.marketing_subscribers;
CREATE TRIGGER trg_marketing_subscribers_updated_at
BEFORE UPDATE ON public.marketing_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS marketing_subscribers_email_idx
ON public.marketing_subscribers (LOWER(email));

ALTER TABLE public.marketing_subscribers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketing_subscribers'
      AND policyname = 'Public can insert subscribers'
  ) THEN
    CREATE POLICY "Public can insert subscribers"
      ON public.marketing_subscribers
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        LENGTH(TRIM(COALESCE(email, ''))) > 3
        AND subscribed = TRUE
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketing_subscribers'
      AND policyname = 'Admins can read subscribers'
  ) THEN
    CREATE POLICY "Admins can read subscribers"
      ON public.marketing_subscribers
      FOR SELECT
      TO authenticated
      USING (public.is_admin_user());
  END IF;
END
$$;

GRANT INSERT ON public.marketing_subscribers TO anon, authenticated;
GRANT SELECT ON public.marketing_subscribers TO authenticated;

-- ======================================
-- SQUADS
-- ======================================
CREATE TABLE IF NOT EXISTS public.squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT,
    name TEXT NOT NULL,
    game_mode TEXT NOT NULL,
    platform TEXT NOT NULL,
    mic_required BOOLEAN NOT NULL DEFAULT TRUE,
    skill_level TEXT NOT NULL,
    audience TEXT NOT NULL DEFAULT 'Open to All',
    comms TEXT NOT NULL DEFAULT 'Game',
    description TEXT,
    max_players INTEGER NOT NULL DEFAULT 4,
    player_count INTEGER NOT NULL DEFAULT 1,
    accepting_players BOOLEAN NOT NULL DEFAULT TRUE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility for older tables
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS creator_id TEXT;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'Open to All';
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS comms TEXT NOT NULL DEFAULT 'Game';
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS accepting_players BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert squads" ON public.squads;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'squads'
      AND policyname = 'Public read squads'
  ) THEN
    CREATE POLICY "Public read squads"
      ON public.squads
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END
$$;

GRANT SELECT ON public.squads TO anon, authenticated;
GRANT INSERT ON public.squads TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'squads'
      AND policyname = 'Authenticated insert squads'
  ) THEN
    CREATE POLICY "Authenticated insert squads"
      ON public.squads
      FOR INSERT
      TO authenticated
      WITH CHECK (
        creator_id IS NOT NULL
        AND creator_id = auth.uid()::text
      );
  END IF;
END
$$;
