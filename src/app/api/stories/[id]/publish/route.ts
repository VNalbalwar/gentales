import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { auth } from "@/lib/auth";
import { publishStorySchema } from "@/lib/validators";
import { errorResponse } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/stories/:id/publish — publish a draft. Author only.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = publishStorySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  await connectDB();

  const story = await Story.findById(id);
  if (!story) return errorResponse("Not found", 404);
  if (String(story.authorId) !== session.user.id)
    return errorResponse("Forbidden", 403);

  if (!story.contentMarkdown && story.chapters.length === 0) {
    return errorResponse("Cannot publish an empty story");
  }

  story.title = parsed.data.title;
  story.contentMarkdown = parsed.data.content;
  story.summary = parsed.data.summary;
  story.tags = parsed.data.tags;
  story.genre = parsed.data.genre;
  story.visibility = parsed.data.visibility;
  story.status = "published";
  story.publishedAt = new Date();

  await story.save();

  return NextResponse.json({ slug: story.slug });
}
