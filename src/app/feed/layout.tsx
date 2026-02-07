"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Eye, Bookmark, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const TABS = [
  { label: "Latest", href: "/feed", icon: Clock },
  { label: "Most Viewed", href: "/feed/most-viewed", icon: Eye },
  { label: "Most Saved", href: "/feed/most-saved", icon: Bookmark },
] as const;

const GENRE_FILTERS = [
  { label: "All", value: "" },
  { label: "Fantasy", value: "Fantasy" },
  { label: "Sci-Fi", value: "Sci-Fi" },
  { label: "Romance", value: "Romance" },
  { label: "Mystery", value: "Mystery" },
  { label: "Thriller", value: "Thriller" },
  { label: "Horror", value: "Horror" },
  { label: "Adventure", value: "Adventure" },
  { label: "Comedy", value: "Comedy" },
  { label: "Drama", value: "Drama" },
  { label: "Historical", value: "Historical" },
  { label: "Literary Fiction", value: "Literary Fiction" },
  { label: "Dystopian", value: "Dystopian" },
  { label: "Slice of Life", value: "Slice of Life" },
  { label: "Fable", value: "Fable" },
  { label: "Mythology", value: "Mythology" },
];

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentGenre = searchParams.get("genre") || "";

  const buildGenreHref = (genre: string) => {
    const base = pathname;
    return genre ? `${base}?genre=${encodeURIComponent(genre)}` : base;
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Compass className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Discover{" "}
            <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
              Stories
            </span>
          </h1>
        </div>
        <p className="mt-2 text-muted-foreground text-sm sm:text-base">
          Browse the latest tales from our community of writers and AI.
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted border border-border mb-4 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/feed"
              ? pathname === "/feed"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="feed-tab"
                  className="absolute inset-0 bg-primary rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Genre Filter */}
      <ScrollArea className="w-full mb-8">
        <div className="flex gap-2 pb-2">
          {GENRE_FILTERS.map((genre) => {
            const isActive = currentGenre === genre.value;
            return (
              <Link key={genre.value} href={buildGenreHref(genre.value)}>
                <Badge
                  variant={isActive ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap hover:bg-primary/10 transition-colors"
                >
                  {genre.label}
                </Badge>
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Separator className="mb-8" />

      {children}
    </section>
  );
}
