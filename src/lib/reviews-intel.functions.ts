import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const IntelSchema = z.object({
  sentimentScore: z.number().min(0).max(100),
  sentimentLabel: z.enum(["Excellent", "Strong", "Mixed", "Weak", "Critical"]),
  summary: z.string(),
  topPraise: z.array(z.string()).max(4),
  topComplaints: z.array(z.string()).max(4),
  emergingThemes: z.array(z.string()).max(3),
  urgentIssues: z.array(z.string()).max(3),
  recommendedActions: z.array(z.object({
    title: z.string(),
    impact: z.string(),
  })).min(2).max(4),
});

export type ReviewsIntel = z.infer<typeof IntelSchema>;

export const summarizeReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      reviews: z.array(z.object({
        rating_food: z.number(),
        rating_service: z.number(),
        rating_ambience: z.number(),
        tags: z.array(z.string()),
        comment: z.string().nullable(),
        created_at: z.string(),
      })),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<ReviewsIntel> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const total = data.reviews.length;
    if (total === 0) {
      return {
        sentimentScore: 0,
        sentimentLabel: "Mixed",
        summary: "No reviews yet — share your QR link to start collecting signal for the AI to analyze.",
        topPraise: [],
        topComplaints: [],
        emergingThemes: [],
        urgentIssues: [],
        recommendedActions: [
          { title: "Print your QR at every table", impact: "Baseline collection → first insights within 20 reviews" },
        ],
      };
    }

    const sample = data.reviews.slice(0, 40).map((r, i) =>
      `#${i + 1} F${r.rating_food}/S${r.rating_service}/A${r.rating_ambience} tags:[${r.tags.join(",")}] ${r.comment ?? "(no comment)"}`,
    ).join("\n");

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: IntelSchema }),
      prompt: `You are the SecondBite Review Intelligence engine. Analyze these ${total} recent guest reviews from an Indian restaurant and return structured insight.

Reviews (rating: Food/Service/Ambience out of 5):
${sample}

Rules:
- sentimentScore 0–100 reflecting overall guest sentiment.
- summary: 2 sentences, executive-level, quantitative where possible.
- topPraise / topComplaints: real phrases guests use, deduplicated by theme.
- urgentIssues: only things that need action THIS WEEK.
- recommendedActions: concrete owner actions with expected impact in ₹ or rating points.
- No fluff, no emojis, India context (₹).`,
    });

    return output;
  });
