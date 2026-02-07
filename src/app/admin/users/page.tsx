"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  ChevronDown,
  Loader2,
  UserCog,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";

interface UserData {
  _id: string;
  name: string;
  username: string;
  email?: string;
  roles: string[];
  status: string;
  createdAt: string;
  storyCount: number;
}

const ROLES = ["", "user", "admin", "moderator"];
const STATUSES = ["", "active", "suspended", "banned"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (skip = 0, append = false) => {
      const params = new URLSearchParams({ skip: String(skip), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      if (append) {
        setUsers((prev) => [...prev, ...data.users]);
      } else {
        setUsers(data.users);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
    },
    [search, roleFilter, statusFilter]
  );

  useEffect(() => {
    setLoading(true);
    fetchUsers(0).finally(() => setLoading(false));
  }, [fetchUsers]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchUsers(users.length, true);
    setLoadingMore(false);
  };

  const handleAction = async (userId: string, action: string) => {
    setActionInProgress(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId
              ? { ...u, roles: data.user.roles, status: data.user.status }
              : u
          )
        );
        toast.success(`User ${action} successfully`);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="w-6 h-6 text-primary" />
          User Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} total users
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Roles</option>
              {ROLES.filter(Boolean).map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Statuses</option>
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">User</th>
                    <th className="pb-3 font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 font-medium text-muted-foreground">Roles</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Stories</th>
                    <th className="pb-3 font-medium text-muted-foreground">Joined</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-muted/50">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{user.email || "—"}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={
                                role === "admin"
                                  ? "destructive"
                                  : role === "moderator"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            user.status === "active"
                              ? "secondary"
                              : user.status === "suspended"
                              ? "outline"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{user.storyCount}</td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionInProgress === user._id}
                              className="gap-1"
                            >
                              {actionInProgress === user._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  Actions
                                  <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Status actions */}
                            {user.status !== "active" && (
                              <DropdownMenuItem onClick={() => handleAction(user._id, "activate")}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {user.status !== "suspended" && (
                              <DropdownMenuItem onClick={() => handleAction(user._id, "suspend")}>
                                <ShieldOff className="w-4 h-4 mr-2 text-amber-500" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {user.status !== "banned" && (
                              <DropdownMenuItem onClick={() => handleAction(user._id, "ban")}>
                                <Ban className="w-4 h-4 mr-2 text-red-500" />
                                Ban
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {/* Role actions */}
                            {!user.roles.includes("admin") ? (
                              <DropdownMenuItem onClick={() => handleAction(user._id, "promote-admin")}>
                                <Shield className="w-4 h-4 mr-2 text-primary" />
                                Promote to Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleAction(user._id, "demote-admin")}>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Remove Admin
                              </DropdownMenuItem>
                            )}
                            {!user.roles.includes("moderator") ? (
                              <DropdownMenuItem onClick={() => handleAction(user._id, "promote-moderator")}>
                                <Shield className="w-4 h-4 mr-2" />
                                Promote to Moderator
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleAction(user._id, "demote-moderator")}>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Remove Moderator
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
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Load More ({users.length} of {total})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
