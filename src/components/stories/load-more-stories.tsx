"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryCard } from "@/components/stories/story-card";

interface StoryData {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  tags: string[];
  genre: string;
  mood?: string;
  counts: { reads: number; likes: number; bookmarks: number };
  publishedAt?: string;
  generation?: { type: string };
}

interface LoadMoreStoriesProps {
  /** Initial stories rendered server-side */
  initialStories: StoryData[];
  /** Total count from server */
  total: number;
  /** Sort mode passed to the API */
  sort: "latest" | "most-viewed" | "most-saved";
  /** Genre filter */
  genre?: string;
  /** How many stories to load per batch */
  pageSize?: number;
}

export function LoadMoreStories({
  initialStories,
  total,
  sort,
  genre,
  pageSize = 12,
}: LoadMoreStoriesProps) {
  const [stories, setStories] = useState<StoryData[]>(initialStories);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialStories.length < total);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        skip: String(stories.length),
        limit: String(pageSize),
      });
      if (genre) params.set("genre", genre);

      const res = await fetch(`/api/stories?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStories((prev) => [...prev, ...data.stories]);
        setHasMore(data.hasMore);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [stories.length, sort, genre, pageSize]);

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story, i) => (
          <StoryCard key={story._id} story={story} index={i} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </>
            ) : (
              `Load More Stories (${stories.length} of ${total})`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
