"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Flag,
  Search,
  CheckCircle,
  AlertTriangle,
  Eye,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ReportData {
  _id: string;
  reason: string;
  details: string;
  status: string;
  storyId: { _id: string; title: string; slug: string } | null;
  reporterId: { _id: string; name: string; username: string } | null;
  createdAt: string;
}

const REPORT_STATUSES = ["", "open", "reviewed", "actioned"];
const REPORT_REASONS = [
  "",
  "spam",
  "harassment",
  "hate-speech",
  "violence",
  "misinformation",
  "other",
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState("open");
  const [reasonFilter, setReasonFilter] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchReports = useCallback(
    async (skip = 0, append = false) => {
      const params = new URLSearchParams({ skip: String(skip), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (reasonFilter) params.set("reason", reasonFilter);

      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      if (append) {
        setReports((prev) => [...prev, ...data.reports]);
      } else {
        setReports(data.reports);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
    },
    [statusFilter, reasonFilter]
  );

  useEffect(() => {
    setLoading(true);
    fetchReports(0).finally(() => setLoading(false));
  }, [fetchReports]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchReports(reports.length, true);
    setLoadingMore(false);
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setActionInProgress(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
        );
        toast.success(`Report marked as ${newStatus}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleHideStory = async (reportId: string, storyId: string) => {
    setActionInProgress(reportId);
    try {
      const hideRes = await fetch(`/api/admin/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hide" }),
      });
      if (hideRes.ok) {
        await fetch(`/api/admin/reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "actioned" }),
        });
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, status: "actioned" } : r))
        );
        toast.success("Story hidden & report actioned");
      } else {
        toast.error("Failed to hide story");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionInProgress(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "open": return "destructive";
      case "reviewed": return "secondary";
      case "actioned": return "outline";
      default: return "secondary";
    }
  };

  const reasonLabel = (reason: string) => reason.replace("-", " ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flag className="w-6 h-6 text-primary" />
          Reports &amp; Moderation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} reports {statusFilter ? `(${statusFilter})` : ""}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Statuses</option>
              {REPORT_STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Reasons</option>
              {REPORT_REASONS.filter(Boolean).map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1).replace("-", " ")}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Reason</th>
                    <th className="pb-3 font-medium text-muted-foreground">Story</th>
                    <th className="pb-3 font-medium text-muted-foreground">Reporter</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-muted/50">
                      <td className="py-3">
                        <div>
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {reasonLabel(report.reason)}
                          </Badge>
                          {report.details && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] line-clamp-2">
                              {report.details}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        {report.storyId ? (
                          <Link
                            href={`/story/${report.storyId.slug}`}
                            className="text-sm hover:text-primary flex items-center gap-1"
                            target="_blank"
                          >
                            <span className="line-clamp-1">{report.storyId.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Deleted</span>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {report.reporterId ? (
                          <Link
                            href={`/u/${report.reporterId.username}`}
                            className="hover:text-foreground"
                          >
                            @{report.reporterId.username}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant={statusColor(report.status) as "destructive" | "secondary" | "outline"} className="text-[10px]">
                          {report.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionInProgress === report._id}
                            >
                              {actionInProgress === report._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Actions"
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {report.storyId && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/story/${report.storyId.slug}`} target="_blank">
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Story
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {report.status === "open" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(report._id, "reviewed")}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                                  Dismiss (Reviewed)
                                </DropdownMenuItem>
                                {report.storyId && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleHideStory(report._id, (report.storyId as { _id: string })._id)
                                    }
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                                    Hide Story &amp; Action
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {report.status === "reviewed" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(report._id, "open")}
                              >
                                <Flag className="w-4 h-4 mr-2 text-red-500" />
                                Re-open
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                Load More ({reports.length} of {total})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
