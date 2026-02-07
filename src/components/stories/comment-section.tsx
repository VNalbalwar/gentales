"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    username: string;
    avatarUrl?: string;
  } | null;
}

interface CommentSectionProps {
  storyId: string;
}

export function CommentSection({ storyId }: CommentSectionProps) {
  const { isSignedIn } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/stories/${storyId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storyId]);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setContent("");
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Discussion ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment input */}
        {isSignedIn ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts on this story…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={2000}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {content.length}/2000
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Posting…" : "Comment"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Link href="/signin" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to join the discussion.
          </div>
        )}

        {comments.length > 0 && <Separator />}

        {/* Comments list */}
        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Loading comments…
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment._id} className="flex gap-3">
                <Link
                  href={
                    comment.author
                      ? `/u/${comment.author.username}`
                      : "#"
                  }
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={comment.author?.avatarUrl}
                      alt={comment.author?.name}
                    />
                    <AvatarFallback className="text-xs">
                      {(comment.author?.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {comment.author && (
                      <Link
                        href={`/u/${comment.author.username}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {comment.author.name}
                      </Link>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
