import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Report } from "@/lib/db/models/report";
import { auth } from "@/lib/auth";
import { reportStorySchema } from "@/lib/validators";
import { errorResponse, rateLimit, rateLimitExceeded } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/stories/:id/report — report a story. Auth required.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  // Rate limit: 10 reports per hour per user
  const rl = rateLimit(session.user.id, {
    namespace: "report",
    windowSeconds: 3600,
    maxRequests: 10,
  });
  if (!rl.success) return rateLimitExceeded();

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = reportStorySchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

  await connectDB();

  const report = await Report.create({
    storyId: id,
    reporterId: session.user.id,
    reason: parsed.data.reason,
    details: parsed.data.details || "",
  });

  return NextResponse.json({ reported: true, id: report._id }, { status: 201 });
}
