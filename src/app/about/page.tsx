import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  Users,
  Cpu,
  Heart,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About | GenTales",
  description:
    "Learn about GenTales — an AI-powered storytelling platform where creativity meets technology.",
};

export default function AboutPage() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          About{" "}
          <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
            GenTales
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          GenTales is an AI-powered storytelling platform where imagination
          meets technology. Write, generate, and discover captivating stories
          across every genre.
        </p>
      </div>

      {/* Mission */}
      <Card className="mb-10">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            We believe everyone has a story to tell. GenTales empowers writers —
            whether seasoned authors or first-time storytellers — to craft
            compelling narratives with the assistance of cutting-edge AI.
            Our platform bridges the gap between creative vision and
            technical execution, making quality storytelling accessible to all.
          </p>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        {[
          {
            icon: Sparkles,
            title: "AI-Powered Generation",
            description:
              "Leverage local AI models to generate stories, outlines, and creative prompts. You stay in control of every word.",
          },
          {
            icon: Users,
            title: "Community Driven",
            description:
              "Discover stories from fellow writers, follow your favorites, and build a community around shared creativity.",
          },
          {
            icon: Cpu,
            title: "Privacy First",
            description:
              "AI runs locally via Ollama — your stories and prompts never leave your infrastructure. Your creativity is yours.",
          },
          {
            icon: Heart,
            title: "Built with Love",
            description:
              "Open-source at heart, built with modern web technologies for a fast, beautiful, and reliable experience.",
          },
        ].map((feature) => (
          <Card key={feature.title}>
            <CardContent className="pt-6">
              <feature.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-10" />

      {/* Creator */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-4">Meet the Creator</h2>
        <div className="max-w-lg mx-auto">
          <p className="text-lg font-medium">Viraj Nalbalwar</p>
          <p className="text-muted-foreground text-sm mt-1">
            Computer Science &amp; Engineering Student
          </p>
          <p className="text-muted-foreground text-sm">
            COEP Technological University, Pune
          </p>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
            Passionate about building products that merge AI with creativity.
            GenTales is a vision to democratize storytelling by making
            AI-powered writing tools accessible, private, and delightful.
          </p>
          <a href="mailto:virajnalbalwar@gmail.com">
            <Button variant="outline" size="sm" className="mt-4">
              virajnalbalwar@gmail.com
            </Button>
          </a>
        </div>
      </div>

      {/* Tech Stack */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Technology Stack</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              "Next.js 16",
              "React 19",
              "TypeScript",
              "Tailwind CSS v4",
              "MongoDB",
              "Mongoose",
              "Clerk Auth",
              "Ollama AI",
              "shadcn/ui",
              "Tiptap Editor",
              "Framer Motion",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border"
              >
                {tech}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">
          Ready to start your storytelling journey?
        </p>
        <Link href="/editor">
          <Button size="lg" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Start Writing
          </Button>
        </Link>
      </div>
    </section>
  );
}
