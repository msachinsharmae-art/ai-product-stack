import { createFileRoute, Link } from "@tanstack/react-router";
import { getBrief } from "@/lib/radar.functions";
import { BriefCard } from "./radar";

export const Route = createFileRoute("/radar/$id")({
  loader: ({ params }) => getBrief({ data: { id: params.id } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — Competitor Radar` : "Competitor Brief" },
      { name: "description", content: loaderData?.brief.headline ?? "Daily competitor intelligence brief." },
    ],
  }),
  component: BriefDetail,
});

function BriefDetail() {
  const data = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-black">S</div>
            <span className="text-sm font-semibold tracking-tight">AI Product Ops Stack</span>
          </Link>
          <Link to="/radar" className="text-sm text-white/60 hover:text-white">← All briefs</Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <BriefCard brief={data.brief} title={data.title} createdAt={data.createdAt} signalCount={data.signalCount} />
      </section>
    </div>
  );
}
