import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Story } from "@/lib/db/models/story";
import { Report } from "@/lib/db/models/report";
import { Comment } from "@/lib/db/models/comment";
import { Reaction } from "@/lib/db/models/reaction";
import { Follow } from "@/lib/db/models/follow";
import { ModerationAction } from "@/lib/db/models/moderation-action";
import {
  Users,
  BookOpen,
  Eye,
  Heart,
  Bookmark,
  Flag,
  MessageSquare,
  UserPlus,
  TrendingUp,
  AlertTriangle,
  Shield,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await connectDB();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel
  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    bannedUsers,
    suspendedUsers,
    totalStories,
    publishedStories,
    draftStories,
    hiddenStories,
    storiesThisWeek,
    totalComments,
    openReports,
    totalReports,
    totalLikes,
    totalBookmarks,
    totalFollows,
    recentModerationActions,
    recentUsers,
    recentStories,
    recentReports,
    topStories,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ status: "banned" }),
    User.countDocuments({ status: "suspended" }),
    Story.countDocuments(),
    Story.countDocuments({ status: "published" }),
    Story.countDocuments({ status: "draft" }),
    Story.countDocuments({ status: "hidden" }),
    Story.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Comment.countDocuments(),
    Report.countDocuments({ status: "open" }),
    Report.countDocuments(),
    Reaction.countDocuments({ type: "like" }),
    Reaction.countDocuments({ type: "bookmark" }),
    Follow.countDocuments(),
    ModerationAction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("adminId", "name username")
      .lean(),
    User.find().sort({ createdAt: -1 }).limit(5).select("name username email roles status createdAt").lean(),
    Story.find({ status: "published" })
      .sort({ publishedAt: -1 })
      .limit(5)
      .select("title slug authorId counts publishedAt status")
      .populate("authorId", "name username")
      .lean(),
    Report.find({ status: "open" }).sort({ createdAt: -1 }).limit(5).lean(),
    Story.find({ status: "published", visibility: "public" })
      .sort({ "counts.reads": -1 })
      .limit(5)
      .select("title slug counts")
      .lean(),
  ]);

  // Aggregate total reads across all stories
  const readAgg = await Story.aggregate([
    { $group: { _id: null, total: { $sum: "$counts.reads" } } },
  ]);
  const totalReads = readAgg[0]?.total || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform overview and key metrics
        </p>
      </div>

      {/* Alert: Open Reports */}
      {openReports > 0 && (
        <Link href="/admin/reports">
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {openReports} open {openReports === 1 ? "report" : "reports"} require attention
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Click to review and take action
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total Users" value={totalUsers} sub={`+${newUsersWeek} this week`} />
        <KPICard icon={BookOpen} label="Published Stories" value={publishedStories} sub={`${draftStories} drafts · ${hiddenStories} hidden`} />
        <KPICard icon={Eye} label="Total Reads" value={totalReads} />
        <KPICard icon={Heart} label="Total Likes" value={totalLikes} />
        <KPICard icon={Bookmark} label="Total Bookmarks" value={totalBookmarks} />
        <KPICard icon={MessageSquare} label="Comments" value={totalComments} />
        <KPICard icon={UserPlus} label="Follows" value={totalFollows} />
        <KPICard icon={Flag} label="Open Reports" value={openReports} sub={`${totalReports} total`} alert={openReports > 0} />
      </div>

      {/* User Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatRow label="Active Users" value={totalUsers - bannedUsers - suspendedUsers} />
              <StatRow label="Suspended" value={suspendedUsers} variant={suspendedUsers > 0 ? "warning" : "default"} />
              <StatRow label="Banned" value={bannedUsers} variant={bannedUsers > 0 ? "danger" : "default"} />
              <Separator />
              <StatRow label="New Today" value={newUsersToday} variant="success" />
              <StatRow label="New This Week" value={newUsersWeek} variant="success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Content Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatRow label="Published" value={publishedStories} />
              <StatRow label="Drafts" value={draftStories} />
              <StatRow label="Hidden (moderated)" value={hiddenStories} variant={hiddenStories > 0 ? "warning" : "default"} />
              <Separator />
              <StatRow label="Total Stories" value={totalStories} />
              <StatRow label="New This Week" value={storiesThisWeek} variant="success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Recent Users
            </CardTitle>
            <Link href="/admin/users" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={String(u._id)} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(u.roles as string[]).includes("admin") && (
                      <Badge variant="destructive" className="text-[10px]">Admin</Badge>
                    )}
                    <Badge
                      variant={u.status === "active" ? "secondary" : "destructive"}
                      className="text-[10px]"
                    >
                      {u.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Stories by Reads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Stories by Reads
            </CardTitle>
            <Link href="/admin/stories" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStories.map((s, i) => (
                <div key={String(s._id)} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground font-mono w-5">#{i + 1}</span>
                    <p className="font-medium truncate">{s.title}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-2">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatN(s.counts.reads)}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatN(s.counts.likes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Moderation Actions */}
      {recentModerationActions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Moderation Actions
            </CardTitle>
            <Link href="/admin/activity" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentModerationActions.map((a) => {
                const admin = a.adminId as unknown as { name: string; username: string } | null;
                return (
                  <div
                    key={String(a._id)}
                    className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={a.action === "hide" || a.action === "ban" ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {a.action}
                      </Badge>
                      <span className="text-muted-foreground">
                        {a.targetType} by{" "}
                        <span className="font-medium text-foreground">
                          {admin?.name || "Unknown"}
                        </span>
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? "border-amber-400 dark:border-amber-700" : ""}>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-4 h-4 ${alert ? "text-amber-500" : "text-muted-foreground"}`} />
        </div>
        <div className="text-2xl font-bold">{formatN(value)}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatRow({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const colors = {
    default: "text-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${colors[variant]}`}>{formatN(value)}</span>
    </div>
  );
}

function formatN(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
