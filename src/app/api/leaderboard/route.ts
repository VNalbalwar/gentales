import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { User } from "@/lib/db/models/user";
import { Follow } from "@/lib/db/models/follow";

/**
 * GET /api/leaderboard — top writers ranked by engagement.
 */
export async function GET() {
  await connectDB();

  // Aggregate top writers by total engagement across their stories
  const topWriters = await Story.aggregate([
    { $match: { status: "published", visibility: "public" } },
    {
      $group: {
        _id: "$authorId",
        totalStories: { $sum: 1 },
        totalReads: { $sum: "$counts.reads" },
        totalLikes: { $sum: "$counts.likes" },
        totalBookmarks: { $sum: "$counts.bookmarks" },
      },
    },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: ["$totalLikes", 3] },
            { $multiply: ["$totalBookmarks", 5] },
            "$totalReads",
            { $multiply: ["$totalStories", 10] },
          ],
        },
      },
    },
    { $sort: { score: -1 } },
    { $limit: 50 },
  ]);

  const authorIds = topWriters.map((w) => w._id);
  const users = await User.find({ _id: { $in: authorIds } })
    .select("name username avatarUrl bio")
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  // Get follower counts
  const followerCounts = await Follow.aggregate([
    { $match: { followingId: { $in: authorIds } } },
    { $group: { _id: "$followingId", count: { $sum: 1 } } },
  ]);
  const followerMap = new Map(
    followerCounts.map((f) => [String(f._id), f.count])
  );

  const leaderboard = topWriters
    .map((w, index) => {
      const user = userMap.get(String(w._id));
      if (!user) return null;
      return {
        rank: index + 1,
        user: {
          _id: String(w._id),
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
        },
        stats: {
          totalStories: w.totalStories,
          totalReads: w.totalReads,
          totalLikes: w.totalLikes,
          totalBookmarks: w.totalBookmarks,
          followers: followerMap.get(String(w._id)) || 0,
          score: w.score,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json({ leaderboard });
}
