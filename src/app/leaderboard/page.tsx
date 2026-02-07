import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Story } from "@/lib/db/models/story";
import { Follow } from "@/lib/db/models/follow";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Heart,
  Eye,
  Bookmark,
  PenLine,
  Users,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard | GenTales",
  description: "Top writers on GenTales ranked by community engagement",
};

interface LeaderboardEntry {
  _id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  stories: number;
  totalLikes: number;
  totalReads: number;
  totalBookmarks: number;
  followers: number;
  score: number;
}

export default async function LeaderboardPage() {
  await connectDB();

  // Aggregate published stories per author
  const authorStats = await Story.aggregate([
    { $match: { status: "published", visibility: "public" } },
    {
      $group: {
        _id: "$authorId",
        stories: { $sum: 1 },
        totalLikes: { $sum: "$counts.likes" },
        totalReads: { $sum: "$counts.reads" },
        totalBookmarks: { $sum: "$counts.bookmarks" },
      },
    },
    { $sort: { totalLikes: -1 } },
    { $limit: 50 },
  ]);

  if (authorStats.length === 0) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No writers yet</h2>
          <p className="text-sm text-muted-foreground">
            Be the first to publish a story and claim the top spot!
          </p>
        </div>
      </section>
    );
  }

  const authorIds = authorStats.map((a) => a._id);
  const [users, followerCounts] = await Promise.all([
    User.find({ _id: { $in: authorIds } })
      .select("name username avatarUrl")
      .lean(),
    Follow.aggregate([
      { $match: { followingId: { $in: authorIds } } },
      { $group: { _id: "$followingId", count: { $sum: 1 } } },
    ]),
  ]);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const followerMap = new Map(
    followerCounts.map((f) => [String(f._id), f.count as number])
  );

  const leaderboard: LeaderboardEntry[] = authorStats
    .map((a) => {
      const user = userMap.get(String(a._id));
      if (!user) return null;
      const followers = followerMap.get(String(a._id)) || 0;
      // Engagement score: likes*3 + bookmarks*5 + reads + stories*10
      const score =
        a.totalLikes * 3 +
        a.totalBookmarks * 5 +
        a.totalReads +
        a.stories * 10;
      return {
        _id: String(a._id),
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        stories: a.stories,
        totalLikes: a.totalLikes,
        totalReads: a.totalReads,
        totalBookmarks: a.totalBookmarks,
        followers,
        score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score) as LeaderboardEntry[];

  const rankIcons = [
    <Crown key="1" className="w-5 h-5 text-yellow-500" />,
    <Medal key="2" className="w-5 h-5 text-zinc-400" />,
    <Medal key="3" className="w-5 h-5 text-amber-700" />,
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">Leaderboard</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-8">
        Top writers ranked by community engagement
      </p>

      <div className="space-y-3">
        {leaderboard.map((entry, i) => (
          <Link key={entry._id} href={`/u/${entry.username}`}>
            <Card className="hover:border-primary/20 transition-all group">
              <CardContent className="flex items-center gap-4 py-4">
                {/* Rank */}
                <div className="w-10 text-center flex-shrink-0">
                  {i < 3 ? (
                    rankIcons[i]
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.avatarUrl} alt={entry.name} />
                  <AvatarFallback className="text-sm font-semibold">
                    {entry.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Name / Username */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                    {entry.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{entry.username}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <PenLine className="w-3 h-3" />
                    {entry.stories}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {entry.totalLikes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {entry.totalReads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {entry.followers}
                  </span>
                </div>

                {/* Score */}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {entry.score.toLocaleString()} pts
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
