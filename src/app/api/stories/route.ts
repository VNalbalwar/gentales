import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { auth } from "@/lib/auth";
import { updateStorySchema } from "@/lib/validators";
import { createSlug, errorResponse } from "@/lib/utils";

/**
 * GET /api/stories — public feed with pagination, search, and sort.
 *
 * Query params:
 *  - sort: "latest" | "most-viewed" | "most-saved" (default: "latest")
 *  - genre, tag, q: filters
 *  - skip: offset for pagination (default 0)
 *  - limit: page size (default 12, max 50)
 */
export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = req.nextUrl;
  const sort = searchParams.get("sort") || "latest";
  const tag = searchParams.get("tag");
  const genre = searchParams.get("genre");
  const q = searchParams.get("q");
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10) || 0);
  const limit = Math.min(Number(searchParams.get("limit")) || 12, 50);

  const filter: Record<string, unknown> = {
    status: "published",
    visibility: "public",
  };

  if (tag) filter.tags = tag;
  if (genre) filter.genre = { $regex: new RegExp(`^${genre}$`, "i") };
  if (q) filter.$text = { $search: q };

  let sortOption: Record<string, -1>;
  switch (sort) {
    case "most-viewed":
      sortOption = { "counts.reads": -1 };
      break;
    case "most-saved":
      sortOption = { "counts.bookmarks": -1 };
      break;
    default:
      sortOption = { publishedAt: -1 };
  }

  const [stories, total] = await Promise.all([
    Story.find(filter)
      .sort(sortOption)
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
  }));

  return NextResponse.json({
    stories: formatted,
    total,
    hasMore: skip + limit < total,
  });
}

/**
 * POST /api/stories — create a new draft. Auth required.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const body = await req.json();
  const parsed = updateStorySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  await connectDB();

  const slug = createSlug(parsed.data.title || "untitled");

  const story = await Story.create({
    authorId: session.user.id,
    title: parsed.data.title || "Untitled",
    slug,
    summary: parsed.data.summary || "",
    contentMarkdown: parsed.data.content || "",
    tags: parsed.data.tags || [],
    genre: parsed.data.genre || "",
    mood: parsed.data.mood || "",
    visibility: parsed.data.visibility || "private",
    status: "draft",
    generation: { type: "handwritten" },
  });

  return NextResponse.json(story, { status: 201 });
}
