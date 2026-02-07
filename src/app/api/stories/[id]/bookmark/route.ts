import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { Reaction } from "@/lib/db/models/reaction";
import { auth } from "@/lib/auth";
import { errorResponse } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/stories/:id/bookmark — toggle bookmark. Auth required.
 */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;
  await connectDB();

  const existing = await Reaction.findOne({
    storyId: id,
    userId: session.user.id,
    type: "bookmark",
  });

  let bookmarked: boolean;

  if (existing) {
    await existing.deleteOne();
    await Story.updateOne({ _id: id }, { $inc: { "counts.bookmarks": -1 } });
    bookmarked = false;
  } else {
    await Reaction.create({
      storyId: id,
      userId: session.user.id,
      type: "bookmark",
    });
    await Story.updateOne({ _id: id }, { $inc: { "counts.bookmarks": 1 } });
    bookmarked = true;
  }

  const story = await Story.findById(id).select("counts.bookmarks").lean();
  return NextResponse.json({
    bookmarked,
    bookmarks: story?.counts.bookmarks ?? 0,
  });
}
