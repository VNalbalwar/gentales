import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Comment } from "@/lib/db/models/comment";
import { ModerationAction } from "@/lib/db/models/moderation-action";
import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/comments/:id — delete a comment.
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  await connectDB();

  const comment = await Comment.findById(id);
  if (!comment) return errorResponse("Comment not found", 404);

  await Comment.findByIdAndDelete(id);

  // Also delete any replies to this comment
  await Comment.deleteMany({ parentId: id });

  await ModerationAction.create({
    adminId: session.user.id,
    targetType: "story",
    targetId: comment.storyId,
    action: "hide",
    note: `Deleted comment by user ${comment.authorId}: "${comment.content.slice(0, 100)}"`,
  });

  return NextResponse.json({ success: true });
}
