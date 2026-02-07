import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assistWriting, isAIAvailable, type AssistAction } from "@/lib/generation/ollama";
import { errorResponse, rateLimit, rateLimitExceeded } from "@/lib/utils";
import { z } from "zod";

const assistSchema = z.object({
  action: z.enum(["continue", "rewrite", "suggest", "improve"]),
  content: z.string().min(1).max(50_000),
  genre: z.string().optional(),
  mood: z.string().optional(),
  instruction: z.string().max(500).optional(),
});

/**
 * POST /api/generate/assist — AI writing assistant actions.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  if (!isAIAvailable()) {
    return errorResponse("AI service is not configured", 503);
  }

  // Rate limit: 30 assists per hour per user
  const rl = rateLimit(session.user.id, {
    namespace: "assist",
    windowSeconds: 3600,
    maxRequests: 30,
  });
  if (!rl.success) return rateLimitExceeded();

  const body = await req.json();
  const parsed = assistSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  try {
    const result = await assistWriting({
      action: parsed.data.action as AssistAction,
      content: parsed.data.content,
      genre: parsed.data.genre,
      mood: parsed.data.mood,
      instruction: parsed.data.instruction,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[assist] AI assist failed:", error);
    const isRateLimit = error instanceof Error && (error.message.includes("429") || error.message.includes("quota"));
    if (isRateLimit) {
      return errorResponse("AI quota exceeded. Please wait a minute and try again.", 429);
    }
    return errorResponse("AI assist failed. Please try again.", 500);
  }
}
