import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Story } from "@/lib/db/models/story";
import { Reaction } from "@/lib/db/models/reaction";
import { auth } from "@/lib/auth";
import { errorResponse } from "@/lib/utils";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, hyphens, and underscores")
    .optional(),
  preferences: z
    .object({
      favoriteGenres: z.array(z.string()).max(10).optional(),
      emailNotifications: z.boolean().optional(),
    })
    .optional(),
});

/**
 * GET /api/users/me — get current user's full profile with computed stats.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  await connectDB();

  const user = await User.findById(session.user.id).lean();
  if (!user) return errorResponse("User not found", 404);

  // Compute live stats
  const [storiesCount, totalLikes, totalBookmarks, bookmarkCount] =
    await Promise.all([
      Story.countDocuments({ authorId: user._id, status: "published" }),
      Reaction.countDocuments({
        storyId: {
          $in: await Story.find({ authorId: user._id }).distinct("_id"),
        },
        type: "like",
      }),
      Reaction.countDocuments({
        storyId: {
          $in: await Story.find({ authorId: user._id }).distinct("_id"),
        },
        type: "bookmark",
      }),
      Reaction.countDocuments({ userId: user._id, type: "bookmark" }),
    ]);

  // Compute total reads from stories
  const readAgg = await Story.aggregate([
    { $match: { authorId: user._id } },
    { $group: { _id: null, total: { $sum: "$counts.reads" } } },
  ]);
  const totalReads = readAgg[0]?.total || 0;

  return NextResponse.json({
    ...JSON.parse(JSON.stringify(user)),
    computedStats: {
      storiesPublished: storiesCount,
      totalLikes,
      totalBookmarks,
      totalReads,
      savedStories: bookmarkCount,
    },
  });
}

/**
 * PATCH /api/users/me — update profile fields.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  await connectDB();

  // Check username uniqueness if changing
  if (parsed.data.username) {
    const existing = await User.findOne({
      username: parsed.data.username,
      _id: { $ne: session.user.id },
    });
    if (existing) {
      return errorResponse("Username is already taken", 409);
    }
  }

  const updateFields: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateFields.name = parsed.data.name;
  if (parsed.data.bio !== undefined) updateFields.bio = parsed.data.bio;
  if (parsed.data.username !== undefined)
    updateFields.username = parsed.data.username;
  if (parsed.data.preferences) {
    if (parsed.data.preferences.favoriteGenres !== undefined) {
      updateFields["preferences.favoriteGenres"] =
        parsed.data.preferences.favoriteGenres;
    }
    if (parsed.data.preferences.emailNotifications !== undefined) {
      updateFields["preferences.emailNotifications"] =
        parsed.data.preferences.emailNotifications;
    }
  }

  const user = await User.findByIdAndUpdate(
    session.user.id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).lean();

  if (!user) return errorResponse("User not found", 404);

  return NextResponse.json(JSON.parse(JSON.stringify(user)));
}
