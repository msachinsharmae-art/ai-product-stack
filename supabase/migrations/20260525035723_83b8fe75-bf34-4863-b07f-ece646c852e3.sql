
-- Lock down sensitive tables: app reads via server-side admin client, no direct anon access needed.
DROP POLICY IF EXISTS "PRDs are publicly viewable" ON public.prds;
DROP POLICY IF EXISTS "Competitors are publicly viewable" ON public.competitors;
DROP POLICY IF EXISTS "Competitor signals are publicly viewable" ON public.competitor_signals;
DROP POLICY IF EXISTS "Competitor briefs are publicly viewable" ON public.competitor_briefs;

-- Explicit deny policies (RLS is already enabled; with no policies, default is deny — these make intent explicit)
CREATE POLICY "Deny direct access to prds"
  ON public.prds FOR SELECT USING (false);

CREATE POLICY "Deny direct access to competitors"
  ON public.competitors FOR SELECT USING (false);

CREATE POLICY "Deny direct access to competitor_signals"
  ON public.competitor_signals FOR SELECT USING (false);

CREATE POLICY "Deny direct access to competitor_briefs"
  ON public.competitor_briefs FOR SELECT USING (false);
