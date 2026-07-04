import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BriefSchema = z.object({
  greeting: z.string(),
  headline: z.string(),
  metrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
    delta: z.string(),
    trend: z.enum(["up", "down", "flat"]),
  })),
  forecast: z.object({
    expectedCovers: z.number(),
    expectedRevenueInr: z.number(),
    peakWindow: z.string(),
    confidence: z.number(),
  }),
  risks: z.array(z.object({
    title: z.string(),
    detail: z.string(),
    severity: z.enum(["low", "medium", "high"]),
  })),
  actions: z.array(z.object({
    title: z.string(),
    why: z.string(),
    impact: z.string(),
    effort: z.enum(["low", "medium", "high"]),
    confidence: z.number(),
  })),
});

export type DailyBrief = z.infer<typeof BriefSchema>;

function fallbackBrief(owner: string, restaurant: string, dayPart: string): DailyBrief {
  return {
    greeting: `Good ${dayPart}, ${owner}.`,
    headline: `Here's what needs your attention at ${restaurant} today.`,
    metrics: [
      { label: "Revenue (yesterday)", value: "₹94,000", delta: "↑ 8%", trend: "up" },
      { label: "Guest Satisfaction", value: "4.3 / 5", delta: "↑ 0.2", trend: "up" },
      { label: "Kitchen Speed", value: "14 min", delta: "↓ 1m", trend: "up" },
      { label: "Staff Performance", value: "92%", delta: "flat", trend: "flat" },
    ],
    forecast: { expectedCovers: 420, expectedRevenueInr: 108000, peakWindow: "7:30–9:30 PM", confidence: 82 },
    risks: [
      { title: "Paneer stock low", detail: "1.2 days remaining — reorder before Friday.", severity: "high" },
      { title: "Friday FoH understaffed", detail: "2 servers short for expected 460 covers.", severity: "medium" },
      { title: "Butter Chicken sweetness complaints", detail: "3 mentions this week — check batch recipe.", severity: "medium" },
    ],
    actions: [
      { title: "Reorder paneer & tomato today", why: "Both under 1.5 days of cover.", impact: "Avoid ₹18k lost revenue", effort: "low", confidence: 90 },
      { title: "Call 1 extra server for Friday dinner", why: "Forecast: 460 covers, current staff = 3.", impact: "Protect rating & ticket time", effort: "low", confidence: 85 },
      { title: "Retune Butter Chicken sweetness", why: "3 negative mentions this week.", impact: "+0.2 rating in 14 days", effort: "medium", confidence: 75 },
    ],
  };
}

export const generateDailyBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ ownerName: z.string().optional(), restaurantName: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<DailyBrief> => {
    const owner = data.ownerName ?? "there";
    const restaurant = data.restaurantName ?? "your restaurant";
    const hourIST = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours();
    const dayPart = hourIST < 12 ? "morning" : hourIST < 17 ? "afternoon" : "evening";

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return fallbackBrief(owner, restaurant, dayPart);
    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        output: Output.object({ schema: BriefSchema }),
        prompt: `Generate today's AI Executive Brief for a 68-cover North Indian restaurant "${restaurant}" in India.
Owner first name: ${owner}. Time of day: ${dayPart} IST.

Realistic context:
- Yesterday: ~180 covers, ₹94,000 revenue, avg rating 4.3, kitchen ticket 14m.
- Trailing 7d: revenue ₹6.4L (+8% WoW), Zomato/Swiggy 34% of orders.
- Known issues: paneer 1.2-day stock, tomato 0.8-day, Butter Chicken sweetness complaints, Friday FoH understaffed.
- Today expected: 380–460 covers, peak 7–9:30 PM.

Rules:
- greeting: "Good ${dayPart}, ${owner}."
- headline: one crisp sentence.
- metrics: exactly 4 — Revenue (yesterday), Guest Satisfaction, Kitchen Speed, Staff Performance. Delta like "↑ 12%".
- forecast.confidence: 70–90.
- risks: 3 to 5 concrete operational risks with severity.
- actions: 3 to 4 concrete owner actions today, with why, impact (₹/rating/time), effort, confidence 60–95.
Amounts in ₹. Be specific and quantitative.`,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          return BriefSchema.parse(JSON.parse(error.text ?? ""));
        } catch {
          return fallbackBrief(owner, restaurant, dayPart);
        }
      }
      return fallbackBrief(owner, restaurant, dayPart);
    }
  });
