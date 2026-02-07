"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import sanitizeHtml from "sanitize-html";
import {
  ArrowLeft,
  Clock,
  Eye,
  Share2,
  Sparkles,
  Check,
  Copy,
  Lock,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { LikeButton } from "@/components/stories/like-button";
import { BookmarkButton } from "@/components/stories/bookmark-button";
import { CommentSection } from "@/components/stories/comment-section";
import { toast } from "sonner";

interface StoryReaderProps {
  story: {
    _id: string;
    title: string;
    slug: string;
    summary?: string;
    contentMarkdown: string;
    tags: string[];
    genre: string;
    mood: string;
    counts: { reads: number; likes: number; bookmarks: number };
    publishedAt?: string;
    generation?: { type: string };
  };
  author: {
    _id: string;
    username: string;
    name: string;
    avatarUrl?: string;
  } | null;
  isPrivate?: boolean;
  shareToken?: string;
  isAuthor?: boolean;
  initialLiked?: boolean;
  initialBookmarked?: boolean;
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function isHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(text);
}

function escapeAndFormat(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return escaped
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function StoryReader({
  story,
  author,
  isPrivate,
  shareToken,
  isAuthor,
  initialLiked,
  initialBookmarked,
}: StoryReaderProps) {
  const [readProgress, setReadProgress] = useState(0);
  const readingTime = estimateReadingTime(story.contentMarkdown);

  const publishedDate = story.publishedAt
    ? new Date(story.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = async () => {
    let url = window.location.href;
    if (isPrivate && shareToken) {
      const base = url.split("?")[0];
      url = `${base}?token=${shareToken}`;
    }
    if (navigator.share) {
      await navigator.share({ title: story.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleCopyShareLink = async () => {
    const base = window.location.href.split("?")[0];
    const url = `${base}?token=${shareToken}`;
    await navigator.clipboard.writeText(url);
    toast.success("Secret share link copied!");
  };

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${readProgress * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back link */}
        <Link href="/feed">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-8 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Button>
        </Link>

        {/* Private story banner */}
        {isPrivate && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  This is a private story
                </span>
              </div>
              {isAuthor && shareToken && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleCopyShareLink}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Copy Share Link
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <header className="mb-10">
          {/* Meta badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {story.genre && <Badge>{story.genre}</Badge>}
            {story.mood && <Badge variant="secondary">{story.mood}</Badge>}
            {story.generation?.type &&
              story.generation.type !== "handwritten" && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Generated
                </Badge>
              )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight">
            {story.title}
          </h1>

          {story.summary && (
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {story.summary}
            </p>
          )}

          {/* Author & meta row */}
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            {author && (
              <Link
                href={`/u/${author.username}`}
                className="flex items-center gap-2.5 group"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={author.avatarUrl} alt={author.name} />
                  <AvatarFallback>
                    {author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors block leading-tight">
                    {author.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @{author.username}
                  </span>
                </div>
              </Link>
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {publishedDate && <span>{publishedDate}</span>}
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {readingTime} min read
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {formatCount(story.counts.reads)}
              </span>
            </div>
          </div>

          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {story.tags.map((tag) => (
                <Link key={tag} href={`/feed?tag=${tag}`}>
                  <Badge variant="secondary" className="cursor-pointer">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </header>

        <Separator className="mb-10" />

        {/* Content */}
        <div
          className="prose-story"
          dangerouslySetInnerHTML={{
            __html: isHtml(story.contentMarkdown)
              ? sanitizeHtml(story.contentMarkdown, {
                  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                    "img",
                    "mark",
                    "u",
                    "s",
                    "hr",
                  ]),
                  allowedAttributes: {
                    ...sanitizeHtml.defaults.allowedAttributes,
                    "*": ["class"],
                  },
                })
              : escapeAndFormat(story.contentMarkdown),
          }}
        />

        {/* Engagement bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <Separator className="mb-8" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <LikeButton
                storyId={story._id}
                initialCount={story.counts.likes}
                initialLiked={initialLiked}
              />
              <BookmarkButton
                storyId={story._id}
                initialCount={story.counts.bookmarks}
                initialBookmarked={initialBookmarked}
              />
            </div>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* Author card */}
          {author && (
            <Link href={`/u/${author.username}`}>
              <Card className="mt-8 hover:border-primary/20 transition-all group">
                <CardContent className="flex items-center gap-4 py-5">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={author.avatarUrl} alt={author.name} />
                    <AvatarFallback className="text-xl">
                      {author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {author.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{author.username}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Comments */}
          <div className="mt-12">
            <CommentSection storyId={story._id} />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
