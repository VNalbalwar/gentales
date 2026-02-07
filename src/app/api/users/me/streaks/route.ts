import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { auth } from "@/lib/auth";
import { calculateStreak, Activity } from "@/lib/db/models/activity";
import { errorResponse } from "@/lib/utils";

/**
 * GET /api/users/me/streaks — get current user's streak data.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  await connectDB();

  const { currentStreak, longestStreak } = await calculateStreak(
    session.user.id
  );

  // Get activity for the last 30 days for the heatmap
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

  const dailyActivity = await Activity.aggregate([
    {
      $match: {
        userId: session.user.id,
        date: { $gte: dateStr },
      },
    },
    {
      $group: {
        _id: "$date",
        count: { $sum: 1 },
        types: { $addToSet: "$type" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return NextResponse.json({
    currentStreak,
    longestStreak,
    dailyActivity: dailyActivity.map((d) => ({
      date: d._id,
      count: d.count,
      types: d.types,
    })),
  });
}
