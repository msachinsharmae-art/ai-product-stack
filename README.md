# AI Product Ops Stack

> An AI-powered Product Operations showcase — built to demonstrate how a modern PM workflow (PRDs, market research, and rapid prototyping) can be automated end-to-end using LLMs and a thin, well-designed app layer.

**Live app:** https://ai-product-stack.lovable.app

---

## Why this exists

I'm a Product Manager. Most of my week is spent doing three things over and over:

1. Writing **PRDs** from a fuzzy idea
2. Doing **market & competitive research**
3. Spinning up **quick prototypes** to align stakeholders

This app does all three in seconds, the way I'd actually want them done.

It's also a personal demonstration that a PM can ship a real, full-stack, AI-native product without an engineering team — built on Lovable with a clear point of view on how AI should plug into product workflows.

---

## What it does

| Module | What it generates | Powered by |
|---|---|---|
| **PRD Generator** | A structured, opinionated PRD from a one-line idea | Gemini 2.5 Pro via Lovable AI Gateway |
| **Market Research** | A cited market overview brief (TAM, trends, competitors, pain points, recommendations) | Tavily search + Gemini 2.5 Flash |
| **Prototype Generator** | A polished HTML, React, or wireframe mockup of the idea | Gemini 2.5 Pro / Gemini image model |
| **Shareable links** | Every PRD gets a public `/p/:id` link | Lovable Cloud (Postgres + RLS) |

---

## Tech stack

- **Framework:** TanStack Start v1 (React 19, SSR, file-based routing)
- **Build:** Vite 7
- **Styling:** Tailwind CSS v4 with semantic design tokens
- **Backend:** Lovable Cloud (managed Postgres, auth, storage)
- **Server logic:** TanStack `createServerFn` running on Cloudflare Workers
- **AI:** Lovable AI Gateway (Gemini 2.5 Pro / Flash / Image)
- **Search:** Tavily API
- **Hosting:** 100% on Lovable — no external infra

---

## Architecture

```
Browser
  │
  ▼
TanStack Start (SSR on Cloudflare Workers)
  │
  ├── Server Functions  ──►  Lovable AI Gateway  ──►  Gemini
  │                     ──►  Tavily (research)
  │
  └── Lovable Cloud (Postgres + RLS + Auth)
```

All server-side logic lives in `src/lib/*.functions.ts` as typed RPC. No edge functions, no separate backend service.

---

## Running locally

This project is built and hosted on Lovable. To work on it locally:

1. Connect the project to GitHub (Lovable editor → **+** → **GitHub**)
2. Clone the repo
3. `bun install`
4. Copy the env vars Lovable provides into `.env`
5. `bun run dev`

---

## Credits & ownership

Registered to **Sachin Kumar Sharma**. Made with Lovable.

- Conceived, designed, and shipped independently
- Made entirely on **Lovable**
- Hosted entirely on **Lovable Cloud** — not affiliated with any employer or third-party IP
- All source code in this repo is independent work

© 2026 Sachin Kumar Sharma
