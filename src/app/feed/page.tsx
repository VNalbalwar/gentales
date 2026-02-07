import { connectDB } from "@/lib/db/connection";
import { Story } from "@/lib/db/models/story";
import { LoadMoreStories } from "@/components/stories/load-more-stories";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

interface Props {
  searchParams: Promise<{ genre?: string }>;
}

export default async function FeedPage({ searchParams }: Props) {
  const { genre } = await searchParams;
  await connectDB();

  const filter: Record<string, unknown> = {
    status: "published",
    visibility: "public",
  };

  if (genre) {
    filter.genre = { $regex: new RegExp(`^${genre}$`, "i") };
  }

  const [stories, total] = await Promise.all([
    Story.find(filter)
      .sort({ publishedAt: -1 })
      .limit(PAGE_SIZE)
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

  if (formatted.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📖</div>
        <h2 className="text-xl font-semibold mb-2">
          {genre ? `No ${genre} stories yet` : "No stories yet"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {genre
            ? "Try a different genre or be the first to write one!"
            : "Be the first to share your story with the world."}
        </p>
        <Link href="/editor">
          <Button className="gap-2">
            <Sparkles className="w-4 h-4" />
            Write a Story
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <LoadMoreStories
      initialStories={formatted}
      total={total}
      sort="latest"
      genre={genre}
      pageSize={PAGE_SIZE}
    />
  );
}
