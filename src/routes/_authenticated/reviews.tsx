import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { summarizeReviews, type ReviewsIntel } from "@/lib/reviews-intel.functions";
import { AlertTriangle, Sparkles, Star, TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({ meta: [{ title: "Review Intelligence — SecondBite AI" }] }),
  component: ReviewsPage,
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

function ReviewsPage() {
  const runIntel = useServerFn(summarizeReviews);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [intel, setIntel] = useState<ReviewsIntel | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: rs } = await supabase
        .from("restaurants")
        .select("id, slug")
        .eq("owner_id", u.user.id)
        .limit(1);
      if (!rs?.[0]) { setLoading(false); return; }
      if (alive) setSlug(rs[0].slug);
      const { data: rv } = await supabase
        .from("reviews")
        .select("*")
        .eq("restaurant_id", rs[0].id)
        .order("created_at", { ascending: false })
        .limit(50);
      const list = (rv as Review[]) ?? [];
      if (!alive) return;
      setReviews(list);
      try {
        const i = await runIntel({
          data: {
            reviews: list.map((r) => ({
              rating_food: r.rating_food,
              rating_service: r.rating_service,
              rating_ambience: r.rating_ambience,
              tags: r.tags,
              comment: r.comment,
              created_at: r.created_at,
            })),
          },
        });
        if (alive) setIntel(i);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [runIntel]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating_food + r.rating_service + r.rating_ambience) / 3, 0) / reviews.length
    : 0;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400/80">
          <Sparkles className="h-3 w-3" />
          Review Intelligence · AI-analyzed
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Guest sentiment, decoded.</h1>
        <p className="mt-1 text-sm text-white/60">
          Every review is clustered, summarized, and turned into an action.
          {slug && <> Feedback link: <code className="ml-1 rounded bg-white/5 px-1.5 py-0.5 text-white/70">/review/{slug}</code></>}
        </p>
      </div>

      {/* Header stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Sentiment Score" value={loading ? "…" : `${intel?.sentimentScore ?? 0}`} suffix="/ 100" accent />
        <StatCard label="Reviews Analyzed" value={String(reviews.length)} />
        <StatCard label="Avg Rating" value={reviews.length ? avg.toFixed(1) : "—"} suffix="/ 5" />
        <StatCard label="AI Verdict" value={intel?.sentimentLabel ?? "…"} />
      </div>

      {/* AI summary block */}
      <div className="mt-6 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.06] to-transparent p-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-300">
          <Sparkles className="h-3 w-3" /> AI Executive Summary
        </div>
        <p className="mt-3 text-base leading-relaxed text-white/90">
          {loading ? <span className="animate-pulse text-white/40">Analyzing sentiment, extracting themes, generating recommendations…</span> : intel?.summary}
        </p>
      </div>

      {intel && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <IntelList icon={<ThumbsUp className="h-3 w-3" />} label="Guests love" items={intel.topPraise} tone="positive" />
          <IntelList icon={<ThumbsDown className="h-3 w-3" />} label="Recurring complaints" items={intel.topComplaints} tone="negative" />
          <IntelList icon={<TrendingUp className="h-3 w-3" />} label="Emerging themes" items={intel.emergingThemes} tone="neutral" />
          <IntelList icon={<AlertTriangle className="h-3 w-3" />} label="Urgent issues" items={intel.urgentIssues} tone="urgent" />
        </div>
      )}

      {intel && intel.recommendedActions.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/50">Recommended Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {intel.recommendedActions.map((a, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="text-sm font-semibold">{a.title}</div>
                <div className="mt-1 text-xs text-white/60">{a.impact}</div>
                <button className="mt-3 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white hover:bg-white/15">Approve action</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/50">Raw feedback stream</h2>
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/50">
            No reviews yet. Share your QR link to start collecting.
          </div>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-white">
                        {((r.rating_food + r.rating_service + r.rating_ambience) / 3).toFixed(1)}
                      </span>
                      · F {r.rating_food} · S {r.rating_service} · A {r.rating_ambience}
                      <span className="ml-2">{new Date(r.created_at).toLocaleString("en-IN")}</span>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-white/80">{r.comment}</p>}
                    {r.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.tags.map((t) => (
                          <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-white/40">{r.reward_code}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-amber-400/20 bg-amber-400/[0.04]" : "border-white/5 bg-white/[0.02]"}`}>
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{value}</span>
        {suffix && <span className="text-xs text-white/40">{suffix}</span>}
      </div>
    </div>
  );
}

function IntelList({ icon, label, items, tone }: { icon: React.ReactNode; label: string; items: string[]; tone: "positive" | "negative" | "neutral" | "urgent" }) {
  const dot = {
    positive: "bg-emerald-400",
    negative: "bg-rose-400",
    neutral: "bg-white/40",
    urgent: "bg-amber-400",
  }[tone];
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
        {icon} {label}
      </div>
      {items.length === 0 ? (
        <div className="mt-3 text-xs text-white/30">None detected.</div>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-white/80">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
