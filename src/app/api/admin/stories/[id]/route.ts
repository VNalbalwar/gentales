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
 * PATCH /api/admin/stories/:id — admin actions on a story.
 * Body: { action: "hide" | "restore" | "delete", note?: string }
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { action, note } = body as { action: string; note?: string };

  if (!action) return errorResponse("Action is required", 400);

  await connectDB();

  const story = await Story.findById(id);
  if (!story) return errorResponse("Story not found", 404);

  switch (action) {
    case "hide":
      story.status = "hidden";
      await story.save();
      await Report.updateMany(
        { storyId: id, status: "open" },
        { status: "actioned" }
      );
      break;
    case "restore":
      story.status = "published";
      await story.save();
      break;
    case "delete":
      await Story.findByIdAndDelete(id);
      break;
    default:
      return errorResponse("Invalid action", 400);
  }

  // Log moderation action
  await ModerationAction.create({
    adminId: session.user.id,
    targetType: "story",
    targetId: id,
    action: action === "delete" ? "hide" : action,
    note: note || `Admin ${action} story "${story.title}"`,
  });

  return NextResponse.json({ success: true, action });
}
