"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  storyId: string;
  initialCount: number;
  initialBookmarked?: boolean;
}

export function BookmarkButton({ storyId, initialCount, initialBookmarked = false }: BookmarkButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!isSignedIn) {
      router.push("/signin");
      return;
    }
    setLoading(true);
    const prev = { bookmarked, count };
    setBookmarked(!bookmarked);
    setCount((c) => (bookmarked ? c - 1 : c + 1));
    try {
      const res = await fetch(`/api/stories/${storyId}/bookmark`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.bookmarked);
        setCount(data.bookmarks);
      } else {
        setBookmarked(prev.bookmarked);
        setCount(prev.count);
      }
    } catch {
      setBookmarked(prev.bookmarked);
      setCount(prev.count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={bookmarked ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-2"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={bookmarked ? "saved" : "not-saved"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center"
        >
          <Bookmark
            className="w-4 h-4"
            fill={bookmarked ? "currentColor" : "none"}
          />
        </motion.span>
      </AnimatePresence>
      <span>{count}</span>
    </Button>
  );
}
