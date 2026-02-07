"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { useCallback, useEffect, useState, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Slash Command Items                                                */
/* ------------------------------------------------------------------ */

interface SlashItem {
  title: string;
  description: string;
  icon: string;
  command: (editor: ReturnType<typeof useEditor>) => void;
}

const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: "H1",
    command: (editor) =>
      editor?.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: "H2",
    command: (editor) =>
      editor?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: "H3",
    command: (editor) =>
      editor?.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list",
    icon: "•",
    command: (editor) => editor?.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: "1.",
    command: (editor) => editor?.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Blockquote",
    description: "Capture a quote",
    icon: "❝",
    command: (editor) => editor?.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Insert a code snippet",
    icon: "<>",
    command: (editor) => editor?.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Visual divider line",
    icon: "—",
    command: (editor) => editor?.chain().focus().setHorizontalRule().run(),
  },
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing your story… Type '/' for commands",
}: TiptapEditorProps) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashPos, setSlashPos] = useState<{ top: number; left: number } | null>(null);
  const slashRef = useRef<HTMLDivElement>(null);

  /* Floating toolbar state */
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredItems = SLASH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(slashFilter) ||
      item.description.toLowerCase().includes(slashFilter)
  );

  const closeSlash = useCallback(() => {
    setSlashOpen(false);
    setSlashFilter("");
    setSlashIndex(0);
    setSlashPos(null);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "tiptap-code-block" } },
        blockquote: { HTMLAttributes: { class: "tiptap-blockquote" } },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Typography,
    ],
    content: content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
      },
      handleKeyDown: (_view, event) => {
        if (slashOpen) {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSlashIndex((prev) => (prev + 1) % filteredItems.length);
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSlashIndex((prev) =>
              prev === 0 ? filteredItems.length - 1 : prev - 1
            );
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            selectSlashItem(slashIndex);
            return true;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            closeSlash();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());

      // Check for slash command
      const { from } = ed.state.selection;
      const textBefore = ed.state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        "\n"
      );
      const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);

      if (slashMatch) {
        setSlashFilter(slashMatch[1].toLowerCase());
        setSlashIndex(0);
        setSlashOpen(true);

        // Position the menu
        const coords = ed.view.coordsAtPos(from);
        const editorRect = ed.view.dom.getBoundingClientRect();
        setSlashPos({
          top: coords.bottom - editorRect.top + 8,
          left: coords.left - editorRect.left,
        });
      } else {
        closeSlash();
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      if (from === to) {
        setToolbarVisible(false);
        return;
      }

      // Text selected → show toolbar above selection
      const coords = ed.view.coordsAtPos(from);
      const endCoords = ed.view.coordsAtPos(to);
      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      if (!wrapperRect) return;

      const centerX =
        (coords.left + endCoords.left) / 2 - wrapperRect.left;
      const topY =
        Math.min(coords.top, endCoords.top) - wrapperRect.top - 50;

      setToolbarPos({
        top: Math.max(0, topY),
        left: Math.max(8, centerX - 120),
      });
      setToolbarVisible(true);
    },
  });

  // Sync external content changes (e.g., AI generates new content)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const selectSlashItem = useCallback(
    (index: number) => {
      const item = filteredItems[index];
      if (!item || !editor) return;

      // Delete the "/" and any filter text
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        "\n"
      );
      const match = textBefore.match(/\/([a-zA-Z0-9]*)$/);
      if (match) {
        editor
          .chain()
          .focus()
          .deleteRange({ from: from - match[0].length, to: from })
          .run();
      }

      item.command(editor);
      closeSlash();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, filteredItems, closeSlash]
  );

  if (!editor) return null;

  return (
    <div ref={wrapperRef} className="tiptap-wrapper relative">
      {/* Floating toolbar on text selection */}
      {toolbarVisible && (
        <div
          ref={toolbarRef}
          className="absolute z-50 transition-opacity duration-150"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-card border border-border shadow-lg">
            <ToolbarBtn
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic (Ctrl+I)"
            >
              <em>I</em>
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline (Ctrl+U)"
            >
              <span className="underline">U</span>
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            >
              <span className="line-through">S</span>
            </ToolbarBtn>
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarBtn
              active={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Inline Code"
            >
              {"</>"}
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive("highlight")}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              title="Highlight"
            >
              <span className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
                H
              </span>
            </ToolbarBtn>
          </div>
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Slash command menu */}
      {slashOpen && slashPos && filteredItems.length > 0 && (
        <div
          ref={slashRef}
          className="absolute z-50 w-72 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-xl"
          style={{ top: slashPos.top, left: slashPos.left }}
        >
          <div className="p-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-semibold">
              Blocks
            </p>
            {filteredItems.map((item, i) => (
              <button
                key={item.title}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSlashItem(i);
                }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${
                  i === slashIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toolbar Button                                                     */
/* ------------------------------------------------------------------ */

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
