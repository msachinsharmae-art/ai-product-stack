DELETE FROM public.competitor_briefs a
USING public.competitor_briefs b
WHERE a.brief_date = b.brief_date
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS competitor_briefs_brief_date_uniq
  ON public.competitor_briefs (brief_date);