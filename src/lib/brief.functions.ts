import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
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
  })).length(4),
  forecast: z.object({
    expectedCovers: z.number(),
    expectedRevenueInr: z.number(),
    peakWindow: z.string(),
    confidence: z.number().min(0).max(100),
  }),
  risks: z.array(z.object({
    title: z.string(),
    detail: z.string(),
    severity: z.enum(["low", "medium", "high"]),
  })).min(3).max(5),
  actions: z.array(z.object({
    title: z.string(),
    why: z.string(),
    impact: z.string(),
    effort: z.enum(["low", "medium", "high"]),
    confidence: z.number().min(0).max(100),
  })).min(3).max(4),
});

export type DailyBrief = z.infer<typeof BriefSchema>;

export const generateDailyBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ ownerName: z.string().optional(), restaurantName: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<DailyBrief> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const owner = data.ownerName ?? "there";
    const restaurant = data.restaurantName ?? "your restaurant";
    const hourIST = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours();
    const dayPart = hourIST < 12 ? "Morning" : hourIST < 17 ? "Afternoon" : "Evening";

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: BriefSchema }),
      prompt: `Generate today's AI Executive Brief for a 68-cover North Indian restaurant "${restaurant}" in India.
Owner first name: ${owner}. Time of day: ${dayPart} IST.

Use realistic Indian restaurant operations context:
- Yesterday: ~180 covers, ₹94,000 revenue, avg rating 4.3, kitchen ticket 14m.
- Trailing 7d: revenue ₹6.4L (+8% WoW), Zomato/Swiggy 34% of orders.
- Known issues: paneer 1.2-day stock, tomato 0.8-day, Butter Chicken sweetness complaints, Friday FoH understaffed.
- Today is expected: 380–460 covers, peak 7–9:30 PM.

Rules:
- greeting: "Good ${dayPart}, ${owner}."
- headline: one crisp sentence summarizing today's most important thing.
- metrics: exactly 4 — Revenue (yesterday), Guest Satisfaction, Kitchen Speed, Staff Performance. Include delta like "↑ 12%" or "↓ 9%".
- forecast: today's expectations with confidence 70–90.
- risks: 3–5 concrete operational risks, each with severity.
- actions: 3–4 concrete actions owner should do TODAY, each with why, expected impact (revenue/rating/time), effort, confidence.
Amounts in ₹. Be specific, quantitative, non-generic.`,
    });

    return output;
  });
