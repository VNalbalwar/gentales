import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Story } from "@/lib/db/models/story";
import { Reaction } from "@/lib/db/models/reaction";
import { auth } from "@/lib/auth";
import { ProfilePageClient } from "@/components/profile/profile-page-client";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} | GenTales` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  await connectDB();

  const user = await User.findOne({ username }).lean();
  if (!user) notFound();

  const session = await auth();
  const isOwnProfile = session?.user?.id === String(user._id);

  const storyFilter: Record<string, unknown> = {
    authorId: user._id,
    status: "published",
  };
  // Only show public stories to other viewers; show all to own profile
  if (!isOwnProfile) {
    storyFilter.visibility = "public";
  }

  const PROFILE_PAGE_SIZE = 12;

  // Fetch stories, story count, and compute profile stats in parallel
  const userStoryIds = Story.find({ authorId: user._id }).distinct("_id");

  const [stories, totalStories, storyIds, readAgg, bookmarkCount] = await Promise.all([
    Story.find(storyFilter)
      .sort({ publishedAt: -1 })
      .limit(PROFILE_PAGE_SIZE)
      .select("-contentMarkdown -chapters")
      .lean(),
    Story.countDocuments(storyFilter),
    userStoryIds,
    Story.aggregate([
      { $match: { authorId: user._id, status: "published" } },
      { $group: { _id: null, total: { $sum: "$counts.reads" } } },
    ]),
    isOwnProfile
      ? Reaction.countDocuments({ userId: user._id, type: "bookmark" })
      : Promise.resolve(0),
  ]);

  const [totalLikes, totalBookmarks, storiesPublished] = await Promise.all([
    Reaction.countDocuments({ storyId: { $in: storyIds }, type: "like" }),
    Reaction.countDocuments({ storyId: { $in: storyIds }, type: "bookmark" }),
    Story.countDocuments({ authorId: user._id, status: "published" }),
  ]);

  const totalReads = readAgg[0]?.total || 0;

  // Attach computed stats to user object so it's available on first render
  const serializedUser = {
    ...JSON.parse(JSON.stringify(user)),
    computedStats: {
      storiesPublished,
      totalLikes,
      totalBookmarks,
      totalReads,
      savedStories: bookmarkCount,
    },
  };
  const serializedStories = JSON.parse(JSON.stringify(stories));

  return (
    <ProfilePageClient
      user={serializedUser}
      stories={serializedStories}
      totalStories={totalStories}
      isOwnProfile={isOwnProfile}
    />
  );
}
