import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SecondBite" }] }),
  component: DashboardPage,
});

type Review = {
  id: string;
  rating_food: number;
  rating_service: number;
  rating_ambience: number;
  tags: string[];
  comment: string | null;
  reward_code: string;
  reward_redeemed: boolean;
  created_at: string;
};

type Restaurant = {
  id: string;
  slug: string;
  name: string;
  cuisine: string | null;
};

function DashboardPage() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: rs } = await supabase
        .from("restaurants")
        .select("id, slug, name, cuisine")
        .eq("owner_id", u.user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      if (!active) return;
      if (!rs || rs.length === 0) {
        setHasOnboarded(false);
        setLoading(false);
        return;
      }
      const rest = rs[0];
      setRestaurant(rest);
      const { data: rv } = await supabase
        .from("reviews")
        .select("*")
        .eq("restaurant_id", rest.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!active) return;
      setReviews((rv as Review[]) ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = (k: keyof Review) =>
      total ? reviews.reduce((a, r) => a + (r[k] as number), 0) / total : 0;
    const today = reviews.filter(
      (r) => new Date(r.created_at).toDateString() === new Date().toDateString(),
    ).length;
    const redeemed = reviews.filter((r) => r.reward_redeemed).length;
    const overall = total ? (avg("rating_food") + avg("rating_service") + avg("rating_ambience")) / 3 : 0;
    return {
      total, today, redeemed, overall,
      food: avg("rating_food"),
      service: avg("rating_service"),
      ambience: avg("rating_ambience"),
    };
  }, [reviews]);

  if (!hasOnboarded) {
    return (
      <DashShell restaurant={null}>
        <div className="grid place-items-center py-20">
          <div className="max-w-md text-center">
            <h2 className="font-display text-3xl">Finish setting up your venue</h2>
            <p className="mt-2 text-muted-foreground">We need a few details before your dashboard goes live.</p>
            <button
              onClick={() => navigate({ to: "/signup" })}
              className="mt-6 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
            >
              Complete onboarding
            </button>
          </div>
        </div>
      </DashShell>
    );
  }

  return (
    <DashShell restaurant={restaurant}>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">Tonight at a glance</h1>
        <p className="text-sm text-muted-foreground">Live signals from your guests, refreshed in real time.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall rating" value={stats.overall.toFixed(1)} suffix="/ 5" accent />
        <StatCard label="Reviews total" value={String(stats.total)} />
        <StatCard label="Reviews today" value={String(stats.today)} />
        <StatCard label="Rewards redeemed" value={String(stats.redeemed)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg">Category averages</h3>
            <span className="text-xs text-muted-foreground">All time</span>
          </div>
          <CategoryBars food={stats.food} service={stats.service} ambience={stats.ambience} />
        </div>

        <div className="rounded-2xl border border-[oklch(0.78_0.18_70/0.5)] bg-[oklch(0.99_0.02_75)] p-6 amber-glow">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full gradient-amber text-[10px] font-bold text-ink">AI</span>
            <h3 className="font-display text-lg">Insight</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            {aiInsight(stats, reviews)}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="font-display text-xl">Latest feedback</h3>
        <div className="mt-4 space-y-3">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!loading && reviews.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-display text-lg">No reviews yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Share your QR link to start collecting:
              </p>
              {restaurant && (
                <a
                  href={`/review/${restaurant.slug}`}
                  target="_blank"
                  className="mt-3 inline-block rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background"
                >
                  Open my review page →
                </a>
              )}
            </div>
          )}
          {reviews.slice(0, 8).map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </div>
      </div>
    </DashShell>
  );
}

function DashShell({ restaurant, children }: { restaurant: Restaurant | null; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded gradient-amber text-xs font-bold text-ink">S</div>
              <span className="font-display text-lg font-semibold">SecondBite</span>
            </Link>
            {restaurant && (
              <>
                <span className="text-border">/</span>
                <span className="text-sm text-muted-foreground">{restaurant.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {restaurant && (
              <a
                href={`/review/${restaurant.slug}`}
                target="_blank"
                className="hidden rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground sm:inline"
              >
                /review/{restaurant.slug}
              </a>
            )}
            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

function StatCard({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-[oklch(0.78_0.18_70/0.5)] bg-[oklch(0.99_0.02_75)]" : "border-border bg-card"}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-4xl font-medium">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function CategoryBars({ food, service, ambience }: { food: number; service: number; ambience: number }) {
  const rows = [
    ["Food", food],
    ["Service", service],
    ["Ambience", ambience],
  ] as const;
  return (
    <div className="space-y-4">
      {rows.map(([label, v]) => (
        <div key={label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span>{label}</span>
            <span className="font-mono text-muted-foreground">{v.toFixed(1)} / 5</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full gradient-amber transition-all duration-700"
              style={{ width: `${(v / 5) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const avg = ((review.rating_food + review.rating_service + review.rating_ambience) / 3).toFixed(1);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base">{avg} ★</span>
            <span className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleString()}
            </span>
          </div>
          {review.comment && <p className="mt-1 text-sm">{review.comment}</p>}
          {review.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {review.tags.map((t) => (
                <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="font-mono text-xs text-muted-foreground">{review.reward_code}</div>
          <div className={`text-[11px] ${review.reward_redeemed ? "text-[oklch(0.55_0.15_145)]" : "text-muted-foreground"}`}>
            {review.reward_redeemed ? "Redeemed" : "Active"}
          </div>
        </div>
      </div>
    </div>
  );
}

function aiInsight(stats: { food: number; service: number; ambience: number; total: number }, reviews: Review[]): string {
  if (stats.total === 0) {
    return "Once you collect a handful of reviews, AI-generated insights will appear here — flagging dishes guests love, service patterns to watch, and concrete suggestions to lift your next shift.";
  }
  const lowest = (["food", "service", "ambience"] as const).reduce((a, b) => (stats[a] <= stats[b] ? a : b));
  const tagCounts: Record<string, number> = {};
  reviews.forEach((r) => r.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; }));
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  return `Your ${lowest} score (${stats[lowest].toFixed(1)}) is your biggest lever right now. ${
    topTag ? `Guests keep mentioning "${topTag}" — lean into it on social and your menu.` : ""
  } Consider adding a second runner during peak covers to lift service speed without touching food cost.`;
}
