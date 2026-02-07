import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { requireAdmin } from "@/lib/auth/session";
import { errorResponse } from "@/lib/utils";

/**
 * GET /api/admin/stories — list all stories with search, filter, pagination.
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
  const status = searchParams.get("status") || "";
  const visibility = searchParams.get("visibility") || "";
  const sort = searchParams.get("sort") || "newest";
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10) || 0);
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10) || 20);

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
  }
  if (status) filter.status = status;
  if (visibility) filter.visibility = visibility;

  let sortOption: Record<string, 1 | -1>;
  switch (sort) {
    case "oldest":
      sortOption = { createdAt: 1 };
      break;
    case "most-read":
      sortOption = { "counts.reads": -1 };
      break;
    case "most-liked":
      sortOption = { "counts.likes": -1 };
      break;
    case "most-reported":
      sortOption = { createdAt: -1 }; // fallback
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const [stories, total] = await Promise.all([
    Story.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select("title slug authorId genre status visibility counts publishedAt createdAt generation")
      .populate("authorId", "name username")
      .lean(),
    Story.countDocuments(filter),
  ]);

  const formatted = stories.map((s) => ({
    ...s,
    _id: String(s._id),
    authorId: s.authorId,
  }));

  return NextResponse.json({ stories: formatted, total, hasMore: skip + limit < total });
}
