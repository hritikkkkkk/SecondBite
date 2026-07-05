import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Real metrics computed from the reviews table ----------

export type MetricCard = {
  label: string;
  value: string;
  delta: string | null;
  trend: "up" | "down" | "flat";
  sample: string; // e.g. "based on 42 reviews"
  empty?: boolean;
};

export type RestaurantMetrics = {
  hasRestaurant: boolean;
  restaurantName: string | null;
  totalReviews: number;
  cards: MetricCard[];
  subScores: { label: string; value: number | null; sample: number }[];
  topComplaintTag: { tag: string; count: number } | null;
};

type ReviewRow = {
  rating_food: number;
  rating_service: number;
  rating_ambience: number;
  tags: string[] | null;
  reward_redeemed: boolean | null;
  created_at: string;
};

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pctDelta(curr: number | null, prev: number | null): { delta: string | null; trend: "up" | "down" | "flat" } {
  if (curr === null || prev === null || prev === 0) return { delta: null, trend: "flat" };
  const diff = ((curr - prev) / prev) * 100;
  if (Math.abs(diff) < 1) return { delta: "flat", trend: "flat" };
  const arrow = diff > 0 ? "↑" : "↓";
  return { delta: `${arrow} ${Math.abs(diff).toFixed(0)}%`, trend: diff > 0 ? "up" : "down" };
}

function absDelta(curr: number | null, prev: number | null, unit = ""): { delta: string | null; trend: "up" | "down" | "flat" } {
  if (curr === null || prev === null) return { delta: null, trend: "flat" };
  const diff = curr - prev;
  if (Math.abs(diff) < 0.05) return { delta: "flat", trend: "flat" };
  const arrow = diff > 0 ? "↑" : "↓";
  return { delta: `${arrow} ${Math.abs(diff).toFixed(2)}${unit}`, trend: diff > 0 ? "up" : "down" };
}

export const getRestaurantMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RestaurantMetrics> => {
    const { supabase, userId } = context;

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id, name")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();

    if (!restaurant) {
      return { hasRestaurant: false, restaurantName: null, totalReviews: 0, cards: [], subScores: [], topComplaintTag: null };
    }

    const { data: rows } = await supabase
      .from("reviews")
      .select("rating_food, rating_service, rating_ambience, tags, reward_redeemed, created_at")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(500);

    const reviews: ReviewRow[] = (rows ?? []) as ReviewRow[];
    const now = Date.now();
    const DAY = 86_400_000;

    const in7 = reviews.filter((r) => now - new Date(r.created_at).getTime() <= 7 * DAY);
    const prev7 = reviews.filter((r) => {
      const age = now - new Date(r.created_at).getTime();
      return age > 7 * DAY && age <= 14 * DAY;
    });
    const in30 = reviews.filter((r) => now - new Date(r.created_at).getTime() <= 30 * DAY);
    const prev30 = reviews.filter((r) => {
      const age = now - new Date(r.created_at).getTime();
      return age > 30 * DAY && age <= 60 * DAY;
    });
    const in14 = reviews.filter((r) => now - new Date(r.created_at).getTime() <= 14 * DAY);

    const overall = (r: ReviewRow) => (r.rating_food + r.rating_service + r.rating_ambience) / 3;
    const sat7 = avg(in7.map(overall));
    const satPrev = avg(prev7.map(overall));
    const satDelta = absDelta(sat7, satPrev);

    const cnt7 = in7.length;
    const cntPrev = prev7.length;
    const cntDelta = pctDelta(cnt7, cntPrev);

    const redeemed30 = in30.filter((r) => r.reward_redeemed).length;
    const redemption = in30.length > 0 ? (redeemed30 / in30.length) * 100 : null;
    const redemptionPrev = prev30.length > 0 ? (prev30.filter((r) => r.reward_redeemed).length / prev30.length) * 100 : null;
    const redDelta = absDelta(redemption, redemptionPrev, "pp");

    // Top complaint tag from reviews rated ≤3 overall, last 14d
    const complaints = in14.filter((r) => overall(r) <= 3);
    const tagCounts = new Map<string, number>();
    for (const r of complaints) for (const t of r.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    let topTag: { tag: string; count: number } | null = null;
    for (const [tag, count] of tagCounts) if (!topTag || count > topTag.count) topTag = { tag, count };

    const cards: MetricCard[] = [
      {
        label: "Guest Satisfaction (7d)",
        value: sat7 === null ? "—" : `${sat7.toFixed(2)} / 5`,
        delta: satDelta.delta,
        trend: satDelta.trend,
        sample: `based on ${in7.length} review${in7.length === 1 ? "" : "s"}`,
        empty: sat7 === null,
      },
      {
        label: "Reviews this week",
        value: `${cnt7}`,
        delta: cntDelta.delta,
        trend: cntDelta.trend,
        sample: `vs ${cntPrev} prior 7d`,
        empty: cnt7 === 0 && cntPrev === 0,
      },
      {
        label: "Reward Redemption (30d)",
        value: redemption === null ? "—" : `${redemption.toFixed(0)}%`,
        delta: redDelta.delta,
        trend: redDelta.trend,
        sample: `${redeemed30} of ${in30.length} redeemed`,
        empty: redemption === null,
      },
      {
        label: "Top Complaint (14d)",
        value: topTag ? topTag.tag : "None",
        delta: topTag ? `${topTag.count} mention${topTag.count === 1 ? "" : "s"}` : null,
        trend: "flat",
        sample: `${complaints.length} low-rated review${complaints.length === 1 ? "" : "s"}`,
        empty: complaints.length === 0,
      },
    ];

    const subScores = [
      { label: "Food", value: avg(in7.map((r) => r.rating_food)), sample: in7.length },
      { label: "Service", value: avg(in7.map((r) => r.rating_service)), sample: in7.length },
      { label: "Ambience", value: avg(in7.map((r) => r.rating_ambience)), sample: in7.length },
    ];

    return {
      hasRestaurant: true,
      restaurantName: restaurant.name,
      totalReviews: reviews.length,
      cards,
      subScores,
      topComplaintTag: topTag,
    };
  });

// ---------- AI headline + grounded action queue ----------

const BriefSchema = z.object({
  greeting: z.string(),
  headline: z.string(),
  actions: z.array(z.object({
    title: z.string(),
    why: z.string(),
    impact: z.string(),
    effort: z.enum(["low", "medium", "high"]),
    confidence: z.number(),
  })),
});

export type DailyBrief = z.infer<typeof BriefSchema>;

export const generateDailyBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      ownerName: z.string().optional(),
      restaurantName: z.string().optional(),
      metricsSummary: z.string(),
      hasReviews: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<DailyBrief> => {
    const owner = data.ownerName ?? "there";
    const hourIST = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours();
    const dayPart = hourIST < 12 ? "morning" : hourIST < 17 ? "afternoon" : "evening";
    const greeting = `Good ${dayPart}, ${owner}.`;

    const neutral: DailyBrief = {
      greeting,
      headline: data.hasReviews
        ? "Here's what your review signal says today."
        : "No reviews yet — share your QR to start collecting real signal.",
      actions: [],
    };

    const key = process.env.LOVABLE_API_KEY;
    if (!key || !data.hasReviews) return neutral;

    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        output: Output.object({ schema: BriefSchema }),
        prompt: `You are SecondBite AI's brief writer for the restaurant "${data.restaurantName ?? "the venue"}" in India.
Owner first name: ${owner}. Time of day: ${dayPart} IST.

You ONLY have review data. You have NO POS, NO revenue, NO inventory, NO staffing data. Do NOT invent any.

Real metrics computed from the reviews table:
${data.metricsSummary}

Rules:
- greeting: exactly "${greeting}".
- headline: one crisp sentence grounded in the metrics above. If satisfaction dropped, say so. If complaints cluster on a tag, name it. No fabricated numbers.
- actions: 2 to 4 concrete owner actions that ONLY use review data. Examples: reply to low-rated reviews, investigate a specific complaint tag, thank redeemed-reward guests. NEVER suggest inventory, staffing, revenue, marketing spend, or forecasts.
- Each action: title, why (cite the metric), impact (in rating points or review volume — NOT ₹), effort, confidence 60–95.`,
      });
      return { ...output, greeting };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          const parsed = BriefSchema.parse(JSON.parse(error.text ?? ""));
          return { ...parsed, greeting };
        } catch {
          return neutral;
        }
      }
      return neutral;
    }
  });
