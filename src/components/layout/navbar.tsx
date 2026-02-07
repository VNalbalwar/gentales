"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  PenLine,
  Sun,
  Moon,
  Menu,
  X,
  Compass,
  User,
  LogIn,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/feed" as const, label: "Explore", icon: Compass, authRequired: false },
  { href: "/leaderboard" as const, label: "Leaderboard", icon: Trophy, authRequired: false },
  { href: "/editor" as const, label: "Write", icon: PenLine, authRequired: true },
] as const;

export function Navbar() {
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-border shadow-sm"
          : "bg-background/60 backdrop-blur-sm border-transparent"
      )}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">GenTales</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            if (link.authRequired && !isSignedIn) return null;
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-[18px] h-[18px]" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-[18px] h-[18px]" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {isSignedIn && user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/editor">
                <Button size="sm" className="gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Write
                </Button>
              </Link>
              <UserMenu
                user={{ name: user.fullName, image: user.imageUrl }}
              />
            </div>
          ) : (
            <Link href="/signin" className="hidden md:block">
              <Button size="sm" className="gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="text-lg font-bold">GenTales</SheetTitle>
              <Separator className="my-4" />
              <div className="space-y-1">
                <Link href="/feed" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Compass className="w-4 h-4" />
                    Explore Stories
                  </Button>
                </Link>
                <Link href="/leaderboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Trophy className="w-4 h-4" />
                    Leaderboard
                  </Button>
                </Link>
                {isSignedIn ? (
                  <>
                    <Link href="/editor" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3">
                        <PenLine className="w-4 h-4" />
                        Write a Story
                      </Button>
                    </Link>
                    <Link href="/profile" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3">
                        <User className="w-4 h-4" />
                        My Profile
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/signin" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full gap-2 mt-4">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
