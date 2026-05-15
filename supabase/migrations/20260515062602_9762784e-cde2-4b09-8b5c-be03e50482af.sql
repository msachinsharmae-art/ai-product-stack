CREATE TABLE public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  twitter_handle text,
  topic text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.competitor_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid REFERENCES public.competitors(id) ON DELETE CASCADE,
  competitor_name text NOT NULL,
  source_type text NOT NULL,
  url text,
  title text NOT NULL,
  content text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_competitor_signals_created_at ON public.competitor_signals(created_at DESC);

CREATE TABLE public.competitor_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  markdown text NOT NULL,
  brief_json jsonb NOT NULL,
  signal_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_competitor_briefs_date ON public.competitor_briefs(brief_date DESC);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Competitors are publicly viewable" ON public.competitors FOR SELECT USING (true);
CREATE POLICY "Competitor signals are publicly viewable" ON public.competitor_signals FOR SELECT USING (true);
CREATE POLICY "Competitor briefs are publicly viewable" ON public.competitor_briefs FOR SELECT USING (true);