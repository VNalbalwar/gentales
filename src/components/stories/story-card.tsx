"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Eye, BookmarkIcon, Sparkles, Lock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface StoryCardProps {
  story: {
    _id: unknown;
    title: string;
    slug: string;
    summary?: string;
    tags: string[];
    genre: string;
    mood?: string;
    visibility?: string;
    counts: { reads: number; likes: number; bookmarks: number };
    publishedAt?: Date | string;
    generation?: { type: string };
  };
  index?: number;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function StoryCard({ story, index = 0 }: StoryCardProps) {
  const publishedDate = story.publishedAt
    ? new Date(story.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link href={`/story/${story.slug}`} className="block h-full group">
        <Card className="h-full transition-all hover:shadow-md hover:border-primary/20">
          <CardContent className="pt-5">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              {story.visibility === "private" && (
                <Badge variant="outline" className="text-[11px] gap-1 text-amber-600 border-amber-300">
                  <Lock className="w-3 h-3" />
                  Private
                </Badge>
              )}
              {story.genre && (
                <Badge variant="secondary" className="text-[11px]">
                  {story.genre}
                </Badge>
              )}
              {story.generation?.type &&
                story.generation.type !== "handwritten" && (
                  <Badge variant="outline" className="text-[11px] gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </Badge>
                )}
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {story.title}
            </h3>

            {/* Summary */}
            {story.summary && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {story.summary}
              </p>
            )}

            {/* Tags */}
            {story.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {story.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
                {story.tags.length > 3 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{story.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-0">
            <div className="w-full">
              <Separator className="mb-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {formatCount(story.counts.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {formatCount(story.counts.reads)}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookmarkIcon className="w-3.5 h-3.5" />
                    {formatCount(story.counts.bookmarks)}
                  </span>
                </div>
                {publishedDate && <span>{publishedDate}</span>}
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
