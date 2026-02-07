"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Wand2,
  Globe,
  Lock,
  Palette,
  Zap,
  ArrowRight,
  Star,
  Users,
  PenLine,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Writing",
    description:
      "Generate full stories or get AI assistance while you write. Continue your narrative, get plot suggestions, or polish your prose.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Palette,
    title: "Genre & Mood Engine",
    description:
      "Choose from 15 genres and 12 moods. The AI adapts its style to match your creative vision perfectly every time.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Wand2,
    title: "Notion-Like Editor",
    description:
      "Rich text editing with slash commands, floating toolbar, headings, lists, and more. Type / to access the command menu.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Globe,
    title: "Community Discovery",
    description:
      "Browse trending and latest stories, filter by genre, like and bookmark your favorites. Build your audience.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Zap,
    title: "Smart Analytics",
    description:
      "Intelligent view counting, engagement metrics, and detailed stats on your profile. Understand your audience.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Lock,
    title: "Private & Public",
    description:
      "Keep drafts private or publish publicly. Full control over your story's visibility at every stage of creation.",
    color: "from-slate-500 to-zinc-600",
  },
];

const GENRES = [
  {
    name: "Fantasy",
    emoji: "🧙‍♂️",
    bg: "from-violet-500/20 to-purple-500/20 border-violet-500/20 hover:border-violet-500/40",
  },
  {
    name: "Sci-Fi",
    emoji: "🚀",
    bg: "from-cyan-500/20 to-blue-500/20 border-cyan-500/20 hover:border-cyan-500/40",
  },
  {
    name: "Romance",
    emoji: "💕",
    bg: "from-pink-500/20 to-rose-500/20 border-pink-500/20 hover:border-pink-500/40",
  },
  {
    name: "Horror",
    emoji: "👻",
    bg: "from-red-500/20 to-orange-500/20 border-red-500/20 hover:border-red-500/40",
  },
  {
    name: "Mystery",
    emoji: "🔍",
    bg: "from-amber-500/20 to-yellow-500/20 border-amber-500/20 hover:border-amber-500/40",
  },
  {
    name: "Adventure",
    emoji: "⚔️",
    bg: "from-emerald-500/20 to-teal-500/20 border-emerald-500/20 hover:border-emerald-500/40",
  },
  {
    name: "Thriller",
    emoji: "🎬",
    bg: "from-slate-500/20 to-gray-500/20 border-slate-500/20 hover:border-slate-500/40",
  },
  {
    name: "Comedy",
    emoji: "😄",
    bg: "from-yellow-500/20 to-orange-500/20 border-yellow-500/20 hover:border-yellow-500/40",
  },
];

const STEPS = [
  {
    icon: PenLine,
    step: "01",
    title: "Choose Your Path",
    description:
      "Pick a genre, set the mood, or start from a blank canvas. Your story, your rules.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Write or Generate",
    description:
      "Craft your story manually or let AI help you build entire worlds in seconds.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Publish & Grow",
    description:
      "Share your tale with readers worldwide, track engagement, and build a following.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ============ Hero ============ */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-4 sm:px-6">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-[0.03] dark:opacity-[0.04]" />
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-[120px] animate-float" />
          <div
            className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-pink-500/8 dark:bg-pink-500/5 blur-[100px] animate-float"
            style={{ animationDelay: "3s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/3 blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          {/* Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <Badge
              variant="outline"
              className="gap-2 px-4 py-1.5 text-sm font-medium mb-8 bg-card/50 backdrop-blur-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Powered by Local AI
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Badge>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]"
          >
            Write Stories That
            <br />
            <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Captivate The World
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Create compelling narratives with AI assistance, publish to a
            thriving community, and discover stories from creators worldwide.
            Your imagination, amplified.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/feed">
              <Button size="lg" className="gap-2 px-7 shadow-lg">
                Explore Stories
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/editor">
              <Button variant="outline" size="lg" className="gap-2 px-7">
                <PenLine className="w-4 h-4" />
                Start Writing
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-20 flex items-center justify-center gap-8 sm:gap-12"
          >
            {[
              { icon: Star, value: "∞", label: "Possibilities" },
              { icon: Users, value: "AI + You", label: "Co-creation" },
              { icon: BookOpen, value: "Free", label: "Forever" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2 opacity-60" />
                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ Features ============ */}
      <section className="py-24 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-medium text-primary mb-3">FEATURES</p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything you need to create
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A complete storytelling toolkit designed for writers who want to
              push creative boundaries.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={scaleIn}
                  whileHover={{ y: -2 }}
                  className="group p-6 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ============ Genres ============ */}
      <section className="py-24 px-4 sm:px-6 bg-muted/50 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm font-medium text-primary mb-3">GENRES</p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Explore by genre
            </h2>
            <p className="mt-4 text-muted-foreground">
              Dive into stories across every world imaginable.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GENRES.map((genre, i) => (
              <motion.div
                key={genre.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={`/feed?genre=${genre.name.toLowerCase()}`}
                  className={`group flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-br ${genre.bg} transition-all`}
                >
                  <span className="text-2xl">{genre.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{genre.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
                      Explore <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ How It Works ============ */}
      <section className="py-24 px-4 sm:px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-medium text-primary mb-3">
              HOW IT WORKS
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Three steps to your story
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="relative text-center"
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary mb-2">
                    STEP {step.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[60%] w-[80%] border-t border-dashed border-border" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-24 px-4 sm:px-6 bg-muted/50 border-t border-border">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to tell your story?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Join a community of storytellers pushing the boundaries of
            creativity with the power of AI. Free forever.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signin">
              <Button size="lg" className="gap-2 px-8 shadow-lg">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" size="lg" className="px-8">
                Browse Stories
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
