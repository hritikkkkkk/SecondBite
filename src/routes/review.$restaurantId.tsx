import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarSelector } from "@/components/StarSelector";
import { generateRewardCode } from "@/lib/auth";

export const Route = createFileRoute("/review/$restaurantId")({
  head: () => ({ meta: [{ title: "Share your experience — SecondBite" }] }),
  component: ReviewPage,
});

const ALL_TAGS = [
  "Cosy", "Quick service", "Worth it", "Loud", "Cold food",
  "Friendly staff", "Slow service", "Great cocktails", "Pricey",
];

function ReviewPage() {
  const { restaurantId } = Route.useParams();
  const [restaurant, setRestaurant] = useState<{ name: string; cuisine: string | null; reward_text: string | null } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [food, setFood] = useState(0);
  const [service, setService] = useState(0);
  const [ambience, setAmbience] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("restaurants")
      .select("id, name, cuisine, reward_text")
      .eq("slug", restaurantId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setRestaurant({ name: data.name, cuisine: data.cuisine, reward_text: data.reward_text });
      });
  }, [restaurantId]);

  async function submit() {
    if (!food || !service || !ambience) {
      setError("Please rate all three categories.");
      return;
    }
    setError(null);
    setSubmitting(true);
    // Look up restaurant id (uuid) from slug
    const { data: r } = await supabase.from("restaurants").select("id, reward_text").eq("slug", restaurantId).maybeSingle();
    if (!r) { setSubmitting(false); setError("Restaurant not found."); return; }
    const code = generateRewardCode();
    const { error } = await supabase.from("reviews").insert({
      restaurant_id: r.id,
      rating_food: food,
      rating_service: service,
      rating_ambience: ambience,
      tags,
      comment: comment.trim() || null,
      reward_code: code,
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setReward(code);
  }

  if (notFound) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl">Restaurant not found</h1>
          <p className="mt-2 text-muted-foreground">Double-check the link on your bill.</p>
        </div>
      </div>
    );
  }

  if (reward) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto max-w-md px-6 pt-16 text-center">
          <div className="animate-pulse-glow mx-auto grid h-20 w-20 place-items-center rounded-full gradient-amber">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-ink" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-8 font-display text-4xl tracking-tight">Thank you.</h1>
          <p className="mt-2 text-muted-foreground">Your feedback helps {restaurant?.name} get better.</p>
          <div className="mt-10 rounded-2xl border border-border bg-card p-6 amber-glow">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Your reward</div>
            <div className="mt-3 font-display text-4xl font-medium tracking-wider">{reward}</div>
            <div className="mt-3 text-sm text-foreground">{restaurant?.reward_text ?? "Show this on your next visit."}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="mx-auto max-w-md px-6 pt-10">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">SecondBite</div>
          <h1 className="mt-2 font-display text-3xl tracking-tight">{restaurant?.name ?? "Loading…"}</h1>
          {restaurant?.cuisine && <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>}
        </div>

        <div className="mt-10 space-y-6 rounded-2xl border border-border bg-card p-6">
          <StarSelector label="Food" value={food} onChange={setFood} />
          <StarSelector label="Service" value={service} onChange={setService} />
          <StarSelector label="Ambience" value={ambience} onChange={setAmbience} />

          <div>
            <div className="mb-2 text-sm font-medium">Anything stand out?</div>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTags((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      on
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:bg-secondary"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Leave a note (optional)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Tell us about your evening…"
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground focus:ring-2 focus:ring-[oklch(0.78_0.18_70/0.3)]"
            />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            disabled={submitting}
            onClick={submit}
            className="w-full rounded-xl bg-foreground py-3.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Submit & claim reward"}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            Anonymous by default · Takes under a minute
          </p>
        </div>
      </div>
    </div>
  );
}
