import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Story } from "@/lib/db/models/story";
import { ModerationAction } from "@/lib/db/models/moderation-action";
import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/utils";

/**
 * GET /api/admin/users — list all users with search, filter, pagination.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return errorResponse("Forbidden", 403);
  }

  await connectDB();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "newest";
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10) || 0);
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10) || 20);

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (role) filter.roles = role;
  if (status) filter.status = status;

  let sortOption: Record<string, 1 | -1>;
  switch (sort) {
    case "oldest":
      sortOption = { createdAt: 1 };
      break;
    case "name":
      sortOption = { name: 1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select("name username email avatarUrl roles status createdAt stats")
      .lean(),
    User.countDocuments(filter),
  ]);

  // Get story counts for each user
  const userIds = users.map((u) => u._id);
  const storyCounts = await Story.aggregate([
    { $match: { authorId: { $in: userIds } } },
    { $group: { _id: "$authorId", count: { $sum: 1 } } },
  ]);
  const storyCountMap = new Map(
    storyCounts.map((s) => [String(s._id), s.count])
  );

  const enriched = users.map((u) => ({
    ...u,
    _id: String(u._id),
    storyCount: storyCountMap.get(String(u._id)) || 0,
  }));

  return NextResponse.json({ users: enriched, total, hasMore: skip + limit < total });
}
