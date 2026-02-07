"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Search,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface CommentData {
  _id: string;
  content: string;
  authorId: { _id: string; name: string; username: string } | null;
  storyId: { _id: string; title: string; slug: string } | null;
  parentCommentId: string | null;
  createdAt: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CommentData | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchComments = useCallback(
    async (skip = 0, append = false) => {
      const params = new URLSearchParams({ skip: String(skip), limit: "20" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/comments?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      if (append) {
        setComments((prev) => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
    },
    [search]
  );

  useEffect(() => {
    setLoading(true);
    fetchComments(0).finally(() => setLoading(false));
  }, [fetchComments]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchComments(comments.length, true);
    setLoadingMore(false);
  };

  const handleDelete = async (commentId: string) => {
    setActionInProgress(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setTotal((t) => t - (data.deletedCount || 1));
        toast.success(`Deleted comment${data.deletedCount > 1 ? ` + ${data.deletedCount - 1} replies` : ""}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionInProgress(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" />
          Comment Moderation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} total comments
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search comment content…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No comments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Comment</th>
                    <th className="pb-3 font-medium text-muted-foreground">Author</th>
                    <th className="pb-3 font-medium text-muted-foreground">Story</th>
                    <th className="pb-3 font-medium text-muted-foreground">Type</th>
                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comments.map((comment) => (
                    <tr key={comment._id} className="hover:bg-muted/50">
                      <td className="py-3 max-w-[300px]">
                        <p className="text-sm line-clamp-2">{comment.content}</p>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {comment.authorId ? (
                          <Link
                            href={`/u/${comment.authorId.username}`}
                            className="hover:text-foreground"
                          >
                            @{comment.authorId.username}
                          </Link>
                        ) : (
                          <span className="italic text-xs">Deleted user</span>
                        )}
                      </td>
                      <td className="py-3">
                        {comment.storyId ? (
                          <Link
                            href={`/story/${comment.storyId.slug}`}
                            className="text-sm hover:text-primary flex items-center gap-1"
                            target="_blank"
                          >
                            <span className="line-clamp-1 max-w-[150px]">
                              {comment.storyId.title}
                            </span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Deleted</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {comment.parentCommentId ? "Reply" : "Top-level"}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={actionInProgress === comment._id}
                          onClick={() => setDeleteTarget(comment)}
                        >
                          {actionInProgress === comment._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Load More ({comments.length} of {total})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the comment{" "}
              {deleteTarget?.parentCommentId
                ? ""
                : "and all its replies "}
              permanently. This cannot be undone.
              <br />
              <br />
              <span className="italic text-xs">
                &quot;{deleteTarget?.content?.slice(0, 100)}
                {(deleteTarget?.content?.length ?? 0) > 100 ? "…" : ""}&quot;
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && handleDelete(deleteTarget._id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
