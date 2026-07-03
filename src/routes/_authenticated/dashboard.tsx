import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateDailyBrief, type DailyBrief } from "@/lib/brief.functions";
import { ArrowUpRight, Brain, MessageSquare, Star, TrendingUp, AlertTriangle, Sparkles, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Executive Brief — SecondBite AI" }] }),
  component: DashboardPage,
});

type Restaurant = { id: string; slug: string; name: string };

function DashboardPage() {
  const navigate = useNavigate();
  const runBrief = useServerFn(generateDailyBrief);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(true);
  const [ownerName, setOwnerName] = useState<string>("");
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const meta = (u.user.user_metadata ?? {}) as { full_name?: string };
      const first = (meta.full_name ?? u.user.email ?? "there").split(" ")[0].split("@")[0];
      if (alive) setOwnerName(first);

      const { data: rs } = await supabase
        .from("restaurants")
        .select("id, slug, name")
        .eq("owner_id", u.user.id)
        .limit(1);
      if (!alive) return;
      if (!rs || rs.length === 0) {
        setHasOnboarded(false);
        setBriefLoading(false);
        return;
      }
      setRestaurant(rs[0]);

      try {
        const b = await runBrief({ data: { ownerName: first, restaurantName: rs[0].name } });
        if (alive) setBrief(b);
      } catch (e) {
        if (alive) setBriefError(e instanceof Error ? e.message : "Brief unavailable");
      } finally {
        if (alive) setBriefLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [runBrief]);

  if (!hasOnboarded) {
    return (
      <main className="mx-auto flex max-w-5xl flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-black">
            <Brain className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Finish onboarding your venue</h2>
          <p className="mt-2 text-sm text-white/60">
            Your AI Copilot needs a workspace before it can start running your restaurant.
          </p>
          <button
            onClick={() => navigate({ to: "/signup" })}
            className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black"
          >
            Complete onboarding
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI Executive Brief · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {brief?.greeting ?? (ownerName ? `Good day, ${ownerName}.` : "Good day.")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-white/60">
            {briefLoading ? (
              <ShimmerLine text="Your Copilot is analyzing yesterday's operations…" />
            ) : (
              brief?.headline ?? briefError ?? "Ready when you are."
            )}
          </p>
        </div>
        <Link
          to="/copilot"
          className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/[0.06] md:inline-flex"
        >
          <Brain className="h-3.5 w-3.5" />
          Ask Copilot
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {briefLoading
          ? Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
          : brief?.metrics.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* What should I do today */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400/80">
              <Sparkles className="h-3 w-3" />
              What should I do today?
            </div>
            <h2 className="mt-1 text-xl font-semibold">AI-generated action queue</h2>
          </div>
          <span className="text-xs text-white/40">Prioritized by revenue impact</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {briefLoading
            ? Array.from({ length: 3 }).map((_, i) => <ActionSkeleton key={i} />)
            : brief?.actions.map((a, i) => <ActionCard key={i} index={i + 1} {...a} />)}
        </div>
      </section>

      {/* Forecast + Risks */}
      <section className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
            <TrendingUp className="h-3 w-3" />
            Today's Forecast
          </div>
          {briefLoading || !brief ? (
            <div className="mt-4 space-y-3">
              <div className="h-12 animate-pulse rounded-lg bg-white/5" />
              <div className="h-24 animate-pulse rounded-lg bg-white/5" />
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-3 gap-6">
                <ForecastStat label="Expected covers" value={brief.forecast.expectedCovers.toLocaleString("en-IN")} />
                <ForecastStat label="Expected revenue" value={`₹${brief.forecast.expectedRevenueInr.toLocaleString("en-IN")}`} />
                <ForecastStat label="Peak window" value={brief.forecast.peakWindow} icon={<Clock className="h-3 w-3" />} />
              </div>
              <div className="mt-6">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/50">
                  <span>Model confidence</span>
                  <span className="font-mono">{brief.forecast.confidence}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700" style={{ width: `${brief.forecast.confidence}%` }} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40">
            <AlertTriangle className="h-3 w-3" />
            Proactive Risk Alerts
          </div>
          <div className="mt-4 space-y-2.5">
            {briefLoading || !brief
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />)
              : brief.risks.map((r, i) => <RiskItem key={i} {...r} />)}
          </div>
        </div>
      </section>

      {/* Modules teaser */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your AI operators</h2>
          <span className="text-xs text-white/40">3 live · 8 rolling out</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard to="/copilot" icon={<Brain />} title="Restaurant Copilot" desc="Ask anything about your restaurant. Trained on your data." live />
          <ModuleCard to="/reviews" icon={<Star />} title="Review Intelligence" desc="AI-summarized sentiment, themes, and reply drafts." live />
          {restaurant && (
            <ModuleCard to="/reviews" icon={<MessageSquare />} title="Feedback Channel" desc={`/review/${restaurant.slug}`} live />
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, delta, trend }: { label: string; value: string; delta: string; trend: "up" | "down" | "flat" }) {
  const color = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-white/60";
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="text-[11px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className={`text-xs font-medium ${color}`}>{delta}</span>
      </div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-white/5" />
    </div>
  );
}

function ActionCard({ index, title, why, impact, effort, confidence }: { index: number; title: string; why: string; impact: string; effort: "low" | "medium" | "high"; confidence: number }) {
  const effortColor = effort === "low" ? "bg-emerald-500/10 text-emerald-300" : effort === "medium" ? "bg-amber-500/10 text-amber-300" : "bg-rose-500/10 text-rose-300";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 transition hover:border-amber-400/30">
      <div className="absolute -right-4 -top-4 text-[80px] font-bold leading-none text-white/[0.03]">{String(index).padStart(2, "0")}</div>
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400/70">
          <Sparkles className="h-2.5 w-2.5" />
          Action · {confidence}% confidence
        </div>
        <h3 className="mt-2 text-base font-semibold leading-snug">{title}</h3>
        <p className="mt-1.5 text-sm text-white/60">{why}</p>
        <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/70">{impact}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${effortColor}`}>{effort} effort</span>
          <button className="ml-auto rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-white/15">Approve</button>
        </div>
      </div>
    </div>
  );
}

function ActionSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-white/5" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-white/5" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/5" />
    </div>
  );
}

function ForecastStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-white/40">{icon}{label}</div>
      <div className="mt-1.5 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function RiskItem({ title, detail, severity }: { title: string; detail: string; severity: "low" | "medium" | "high" }) {
  const dot = severity === "high" ? "bg-rose-400" : severity === "medium" ? "bg-amber-400" : "bg-white/40";
  return (
    <div className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-white/50">{detail}</div>
      </div>
    </div>
  );
}

function ModuleCard({ to, icon, title, desc, live }: { to: string; icon: React.ReactNode; title: string; desc: string; live?: boolean }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/10 text-amber-300 [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold">{title}</div>
          {live && <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">LIVE</span>}
        </div>
        <div className="mt-0.5 truncate text-xs text-white/50">{desc}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:text-white" />
    </Link>
  );
}

function ShimmerLine({ text }: { text: string }) {
  return (
    <span className="inline-block bg-gradient-to-r from-white/30 via-white/80 to-white/30 bg-[length:200%_100%] bg-clip-text text-transparent [animation:shimmer_2.5s_linear_infinite]" style={{ backgroundPositionX: "200%" }}>
      {text}
    </span>
  );
}
