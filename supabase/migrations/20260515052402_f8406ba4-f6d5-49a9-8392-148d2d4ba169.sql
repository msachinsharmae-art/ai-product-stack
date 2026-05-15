CREATE TABLE public.prds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  transcript TEXT NOT NULL,
  prd_json JSONB NOT NULL,
  markdown TEXT NOT NULL,
  notion_url TEXT,
  google_doc_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PRDs are publicly viewable"
ON public.prds
FOR SELECT
USING (true);

CREATE INDEX idx_prds_created_at ON public.prds(created_at DESC);