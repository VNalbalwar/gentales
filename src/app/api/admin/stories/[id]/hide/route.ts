import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { ModerationAction } from "@/lib/db/models/moderation-action";
import { Report } from "@/lib/db/models/report";
import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/stories/:id/hide — hide a story. Admin only.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  await connectDB();

  const story = await Story.findById(id);
  if (!story) return errorResponse("Not found", 404);

  story.status = "hidden";
  await story.save();

  // Log moderation action
  await ModerationAction.create({
    adminId: session.user.id,
    targetType: "story",
    targetId: id,
    action: "hide",
  });

  // Mark related reports as actioned
  await Report.updateMany(
    { storyId: id, status: "open" },
    { status: "actioned" }
  );

  return NextResponse.json({ hidden: true });
}
