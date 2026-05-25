import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AI Product Ops Stack" },
      { name: "description", content: "Sign in with your company email to access the AI Product Ops Stack." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

// Common free/personal email providers — blocked. Only company emails allowed.
const BLOCKED_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "ymail.com", "rocketmail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com", "passport.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com", "aim.com",
  "proton.me", "protonmail.com", "pm.me",
  "gmx.com", "gmx.de", "mail.com",
  "zoho.com",
  "yandex.com", "yandex.ru",
  "rediffmail.com",
  "qq.com", "163.com", "126.com", "sina.com",
  "duck.com", "duckduckgo.com",
  "fastmail.com",
  "tutanota.com", "tuta.io",
]);

// Owner / builder accounts — always allowed, even on personal email providers.
export const OWNER_EMAILS = new Set([
  "msachinsharmae@gmail.com",
]);

function isCompanyEmail(email: string): { ok: boolean; reason?: string; owner?: boolean } {
  const trimmed = email.trim().toLowerCase();
  const match = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(trimmed);
  if (!match) return { ok: false, reason: "Enter a valid email address." };
  if (OWNER_EMAILS.has(trimmed)) return { ok: true, owner: true };
  const domain = match[1];
  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      ok: false,
      reason: "Please use your official company email — personal providers (Gmail, Yahoo, Outlook, etc.) are not allowed.",
    };
  }
  if (/\.(test|local|example|invalid)$/.test(domain)) {
    return { ok: false, reason: "Use a real company email domain." };
  }
  return { ok: true };
}

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already signed in, bounce home
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const check = isCompanyEmail(email);
    if (!check.ok) {
      setError(check.reason!);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setInfo("Account created. You're signed in — redirecting…");
        setTimeout(() => navigate({ to: "/" }), 600);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        <Link to="/" className="relative mb-8 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-black">
            S
          </div>
          <span className="text-sm font-semibold tracking-tight">AI Product Ops Stack</span>
        </Link>

        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-black tracking-tight">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Company email only. Personal providers like Gmail, Yahoo, Outlook are not allowed.
          </p>
          <p className="mt-2 text-xs text-emerald-300/80">
            Owner / builder accounts are whitelisted and can sign in with any email.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-white/60">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400/50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-white/60">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400/50"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-white/50">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
                  className="font-semibold text-emerald-300 hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(null); setInfo(null); }}
                  className="font-semibold text-emerald-300 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="relative mt-6 text-center text-xs text-white/40">
          Registered to Sachin Kumar Sharma · Made with Lovable
        </p>
      </div>
    </div>
  );
}
