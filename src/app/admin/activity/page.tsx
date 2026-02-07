"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Loader2,
  Shield,
  UserX,
  UserCheck,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActivityData {
  _id: string;
  action: string;
  targetType: string;
  targetId: string;
  adminId: { _id: string; name: string; username: string } | null;
  note: string;
  createdAt: string;
}

const ACTION_FILTER = ["", "hide", "restore", "ban", "unban", "delete", "promote", "demote", "suspend", "activate"];
const TARGET_FILTER = ["", "story", "user", "comment"];

export default function AdminActivityPage() {
  const [actions, setActions] = useState<ActivityData[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");

  const fetchActions = useCallback(
    async (skip = 0, append = false) => {
      const params = new URLSearchParams({ skip: String(skip), limit: "30" });
      if (actionFilter) params.set("action", actionFilter);
      if (targetFilter) params.set("targetType", targetFilter);

      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      if (append) {
        setActions((prev) => [...prev, ...data.actions]);
      } else {
        setActions(data.actions);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
    },
    [actionFilter, targetFilter]
  );

  useEffect(() => {
    setLoading(true);
    fetchActions(0).finally(() => setLoading(false));
  }, [fetchActions]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchActions(actions.length, true);
    setLoadingMore(false);
  };

  const actionIcon = (action: string) => {
    switch (action) {
      case "hide": return <EyeOff className="w-4 h-4 text-amber-500" />;
      case "restore": return <RotateCcw className="w-4 h-4 text-green-500" />;
      case "ban": return <UserX className="w-4 h-4 text-red-500" />;
      case "unban": return <UserCheck className="w-4 h-4 text-green-500" />;
      case "delete": return <EyeOff className="w-4 h-4 text-red-600" />;
      default: return <Shield className="w-4 h-4 text-blue-500" />;
    }
  };

  const actionColor = (action: string) => {
    switch (action) {
      case "hide":
      case "suspend": return "secondary";
      case "ban":
      case "delete": return "destructive";
      case "restore":
      case "unban":
      case "activate": return "outline";
      default: return "secondary";
    }
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          Activity &amp; Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} moderation actions recorded
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Actions</option>
              {ACTION_FILTER.filter(Boolean).map((a) => (
                <option key={a} value={a}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Targets</option>
              {TARGET_FILTER.filter(Boolean).map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : actions.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No activity recorded</p>
            </div>
          ) : (
            <div className="space-y-0">
              {actions.map((entry, i) => (
                <div
                  key={entry._id}
                  className="flex items-start gap-4 py-4 border-b last:border-0"
                >
                  {/* Icon */}
                  <div className="mt-0.5 shrink-0">{actionIcon(entry.action)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={actionColor(entry.action) as "secondary" | "destructive" | "outline"}
                        className="text-[10px] uppercase font-semibold"
                      >
                        {entry.action}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {entry.targetType}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {entry.targetId.slice(-8)}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>
                        by{" "}
                        {entry.adminId ? (
                          <span className="font-medium text-foreground">
                            @{entry.adminId.username}
                          </span>
                        ) : (
                          "System"
                        )}
                      </span>
                      <span>•</span>
                      <span>{formatTimestamp(entry.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Load More ({actions.length} of {total})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
