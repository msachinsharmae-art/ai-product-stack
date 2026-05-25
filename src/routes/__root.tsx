import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI Product Ops Stack" },
      { name: "description", content: "An AI-powered Product Operations showcase built to demonstrate how modern PM workflows can be automated using LLMs, no-code automation, and collaborative tools." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "AI Product Ops Stack" },
      { property: "og:description", content: "An AI-powered Product Operations showcase built to demonstrate how modern PM workflows can be automated using LLMs, no-code automation, and collaborative tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "AI Product Ops Stack" },
      { name: "twitter:description", content: "An AI-powered Product Operations showcase built to demonstrate how modern PM workflows can be automated using LLMs, no-code automation, and collaborative tools." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/b57bc51e-e8f6-4405-97cb-d3b369903df6" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/b57bc51e-e8f6-4405-97cb-d3b369903df6" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
      setAuthChecked(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Gate: redirect to /login when unauthenticated (except on /login itself).
  useEffect(() => {
    if (!authChecked) return;
    if (!userEmail && pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [authChecked, userEmail, pathname, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const isLoginPage = pathname === "/login";
  const showGate = authChecked && !userEmail && !isLoginPage;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          {showGate ? (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
              <p className="text-sm text-white/60">Redirecting to sign in…</p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
        {!isLoginPage && (
          <footer className="border-t border-border bg-background/50 py-4 text-center text-xs text-muted-foreground">
            <p>
              Registered to <span className="font-semibold text-foreground">Sachin Kumar Sharma</span> · Made with Lovable
              {userEmail && (
                <>
                  {" · "}
                  <span className="text-foreground">{userEmail}</span>
                  {" · "}
                  <button onClick={handleSignOut} className="text-foreground underline hover:opacity-80">
                    Sign out
                  </button>
                </>
              )}
            </p>
            <p className="mt-1 opacity-70">
              © {new Date().getFullYear()} · Independent work, not affiliated to any IP or any third-party source — all hosted and made purely on Lovable
            </p>
          </footer>
        )}
      </div>
    </QueryClientProvider>
  );
}

