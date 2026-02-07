"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  Loader2,
  ExternalLink,
  Heart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface StoryData {
  _id: string;
  title: string;
  slug: string;
  authorId: { name: string; username: string } | null;
  genre: string;
  status: string;
  visibility: string;
  counts: { reads: number; likes: number; bookmarks: number };
  publishedAt?: string;
  createdAt: string;
  generation?: { type: string };
}

const STORY_STATUSES = ["", "draft", "published", "hidden"];
const VISIBILITY_OPTIONS = ["", "public", "private"];

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<StoryData[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoryData | null>(null);

  const fetchStories = useCallback(
    async (skip = 0, append = false) => {
      const params = new URLSearchParams({ skip: String(skip), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (visibilityFilter) params.set("visibility", visibilityFilter);

      const res = await fetch(`/api/admin/stories?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      if (append) {
        setStories((prev) => [...prev, ...data.stories]);
      } else {
        setStories(data.stories);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
    },
    [search, statusFilter, visibilityFilter]
  );

  useEffect(() => {
    setLoading(true);
    fetchStories(0).finally(() => setLoading(false));
  }, [fetchStories]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchStories(stories.length, true);
    setLoadingMore(false);
  };

  const handleAction = async (storyId: string, action: string) => {
    setActionInProgress(storyId);
    try {
      const res = await fetch(`/api/admin/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        if (action === "delete") {
          setStories((prev) => prev.filter((s) => s._id !== storyId));
          setTotal((t) => t - 1);
        } else {
          setStories((prev) =>
            prev.map((s) =>
              s._id === storyId
                ? { ...s, status: action === "hide" ? "hidden" : "published" }
                : s
            )
          );
        }
        toast.success(`Story ${action} successfully`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionInProgress(null);
      setDeleteTarget(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "published": return "secondary";
      case "draft": return "outline";
      case "hidden": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Content Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} total stories
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Statuses</option>
              {STORY_STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Visibility</option>
              {VISIBILITY_OPTIONS.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stories Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No stories found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Story</th>
                    <th className="pb-3 font-medium text-muted-foreground">Author</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Stats</th>
                    <th className="pb-3 font-medium text-muted-foreground">Created</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stories.map((story) => {
                    const author = story.authorId as { name: string; username: string } | null;
                    return (
                      <tr key={story._id} className="hover:bg-muted/50">
                        <td className="py-3 max-w-[250px]">
                          <div>
                            <Link
                              href={`/story/${story.slug}`}
                              className="font-medium hover:text-primary transition-colors line-clamp-1 flex items-center gap-1"
                            >
                              {story.title}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {story.genre && (
                                <span className="text-[10px] text-muted-foreground">{story.genre}</span>
                              )}
                              {story.generation?.type && story.generation.type !== "handwritten" && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0">AI</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {author ? (
                            <Link href={`/u/${author.username}`} className="hover:text-foreground">
                              @{author.username}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Badge variant={statusColor(story.status) as "secondary" | "outline" | "destructive"} className="text-[10px]">
                              {story.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {story.visibility}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />{story.counts.reads}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />{story.counts.likes}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(story.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionInProgress === story._id}
                              >
                                {actionInProgress === story._id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Actions"
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/story/${story.slug}`} target="_blank">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Story
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {story.status !== "hidden" && (
                                <DropdownMenuItem onClick={() => handleAction(story._id, "hide")}>
                                  <EyeOff className="w-4 h-4 mr-2 text-amber-500" />
                                  Hide
                                </DropdownMenuItem>
                              )}
                              {story.status === "hidden" && (
                                <DropdownMenuItem onClick={() => handleAction(story._id, "restore")}>
                                  <RotateCcw className="w-4 h-4 mr-2 text-green-500" />
                                  Restore
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteTarget(story)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Load More ({stories.length} of {total})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.title}&quot; and cannot be undone.
              All associated data (comments, reactions) will be orphaned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && handleAction(deleteTarget._id, "delete")}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
