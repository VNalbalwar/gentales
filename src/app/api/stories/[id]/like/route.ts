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
 * POST /api/stories/:id/like — toggle like. Auth required.
 */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;
  await connectDB();

  const existing = await Reaction.findOne({
    storyId: id,
    userId: session.user.id,
    type: "like",
  });

  let liked: boolean;

  if (existing) {
    await existing.deleteOne();
    await Story.updateOne({ _id: id }, { $inc: { "counts.likes": -1 } });
    liked = false;
  } else {
    await Reaction.create({
      storyId: id,
      userId: session.user.id,
      type: "like",
    });
    await Story.updateOne({ _id: id }, { $inc: { "counts.likes": 1 } });
    liked = true;
  }

  const story = await Story.findById(id).select("counts.likes").lean();
  return NextResponse.json({ liked, likes: story?.counts.likes ?? 0 });
}
