import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateStorySchema } from "@/lib/validators";
import { generateStoryWithAI, isAIAvailable } from "@/lib/generation/ollama";
import { errorResponse, rateLimit, rateLimitExceeded } from "@/lib/utils";

// Vercel: extend serverless function timeout (60s hobby, 300s pro)
export const maxDuration = 60;

/**
 * POST /api/generate/story — generate a story using Ollama AI.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  if (!isAIAvailable()) {
    return errorResponse("AI service is not configured", 503);
  }

  // Rate limit: 10 generations per hour per user
  const rl = rateLimit(session.user.id, {
    namespace: "generate",
    windowSeconds: 3600,
    maxRequests: 10,
  });
  if (!rl.success) return rateLimitExceeded();

  const body = await req.json();
  const parsed = generateStorySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  try {
    const result = await generateStoryWithAI({
      genre: parsed.data.genre,
      mood: parsed.data.mood,
      length: parsed.data.lengthTier,
      keywords: parsed.data.keywords,
      prompt: parsed.data.prompt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[generate] AI generation failed:", error);
    const isRateLimit = error instanceof Error && (error.message.includes("429") || error.message.includes("quota"));
    if (isRateLimit) {
      return errorResponse("AI quota exceeded. Please wait a minute and try again.", 429);
    }
    return errorResponse("Story generation failed. Please try again.", 500);
  }
}
