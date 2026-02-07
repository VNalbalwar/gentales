"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { StoryCard } from "@/components/stories/story-card";
import { FollowButton } from "@/components/social/follow-button";
import {
  ArrowLeft,
  CalendarDays,
  PenLine,
  Heart,
  Eye,
  Bookmark,
  BookOpen,
  Shield,
  Sparkles,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  email?: string;
  roles: string[];
  createdAt: string;
  preferences?: {
    favoriteGenres?: string[];
    emailNotifications?: boolean;
  };
  computedStats?: {
    storiesPublished: number;
    totalLikes: number;
    totalBookmarks: number;
    totalReads: number;
    savedStories: number;
  };
}

interface StoryData {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  tags: string[];
  genre: string;
  mood?: string;
  visibility?: string;
  counts: { reads: number; likes: number; bookmarks: number };
  publishedAt?: string;
  generation?: { type: string };
}

interface ProfilePageClientProps {
  user: UserProfile;
  stories: StoryData[];
  totalStories: number;
  isOwnProfile: boolean;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

export function ProfilePageClient({
  user: initialUser,
  stories: initialStories,
  totalStories,
  isOwnProfile,
}: ProfilePageClientProps) {
  const [user, setUser] = useState(initialUser);
  const [stories, setStories] = useState<StoryData[]>(initialStories);
  const [hasMoreStories, setHasMoreStories] = useState(
    initialStories.length < totalStories
  );
  const [loadingMoreStories, setLoadingMoreStories] = useState(false);
  const [bookmarks, setBookmarks] = useState<StoryData[]>([]);
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [hasMoreBookmarks, setHasMoreBookmarks] = useState(false);
  const [loadingMoreBookmarks, setLoadingMoreBookmarks] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  useEffect(() => {
    if (isOwnProfile) {
      fetch("/api/users/me")
        .then((r) => r.json())
        .then((data) => {
          if (data._id) setUser(data);
        })
        .catch(() => {});

      fetch("/api/users/me/streaks")
        .then((r) => r.json())
        .then((data) => setStreakData(data))
        .catch(() => {});
    }
  }, [isOwnProfile]);

  const loadBookmarks = () => {
    if (bookmarksLoaded || !isOwnProfile) return;
    setLoadingBookmarks(true);
    fetch("/api/users/me/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        setBookmarks(data.stories || []);
        setBookmarksLoaded(true);
      })
      .catch(() => {})
      .finally(() => setLoadingBookmarks(false));
  };

  const loadMoreStories = async () => {
    setLoadingMoreStories(true);
    try {
      const params = new URLSearchParams({
        skip: String(stories.length),
        limit: "12",
      });
      const res = await fetch(
        `/api/users/${user.username}/stories?${params}`
      );
      if (res.ok) {
        const data = await res.json();
        setStories((prev) => [...prev, ...data.stories]);
        setHasMoreStories(data.hasMore);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoadingMoreStories(false);
    }
  };

  const stats = user.computedStats || {
    storiesPublished: stories.length,
    totalLikes: 0,
    totalBookmarks: 0,
    totalReads: 0,
    savedStories: 0,
  };

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href="/feed">
        <Button variant="ghost" size="sm" className="gap-1.5 mb-8 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Button>
      </Link>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-3xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      {user.name}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      @{user.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isOwnProfile && <FollowButton userId={user._id} />}
                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEdit(true)}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>

                {user.bio && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xl">
                    {user.bio}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    Joined {joinedDate}
                  </span>
                  {user.roles.includes("admin") && (
                    <Badge variant="destructive" className="gap-1">
                      <Shield className="w-3 h-3" />
                      Admin
                    </Badge>
                  )}
                  {isOwnProfile && streakData && streakData.currentStreak > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {streakData.currentStreak} day streak
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Stories", value: stats.storiesPublished, Icon: PenLine },
                { label: "Likes", value: stats.totalLikes, Icon: Heart },
                { label: "Reads", value: stats.totalReads, Icon: Eye },
                { label: "Bookmarks", value: stats.totalBookmarks, Icon: Bookmark },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-3 rounded-lg bg-muted"
                >
                  <stat.Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1.5" />
                  <div className="text-xl font-bold">
                    {formatCount(stat.value)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="stories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stories" className="gap-1.5">
            <PenLine className="w-3.5 h-3.5" />
            Stories
            <span className="text-xs opacity-70">{stats.storiesPublished}</span>
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger
              value="bookmarks"
              className="gap-1.5"
              onClick={loadBookmarks}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved
            </TabsTrigger>
          )}
          <TabsTrigger value="about" className="gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stories">
          <AnimatePresence mode="wait">
            {stories.length === 0 ? (
              <EmptyState
                Icon={PenLine}
                title="No published stories yet"
                description={
                  isOwnProfile
                    ? "Write your first story and share it with the world!"
                    : "This author hasn't published any stories yet."
                }
                action={
                  isOwnProfile
                    ? { href: "/editor", label: "Write a Story" }
                    : undefined
                }
              />
            ) : (
              <div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {stories.map((story, i) => (
                    <StoryCard key={story._id} story={story} index={i} />
                  ))}
                </div>
                {hasMoreStories && (
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      onClick={loadMoreStories}
                      disabled={loadingMoreStories}
                      className="gap-2"
                    >
                      {loadingMoreStories ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          Loading…
                        </>
                      ) : (
                        "Load More Stories"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="bookmarks">
          <AnimatePresence mode="wait">
            {loadingBookmarks ? (
              <div className="text-center py-16">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Loading saved stories…
                </div>
              </div>
            ) : bookmarks.length === 0 ? (
              <EmptyState
                Icon={Bookmark}
                title="No saved stories yet"
                description="Stories you bookmark will appear here."
                action={{ href: "/feed", label: "Browse Stories" }}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarks.map((story, i) => (
                  <StoryCard key={story._id} story={story} index={i} />
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="about" className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {user.bio || "No bio yet."}
              </p>
            </CardContent>
          </Card>

          {user.preferences?.favoriteGenres &&
            user.preferences.favoriteGenres.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Favorite Genres</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.favoriteGenres.map((g) => (
                      <Badge key={g} variant="secondary">
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {isOwnProfile && streakData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Activity Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">
                      {streakData.currentStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Current Streak
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">
                      {streakData.longestStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Longest Streak
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Member Since</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {joinedDate}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        user={user}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSave={(updated) => {
          setUser((prev) => ({ ...prev, ...updated }));
          setShowEdit(false);
        }}
      />
    </section>
  );
}

function EditProfileDialog({
  user,
  open,
  onOpenChange,
  onSave,
}: {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: Partial<UserProfile>) => void;
}) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [username, setUsername] = useState(user.username);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, username }),
      });
      if (res.ok) {
        const data = await res.json();
        onSave(data);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to update profile");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-sm text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
                  )
                }
                maxLength={30}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Tell readers about yourself…"
              className="mt-1.5 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {bio.length}/500
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({
  Icon,
  title,
  description,
  action,
}: {
  Icon: typeof PenLine;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action && (
        <Link href={action.href}>
          <Button className="gap-2">
            <Sparkles className="w-4 h-4" />
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
