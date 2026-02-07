"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GENRES, MOODS } from "@/lib/validators";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import {
  Bot,
  Sparkles,
  Save,
  Send,
  ArrowRight,
  Pencil,
  Lightbulb,
  MessageSquare,
  X,
  Plus,
  Globe,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface DraftState {
  title: string;
  contentMarkdown: string;
  summary: string;
  genre: string;
  mood: string;
  tags: string[];
  visibility: "public" | "private";
}

const INITIAL_DRAFT: DraftState = {
  title: "",
  contentMarkdown: "",
  summary: "",
  genre: "",
  mood: "",
  tags: [],
  visibility: "private",
};

type AIAction = "continue" | "rewrite" | "suggest" | "improve";

export default function EditorPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftState>(INITIAL_DRAFT);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiResult, setAIResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genKeywords, setGenKeywords] = useState("");
  const [genPrompt, setGenPrompt] = useState("");
  const [genError, setGenError] = useState<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback(
    (partial: Partial<DraftState>) =>
      setDraft((prev) => ({ ...prev, ...partial })),
    []
  );

  /* ---------------------------------------------------------------- */
  /*  Autosave                                                         */
  /* ---------------------------------------------------------------- */
  const buildPayload = useCallback((d: DraftState) => {
    return {
      title: d.title || undefined,
      content: d.contentMarkdown || undefined,
      summary: d.summary || undefined,
      genre: d.genre || undefined,
      mood: d.mood || undefined,
      tags: d.tags.length > 0 ? d.tags : undefined,
      visibility: d.visibility,
    };
  }, []);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const payload = buildPayload(draft);
      if (storyId) {
        await fetch(`/api/stories/${storyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data._id) setStoryId(data._id);
        }
      }
    } finally {
      setSaving(false);
    }
  }, [draft, storyId, buildPayload]);

  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (draft.title || draft.contentMarkdown) saveDraft();
    }, 2000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [draft, saveDraft]);

  /* ---------------------------------------------------------------- */
  /*  AI Generate Full Story                                           */
  /* ---------------------------------------------------------------- */
  const generateFullStory = async () => {
    if (!draft.genre) {
      setGenError("Please select a genre before generating.");
      return;
    }
    if (!genKeywords.trim()) {
      setGenError("Please enter at least one keyword.");
      return;
    }
    setGenError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/generate/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: draft.genre,
          mood: draft.mood || undefined,
          lengthTier: "short",
          keywords: genKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          prompt: genPrompt || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        update({
          title: data.title || draft.title,
          contentMarkdown: data.contentMarkdown || data.content || "",
          summary: data.summary || "",
          tags: data.tags?.length ? data.tags : draft.tags,
        });
        setShowGenerate(false);
        setGenError(null);
      } else {
        const err = await res
          .json()
          .catch(() => ({ error: "Generation failed" }));
        setGenError(err.error || "Generation failed. Please try again.");
      }
    } catch {
      setGenError("Network error — is Ollama running?");
    } finally {
      setGenerating(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  AI Assist                                                        */
  /* ---------------------------------------------------------------- */
  const runAIAssist = async (action: AIAction) => {
    if (!draft.contentMarkdown.trim()) return;
    setAILoading(true);
    setAIResult(null);
    try {
      const res = await fetch("/api/generate/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          content: draft.contentMarkdown,
          genre: draft.genre || undefined,
          mood: draft.mood || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (action === "continue") {
          update({
            contentMarkdown: draft.contentMarkdown + "\n\n" + data.result,
          });
        } else {
          setAIResult(data.result);
        }
      } else {
        const err = await res.json();
        setAIResult(`Error: ${err.error}`);
      }
    } finally {
      setAILoading(false);
    }
  };

  const applyAIResult = () => {
    if (aiResult) {
      update({ contentMarkdown: aiResult });
      setAIResult(null);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Publish                                                          */
  /* ---------------------------------------------------------------- */
  const publish = async () => {
    if (!draft.title.trim())
      return alert("Please add a title before publishing.");
    if (draft.contentMarkdown.length < 100)
      return alert("Your story needs at least 100 characters of content.");
    if (!draft.summary || draft.summary.length < 10)
      return alert("Please add a summary (at least 10 characters).");
    if (!draft.genre) return alert("Please select a genre.");
    if (draft.tags.length === 0) return alert("Please add at least one tag.");

    if (!storyId) await saveDraft();
    const id = storyId;
    if (!id) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/stories/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          content: draft.contentMarkdown,
          summary: draft.summary,
          tags: draft.tags,
          genre: draft.genre,
          visibility: draft.visibility,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/story/${data.slug}`);
      } else {
        const err = await res.json();
        alert(err.error || "Publishing failed. Please try again.");
      }
    } finally {
      setPublishing(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Tag helpers                                                      */
  /* ---------------------------------------------------------------- */
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !draft.tags.includes(tag) && draft.tags.length < 10) {
      update({ tags: [...draft.tags, tag] });
      setTagInput("");
    }
  };

  const removeTag = (t: string) =>
    update({ tags: draft.tags.filter((x) => x !== t) });

  const wordCount = draft.contentMarkdown
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">Story Editor</h1>
          <Badge
            variant={saving ? "outline" : storyId ? "secondary" : "outline"}
            className={cn(
              "gap-1.5 text-xs",
              saving && "text-amber-500 border-amber-500/30",
              !saving && storyId && "text-emerald-500"
            )}
          >
            <Save className={cn("w-3 h-3", saving && "animate-pulse")} />
            {saving ? "Saving…" : storyId ? "Draft saved" : "New draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showGenerate ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGenerate(!showGenerate)}
            className="gap-1.5"
          >
            <Bot className="w-4 h-4" />
            AI Generate
          </Button>
          <Button
            variant={showAI ? "default" : "secondary"}
            size="sm"
            onClick={() => setShowAI(!showAI)}
            className="gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            AI Assist
          </Button>
        </div>
      </div>

      {/* AI Generate Panel */}
      <AnimatePresence>
        {showGenerate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  🤖 Generate Full Story with AI
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label className="text-xs">Genre *</Label>
                    <Select
                      value={draft.genre}
                      onValueChange={(v) => {
                        update({ genre: v });
                        setGenError(null);
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Mood</Label>
                    <Select
                      value={draft.mood}
                      onValueChange={(v) => update({ mood: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Any mood" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <Label className="text-xs">Keywords *</Label>
                    <Input
                      placeholder="e.g. dragon, castle, princess"
                      value={genKeywords}
                      onChange={(e) => {
                        setGenKeywords(e.target.value);
                        setGenError(null);
                      }}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Creative direction</Label>
                    <Input
                      placeholder="Optional — guide the story"
                      value={genPrompt}
                      onChange={(e) => setGenPrompt(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {genError && (
                  <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg mb-4">
                    {genError}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    onClick={generateFullStory}
                    disabled={generating}
                  >
                    {generating
                      ? "✨ Generating… (this may take a minute)"
                      : "Generate Story"}
                  </Button>
                  {generating && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGenerating(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-6">
        {/* Main Editor */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <input
            type="text"
            placeholder="Your story title…"
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-3"
            maxLength={200}
          />

          {/* Summary */}
          <input
            type="text"
            placeholder="A short hook for your story (optional)"
            value={draft.summary}
            onChange={(e) => update({ summary: e.target.value })}
            className="w-full text-sm bg-transparent border-b border-border outline-none placeholder:text-muted-foreground/50 pb-3 mb-6 focus:border-primary transition-colors"
            maxLength={500}
          />

          {/* Tiptap Editor */}
          <TiptapEditor
            content={draft.contentMarkdown}
            onChange={(html) => update({ contentMarkdown: html })}
            placeholder="Start writing your story…"
          />

          {/* Word count */}
          <div className="mt-2 text-xs text-muted-foreground text-right">
            {wordCount} words · ~{Math.max(1, Math.ceil(wordCount / 200))} min
            read
          </div>

          <Separator className="my-6" />

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Genre</Label>
              <Select
                value={draft.genre}
                onValueChange={(v) => update({ genre: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Mood</Label>
              <Select
                value={draft.mood}
                onValueChange={(v) => update({ mood: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <Label className="text-xs">Tags (up to 10)</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {draft.tags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="gap-1 cursor-default"
                >
                  #{t}
                  <button
                    onClick={() => removeTag(t)}
                    className="hover:text-destructive ml-0.5"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                maxLength={30}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addTag}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Publish bar */}
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                {draft.visibility === "public" ? (
                  <Globe className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
                <Select
                  value={draft.visibility}
                  onValueChange={(v) =>
                    update({ visibility: v as "public" | "private" })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={publish}
                disabled={publishing || !draft.title}
                className="gap-2 px-8 shadow-sm"
              >
                <Send className="w-4 h-4" />
                {publishing ? "Publishing…" : "Publish"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Assist Sidebar */}
        <AnimatePresence>
          {showAI && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block flex-shrink-0 overflow-hidden"
            >
              <Card className="w-80 sticky top-24">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> AI
                      Assistant
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowAI(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(
                      [
                        {
                          action: "continue" as AIAction,
                          label: "Continue Writing",
                          Icon: ArrowRight,
                          desc: "Add more to your story",
                        },
                        {
                          action: "rewrite" as AIAction,
                          label: "Rewrite & Polish",
                          Icon: Pencil,
                          desc: "Improve your prose",
                        },
                        {
                          action: "suggest" as AIAction,
                          label: "Plot Suggestions",
                          Icon: Lightbulb,
                          desc: "Get story direction ideas",
                        },
                        {
                          action: "improve" as AIAction,
                          label: "Get Feedback",
                          Icon: MessageSquare,
                          desc: "Writing improvement tips",
                        },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.action}
                        onClick={() => runAIAssist(item.action)}
                        disabled={
                          aiLoading || !draft.contentMarkdown.trim()
                        }
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-accent transition-all disabled:opacity-50 group"
                      >
                        <div className="flex items-center gap-2">
                          <item.Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>

                  {aiLoading && (
                    <div className="mt-4 p-4 rounded-lg bg-muted text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                        AI is thinking…
                      </div>
                    </div>
                  )}

                  {aiResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4"
                    >
                      <div className="p-4 rounded-lg bg-muted border border-border max-h-64 overflow-y-auto">
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {aiResult}
                        </p>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" className="flex-1" onClick={applyAIResult}>
                          Apply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setAIResult(null)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
