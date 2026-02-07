import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { User } from "@/lib/db/models/user";
import { auth } from "@/lib/auth";

/**
 * GET /api/users/[id]/stories — paginated stories for a user profile.
 *
 * Query params:
 *  - skip: offset (default 0)
 *  - limit: page size (default 12, max 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const { searchParams } = request.nextUrl;
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10) || 0);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12)
  );

  // Find the user by either _id or username
  const user = await User.findOne({
    $or: [{ _id: id }, { username: id }],
  }).lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const session = await auth();
  const isOwnProfile = session?.user?.id === String(user._id);

  const filter: Record<string, unknown> = {
    authorId: user._id,
    status: "published",
  };

  if (!isOwnProfile) {
    filter.visibility = "public";
  }

  const [stories, total] = await Promise.all([
    Story.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-contentMarkdown -chapters")
      .lean(),
    Story.countDocuments(filter),
  ]);

  const formatted = stories.map((s) => ({
    _id: String(s._id),
    title: s.title,
    slug: s.slug,
    summary: s.summary || "",
    tags: s.tags || [],
    genre: s.genre,
    mood: s.mood,
    counts: s.counts || { reads: 0, likes: 0, bookmarks: 0 },
    publishedAt: s.publishedAt?.toISOString(),
    generation: s.generation ? { type: s.generation.type } : undefined,
    visibility: s.visibility,
  }));

  return NextResponse.json({
    stories: formatted,
    total,
    hasMore: skip + limit < total,
  });
}
