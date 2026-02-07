import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { auth } from "@/lib/auth";
import { updateStorySchema } from "@/lib/validators";
import { errorResponse } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/stories/:id — read a single story.
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  await connectDB();

  const story = await Story.findById(id).lean();
  if (!story) return errorResponse("Not found", 404);

  const session = await auth();
  const isAuthor = session?.user?.id === String(story.authorId);
  const isAdmin = session?.user?.roles?.includes("admin") ?? false;

  if (story.status === "hidden" && !isAdmin) return errorResponse("Not found", 404);
  if (story.visibility === "private" && !isAuthor && !isAdmin)
    return errorResponse("Not found", 404);

  return NextResponse.json(story);
}

/**
 * PATCH /api/stories/:id — update a draft/story. Author only.
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = updateStorySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  await connectDB();

  const story = await Story.findById(id);
  if (!story) return errorResponse("Not found", 404);
  if (String(story.authorId) !== session.user.id)
    return errorResponse("Forbidden", 403);

  // Map "content" from validator to "contentMarkdown" on model
  const { content, ...rest } = parsed.data;
  if (content !== undefined) {
    story.contentMarkdown = content;
  }
  Object.assign(story, rest);
  await story.save();

  return NextResponse.json(story);
}

/**
 * DELETE /api/stories/:id — delete a draft. Author only.
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;
  await connectDB();

  const story = await Story.findById(id);
  if (!story) return errorResponse("Not found", 404);
  if (String(story.authorId) !== session.user.id)
    return errorResponse("Forbidden", 403);

  await story.deleteOne();
  return NextResponse.json({ deleted: true });
}
