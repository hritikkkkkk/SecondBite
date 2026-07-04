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
              ? "Your Copilot is analyzing yesterday's operations…"
              : brief?.headline ?? "Ready when you are."}
          </p>
          {briefError && !brief && (
            <p className="mt-1 text-xs text-destructive">{briefError}</p>
          )}
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
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-700">
              <Sparkles className="h-3 w-3" />
              What should I do today?
            </div>
            <h2 className="mt-1 text-xl font-semibold">AI-generated action queue</h2>
          </div>
          <span className="text-xs text-muted-foreground">Prioritized by revenue impact</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {briefLoading
            ? Array.from({ length: 3 }).map((_, i) => <ActionSkeleton key={i} />)
            : (brief?.actions ?? []).map((a, i) => <ActionCard key={i} index={i + 1} {...a} />)}
        </div>
        {!briefLoading && (brief?.actions?.length ?? 0) === 0 && (
          <EmptyPanel text="No actions surfaced right now — your Copilot will queue new ones as data changes." />
        )}
      </section>

      {/* Forecast + Risks */}
      <section className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Today's Forecast
          </div>
          {briefLoading || !brief ? (
            <div className="mt-4 space-y-3">
              <div className="h-12 animate-pulse rounded-lg bg-secondary" />
              <div className="h-24 animate-pulse rounded-lg bg-secondary" />
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-3 gap-6">
                <ForecastStat label="Expected covers" value={brief.forecast.expectedCovers.toLocaleString("en-IN")} />
                <ForecastStat label="Expected revenue" value={`₹${brief.forecast.expectedRevenueInr.toLocaleString("en-IN")}`} />
                <ForecastStat label="Peak window" value={brief.forecast.peakWindow} icon={<Clock className="h-3 w-3" />} />
              </div>
              <div className="mt-6">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Model confidence</span>
                  <span className="font-mono">{brief.forecast.confidence}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full gradient-amber transition-all duration-700" style={{ width: `${brief.forecast.confidence}%` }} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            Proactive Risk Alerts
          </div>
          <div className="mt-4 space-y-2.5">
            {briefLoading || !brief
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary" />)
              : (brief.risks ?? []).map((r, i) => <RiskItem key={i} {...r} />)}
          </div>
          {!briefLoading && brief && (brief.risks?.length ?? 0) === 0 && (
            <EmptyPanel text="No risks flagged. All green across kitchen, staff, and inventory." />
          )}
        </div>
      </section>

      {/* Modules teaser */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your AI operators</h2>
          <span className="text-xs text-muted-foreground">3 live · 8 rolling out</span>
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
  const color = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className={`text-xs font-medium ${color}`}>{delta}</span>
      </div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-secondary" />
    </div>
  );
}

function ActionCard({ index, title, why, impact, effort, confidence }: { index: number; title: string; why: string; impact: string; effort: "low" | "medium" | "high"; confidence: number }) {
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
          <button className="ml-auto rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background transition hover:opacity-90">Approve</button>
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
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-secondary" />
    </div>
  );
}

function ForecastStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground">{icon}{label}</div>
      <div className="mt-1.5 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function RiskItem({ title, detail, severity }: { title: string; detail: string; severity: "low" | "medium" | "high" }) {
  const dot = severity === "high" ? "bg-rose-500" : severity === "medium" ? "bg-amber-500" : "bg-muted-foreground";
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background p-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{detail}</div>
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
