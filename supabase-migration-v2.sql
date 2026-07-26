-- Fix schema permissions (lost after DROP SCHEMA public CASCADE)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Allow anonymous inserts
CREATE POLICY IF NOT EXISTS "Anyone can insert pastes" ON public.pastes
  FOR INSERT WITH CHECK (true);

-- Allow anonymous reads of public pastes
CREATE POLICY IF NOT EXISTS "Anyone can read public pastes" ON public.pastes
  FOR SELECT USING (visibility = 'public');

-- Allow anonymous reads of unlisted pastes
CREATE POLICY IF NOT EXISTS "Anyone can read unlisted pastes" ON public.pastes
  FOR SELECT USING (visibility = 'unlisted');

-- Profiles table for user settings
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can upsert own profile" ON public.profiles;
CREATE POLICY "Users can upsert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Password protection columns for pastes
ALTER TABLE public.pastes ADD COLUMN IF NOT EXISTS password_protected BOOLEAN DEFAULT false;
ALTER TABLE public.pastes ADD COLUMN IF NOT EXISTS wrapped_key TEXT;
ALTER TABLE public.pastes ADD COLUMN IF NOT EXISTS wrapped_key_salt TEXT;
ALTER TABLE public.pastes ADD COLUMN IF NOT EXISTS wrapped_key_iv TEXT;

-- API tokens for programmatic access
CREATE TABLE IF NOT EXISTS public.api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON public.api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON public.api_tokens(user_id);

ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own tokens" ON public.api_tokens;
CREATE POLICY "Users can read own tokens" ON public.api_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tokens" ON public.api_tokens;
CREATE POLICY "Users can insert own tokens" ON public.api_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tokens" ON public.api_tokens
;
CREATE POLICY "Users can delete own tokens" ON public.api_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Paste version history
CREATE TABLE IF NOT EXISTS public.paste_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paste_id UUID NOT NULL REFERENCES public.pastes(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  language TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paste_versions_paste ON public.paste_versions(paste_id);

ALTER TABLE public.paste_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own paste versions" ON public.paste_versions;
CREATE POLICY "Users can read own paste versions" ON public.paste_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pastes WHERE id = paste_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role can insert paste versions" ON public.paste_versions;
CREATE POLICY "Service role can insert paste versions" ON public.paste_versions
  FOR INSERT WITH CHECK (true);
