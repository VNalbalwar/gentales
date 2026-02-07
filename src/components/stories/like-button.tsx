"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  storyId: string;
  initialCount: number;
  initialLiked?: boolean;
}

export function LikeButton({ storyId, initialCount, initialLiked = false }: LikeButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!isSignedIn) {
      router.push("/signin");
      return;
    }
    setLoading(true);
    const prev = { liked, count };
    setLiked(!liked);
    setCount((c) => (liked ? c - 1 : c + 1));
    try {
      const res = await fetch(`/api/stories/${storyId}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.likes);
      } else {
        setLiked(prev.liked);
        setCount(prev.count);
      }
    } catch {
      setLiked(prev.liked);
      setCount(prev.count);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={cn(
        "gap-2",
        liked &&
          "bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={liked ? "liked" : "not-liked"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center"
        >
          <Heart
            className="w-4 h-4"
            fill={liked ? "currentColor" : "none"}
          />
        </motion.span>
      </AnimatePresence>
      <span>{count}</span>
    </Button>
  );
}
