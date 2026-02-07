import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Reaction } from "@/lib/db/models/reaction";
import { Story } from "@/lib/db/models/story";
import { auth } from "@/lib/auth";
import { errorResponse } from "@/lib/utils";

/**
 * GET /api/users/me/bookmarks — fetch all bookmarked stories for current user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  await connectDB();

  // Get bookmark reaction records, newest first
  const bookmarks = await Reaction.find({
    userId: session.user.id,
    type: "bookmark",
  })
    .sort({ createdAt: -1 })
    .lean();

  if (bookmarks.length === 0) {
    return NextResponse.json({ stories: [] });
  }

  const storyIds = bookmarks.map((b) => b.storyId);

  // Fetch the stories (published only — include private since user bookmarked them)
  const stories = await Story.find({
    _id: { $in: storyIds },
    status: "published",
  })
    .select("-contentMarkdown -chapters")
    .lean();

  // Maintain bookmark order (newest bookmarked first)
  const storyMap = new Map(stories.map((s) => [String(s._id), s]));
  const ordered = storyIds
    .map((id) => storyMap.get(String(id)))
    .filter(Boolean);

  return NextResponse.json({
    stories: JSON.parse(JSON.stringify(ordered)),
  });
}
