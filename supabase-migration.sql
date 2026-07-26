-- Create pastes table for CodePaste
CREATE TABLE IF NOT EXISTS public.pastes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT DEFAULT 'untitled',
  content TEXT NOT NULL,
  language TEXT DEFAULT 'plaintext',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  expires_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full text search index
ALTER TABLE public.pastes ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
CREATE INDEX IF NOT EXISTS idx_pastes_slug ON public.pastes(slug);
CREATE INDEX IF NOT EXISTS idx_pastes_language ON public.pastes(language);
CREATE INDEX IF NOT EXISTS idx_pastes_created_at ON public.pastes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pastes_search ON public.pastes USING GIN(search_vector);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_paste_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_paste_search_vector ON public.pastes;
CREATE TRIGGER trg_paste_search_vector
  BEFORE INSERT OR UPDATE ON public.pastes
  FOR EACH ROW EXECUTE FUNCTION update_paste_search_vector();

-- RLS
ALTER TABLE public.pastes ENABLE ROW LEVEL SECURITY;

-- Anyone can read public pastes
CREATE POLICY "Anyone can read public pastes" ON public.pastes
  FOR SELECT USING (visibility = 'public');

-- Authenticated users can read their own private pastes
CREATE POLICY "Users can read own pastes" ON public.pastes
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can insert (for anonymous pastes)
CREATE POLICY "Anyone can insert pastes" ON public.pastes
  FOR INSERT WITH CHECK (true);

-- Users can update own pastes
CREATE POLICY "Users can update own pastes" ON public.pastes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own pastes
CREATE POLICY "Users can delete own pastes" ON public.pastes
  FOR DELETE USING (auth.uid() = user_id);
