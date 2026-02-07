"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Flag,
  MessageSquare,
  ScrollText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Stories", href: "/admin/stories", icon: BookOpen },
  { label: "Reports", href: "/admin/reports", icon: Flag },
  { label: "Comments", href: "/admin/comments", icon: MessageSquare },
  { label: "Activity Log", href: "/admin/activity", icon: ScrollText },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r bg-muted/30 hidden md:block">
      <div className="sticky top-16 p-4 space-y-1">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Admin Panel</p>
            <p className="text-[11px] text-muted-foreground">GenTales</p>
          </div>
        </div>

        {/* Nav Items */}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
