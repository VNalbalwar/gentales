import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { User } from "@/lib/db/models/user";
import { StoryView } from "@/lib/db/models/story-view";
import { Reaction } from "@/lib/db/models/reaction";
import { StoryReader } from "@/components/stories/story-reader";
import { auth } from "@/lib/auth";
import { createHash } from "crypto";

interface Props {
  params: Promise<{ slugOrId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugOrId } = await params;
  await connectDB();
  const story = await Story.findOne({ slug: slugOrId }).lean();
  if (!story) return { title: "Story Not Found" };
  return {
    title: story.title,
    description: story.summary || story.title,
    openGraph: {
      title: story.title,
      description: story.summary || story.title,
    },
  };
}

export default async function StoryPage({ params, searchParams }: Props) {
  const { slugOrId } = await params;
  const { token } = await searchParams;
  await connectDB();

  const story = await Story.findOne({
    slug: slugOrId,
    status: "published",
  }).lean();

  if (!story) notFound();

  // Access control for private stories
  if (story.visibility === "private") {
    const session = await auth();
    const isAuthor = session?.user?.id === String(story.authorId);
    const isAdmin = session?.user?.roles?.includes("admin") ?? false;
    const hasValidToken = token && story.shareToken === token;

    if (!isAuthor && !isAdmin && !hasValidToken) {
      notFound();
    }
  }

  const author = await User.findById(story.authorId)
    .select("username name avatarUrl")
    .lean();

  // Smart view counting: only count once per viewer per 24h
  try {
    const session = await auth();
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";
    const ua = headersList.get("user-agent") || "unknown";
    const viewerIdentifier = session?.user?.id || `${ip}:${ua}`;
    const viewerHash = createHash("sha256")
      .update(viewerIdentifier)
      .digest("hex")
      .slice(0, 32);

    // Only increment reads if this is a genuinely new unique view
    // StoryView TTL auto-deletes after 24h, allowing re-count next day
    // We use $inc (not $set with countDocuments) so reads never reset
    const created = await StoryView.create({ storyId: story._id, viewerHash }).catch(() => null);
    if (created) {
      await Story.updateOne(
        { _id: story._id },
        { $inc: { "counts.reads": 1 } }
      );
      // Update the in-memory story object so the reader shows the fresh count
      story.counts.reads = (story.counts.reads || 0) + 1;
    }
  } catch {
    // Non-critical
  }

  const isAuthor = await (async () => {
    const session = await auth();
    return session?.user?.id === String(story.authorId);
  })();

  // Check if current user already liked/bookmarked this story
  let userLiked = false;
  let userBookmarked = false;
  try {
    const session = await auth();
    if (session?.user?.id) {
      const [likeReaction, bookmarkReaction] = await Promise.all([
        Reaction.findOne({ storyId: story._id, userId: session.user.id, type: "like" }).lean(),
        Reaction.findOne({ storyId: story._id, userId: session.user.id, type: "bookmark" }).lean(),
      ]);
      userLiked = !!likeReaction;
      userBookmarked = !!bookmarkReaction;
    }
  } catch {
    // Non-critical
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <StoryReader
        story={JSON.parse(JSON.stringify(story))}
        author={author ? JSON.parse(JSON.stringify(author)) : null}
        isPrivate={story.visibility === "private"}
        shareToken={story.shareToken}
        isAuthor={isAuthor}
        initialLiked={userLiked}
        initialBookmarked={userBookmarked}
      />
    </article>
  );
}
