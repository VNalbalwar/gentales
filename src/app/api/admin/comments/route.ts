import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Comment } from "@/lib/db/models/comment";
import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/utils";

/**
 * GET /api/admin/comments — list all comments with search and pagination.
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
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10) || 0);
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10) || 20);

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.content = { $regex: search, $options: "i" };
  }

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("authorId", "name username")
      .populate("storyId", "title slug")
      .lean(),
    Comment.countDocuments(filter),
  ]);

  const formatted = comments.map((c) => ({
    ...c,
    _id: String(c._id),
  }));

  return NextResponse.json({ comments: formatted, total, hasMore: skip + limit < total });
}
