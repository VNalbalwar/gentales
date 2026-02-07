import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Comment } from "@/lib/db/models/comment";
import { User } from "@/lib/db/models/user";
import { Story } from "@/lib/db/models/story";
import { auth } from "@/lib/auth";
import { recordActivity } from "@/lib/db/models/activity";
import { errorResponse } from "@/lib/utils";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const commentSchema = z.object({
  content: z.string().min(1).max(2000).trim(),
  parentId: z.string().optional(),
});

/** GET /api/stories/[id]/comments — list comments for a story */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  await connectDB();

  const comments = await Comment.find({ storyId: id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const authorIds = [...new Set(comments.map((c) => String(c.authorId)))];
  const users = await User.find({ _id: { $in: authorIds } })
    .select("name username avatarUrl")
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const enriched = comments.map((c) => {
    const author = userMap.get(String(c.authorId));
    return {
      ...JSON.parse(JSON.stringify(c)),
      author: author
        ? {
            name: author.name,
            username: author.username,
            avatarUrl: author.avatarUrl,
          }
        : null,
    };
  });

  return NextResponse.json({ comments: enriched });
}

/** POST /api/stories/[id]/comments — add a comment */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(parsed.error.issues[0].message, 400);

  await connectDB();

  const story = await Story.findById(id);
  if (!story) return errorResponse("Story not found", 404);

  const comment = await Comment.create({
    storyId: id,
    authorId: session.user.id,
    content: parsed.data.content,
    parentId: parsed.data.parentId || undefined,
  });

  await recordActivity(session.user.id, "comment_posted", {
    storyId: id,
  }).catch(() => {});

  const user = await User.findById(session.user.id)
    .select("name username avatarUrl")
    .lean();

  return NextResponse.json({
    ...JSON.parse(JSON.stringify(comment)),
    author: user
      ? { name: user.name, username: user.username, avatarUrl: user.avatarUrl }
      : null,
  });
}
