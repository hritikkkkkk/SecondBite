import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  generateDailyBrief,
  getRestaurantMetrics,
  type DailyBrief,
  type RestaurantMetrics,
} from "@/lib/brief.functions";
import { ArrowUpRight, Brain, MessageSquare, Star, Sparkles, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Executive Brief — SecondBite AI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const loadMetrics = useServerFn(getRestaurantMetrics);
  const runBrief = useServerFn(generateDailyBrief);

  const [ownerName, setOwnerName] = useState<string>("");
  const [metrics, setMetrics] = useState<RestaurantMetrics | null>(null);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefLoading, setBriefLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const meta = (u.user.user_metadata ?? {}) as { full_name?: string };
      const first = (meta.full_name ?? u.user.email ?? "there").split(" ")[0].split("@")[0];
      if (alive) setOwnerName(first);

      try {
        const m = await loadMetrics();
        if (!alive) return;
        setMetrics(m);
        setLoading(false);

        if (!m.hasRestaurant) {
          setBriefLoading(false);
          return;
        }

        const summary = m.cards
          .map((c) => `- ${c.label}: ${c.value}${c.delta ? ` (${c.delta})` : ""} — ${c.sample}`)
          .join("\n");

        const b = await runBrief({
          data: {
            ownerName: first,
            restaurantName: m.restaurantName ?? undefined,
            metricsSummary: summary,
            hasReviews: m.totalReviews > 0,
          },
        });
        if (alive) setBrief(b);
      } finally {
        if (alive) {
          setLoading(false);
          setBriefLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [loadMetrics, runBrief]);

  if (!loading && metrics && !metrics.hasRestaurant) {
    return (
      <main className="mx-auto flex max-w-5xl flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl gradient-amber text-ink">
            <Brain className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Finish onboarding your venue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your AI Copilot needs a workspace before it can start running your restaurant.
          </p>
          <button
            onClick={() => navigate({ to: "/signup" })}
            className="mt-6 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
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
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            AI Executive Brief · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {brief?.greeting ?? (ownerName ? `Good day, ${ownerName}.` : "Good day.")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {briefLoading
              ? "Your Copilot is reading your latest reviews…"
              : brief?.headline ?? "Ready when you are."}
          </p>
        </div>
        <Link
          to="/copilot"
          className="hidden items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2 text-xs font-medium text-foreground transition hover:bg-secondary md:inline-flex"
        >
          <Brain className="h-3.5 w-3.5" />
          Ask Copilot
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Real metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !metrics
          ? Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
          : metrics.cards.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Sub-scores */}
      {metrics && metrics.totalReviews > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {metrics.subScores.map((s) => (
            <SubScoreBar key={s.label} label={s.label} value={s.value} sample={s.sample} />
          ))}
        </div>
      )}

      {/* Zero-review empty state */}
      {metrics && metrics.totalReviews === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-secondary/40 p-8 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <Star className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Awaiting your first reviews</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            All metrics on this page are computed from real guest reviews. Share your QR link at every table — the Copilot will start surfacing insights from the very first review.
          </p>
        </div>
      )}

      {/* Action queue */}
      {metrics && metrics.totalReviews > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-700">
                <Sparkles className="h-3 w-3" />
                What should I do today?
              </div>
              <h2 className="mt-1 text-xl font-semibold">AI action queue</h2>
            </div>
            <span className="text-xs text-muted-foreground">Grounded in your review data only</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {briefLoading
              ? Array.from({ length: 2 }).map((_, i) => <ActionSkeleton key={i} />)
              : (brief?.actions ?? []).map((a, i) => <ActionCard key={i} index={i + 1} {...a} />)}
          </div>
          {!briefLoading && (brief?.actions?.length ?? 0) === 0 && (
            <EmptyPanel text="No urgent actions right now — your review signal is steady." />
          )}
        </section>
      )}

      {/* Not-connected rail */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Not connected yet</h2>
          <span className="text-xs text-muted-foreground">Metrics unlock as you connect data sources</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <NotConnectedTile title="Revenue & covers" source="Connect POS" />
          <NotConnectedTile title="Kitchen speed" source="Connect KDS" />
          <NotConnectedTile title="Staff performance" source="Connect roster" />
        </div>
      </section>

      {/* Modules */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your AI operators</h2>
          <span className="text-xs text-muted-foreground">3 live · 8 rolling out</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard to="/copilot" icon={<Brain />} title="Restaurant Copilot" desc="Ask anything about your restaurant." live />
          <ModuleCard to="/reviews" icon={<Star />} title="Review Intelligence" desc="AI-summarized sentiment and themes." live />
          <ModuleCard to="/reviews" icon={<MessageSquare />} title="Feedback Channel" desc="Your public review QR link" live />
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, delta, trend, sample, empty }: {
  label: string; value: string; delta: string | null; trend: "up" | "down" | "flat"; sample: string; empty?: boolean;
}) {
  const color = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-semibold tracking-tight ${empty ? "text-muted-foreground" : ""}`}>{value}</span>
        {delta && <span className={`text-xs font-medium ${color}`}>{delta}</span>}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">{sample}</div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-secondary" />
      <div className="mt-3 h-2 w-20 animate-pulse rounded bg-secondary" />
    </div>
  );
}

function SubScoreBar({ label, value, sample }: { label: string; value: number | null; sample: number }) {
  const pct = value === null ? 0 : (value / 5) * 100;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-muted-foreground">{value === null ? "—" : value.toFixed(2)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full gradient-amber transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">{sample} reviews · 7d</div>
    </div>
  );
}

function ActionCard({ index, title, why, impact, effort, confidence }: {
  index: number; title: string; why: string; impact: string; effort: "low" | "medium" | "high"; confidence: number;
}) {
  const effortColor = effort === "low" ? "bg-emerald-100 text-emerald-800" : effort === "medium" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:border-amber-500/50">
      <div className="absolute -right-4 -top-4 text-[80px] font-bold leading-none text-foreground/[0.04]">{String(index).padStart(2, "0")}</div>
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-700">
          <Sparkles className="h-2.5 w-2.5" />
          Action · {confidence}% confidence
        </div>
        <h3 className="mt-2 text-base font-semibold leading-snug">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{why}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-foreground/80">{impact}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${effortColor}`}>{effort} effort</span>
        </div>
      </div>
    </div>
  );
}

function ActionSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-secondary" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-secondary" />
    </div>
  );
}

function NotConnectedTile({ title, source }: { title: string; source: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-secondary/30 p-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium text-muted-foreground">{title}</div>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">SOON</span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground/70">{source}</div>
      </div>
    </div>
  );
}

function ModuleCard({ to, icon, title, desc, live }: { to: string; icon: React.ReactNode; title: string; desc: string; live?: boolean }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-amber-500/40 hover:bg-secondary/60">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold">{title}</div>
          {live && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800">LIVE</span>}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
    </Link>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="mt-2 rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
      {text}
    </div>
  );
}
