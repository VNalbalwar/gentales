import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Follow } from "@/lib/db/models/follow";
import { User } from "@/lib/db/models/user";
import { auth } from "@/lib/auth";
import { recordActivity } from "@/lib/db/models/activity";
import { errorResponse } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** POST /api/users/[id]/follow — toggle follow */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { id: targetId } = await ctx.params;
  if (session.user.id === targetId)
    return errorResponse("Cannot follow yourself", 400);

  await connectDB();

  const targetUser = await User.findById(targetId);
  if (!targetUser) return errorResponse("User not found", 404);

  const existing = await Follow.findOne({
    followerId: session.user.id,
    followingId: targetId,
  });

  if (existing) {
    await existing.deleteOne();
    return NextResponse.json({ following: false });
  }

  await Follow.create({
    followerId: session.user.id,
    followingId: targetId,
  });

  await recordActivity(session.user.id, "follow", { targetId }).catch(
    () => {}
  );

  return NextResponse.json({ following: true });
}

/** GET /api/users/[id]/follow — get follow status and counts */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id: targetId } = await ctx.params;
  await connectDB();

  const session = await auth();
  const isFollowing = session?.user?.id
    ? !!(await Follow.findOne({
        followerId: session.user.id,
        followingId: targetId,
      }))
    : false;

  const [followers, following] = await Promise.all([
    Follow.countDocuments({ followingId: targetId }),
    Follow.countDocuments({ followerId: targetId }),
  ]);

  return NextResponse.json({ isFollowing, followers, following });
}
