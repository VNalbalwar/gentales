import Link from "next/link";
import { BookOpen, Github, Twitter, Heart, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const LINKS = {
  product: [
    { label: "Explore Stories", href: "/feed" },
    { label: "Write a Story", href: "/editor" },
    { label: "Most Viewed", href: "/feed/most-viewed" },
    { label: "Leaderboard", href: "/leaderboard" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "/contact" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-base font-bold tracking-tight">
                GenTales
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[240px]">
              Where stories come alive through imagination and AI. Write,
              generate, and discover tales.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {LINKS.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {LINKS.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Connect
            </h4>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <a href="https://github.com/VNalbalwar" aria-label="GitHub">
                  <Github className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="https://www.linkedin.com/in/viraj-nalbalwar-895365255/" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} GenTales. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Built with{" "}
            <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> using
            Next.js, MongoDB &amp; Ollama AI
          </p>
        </div>
      </div>
    </footer>
  );
}
