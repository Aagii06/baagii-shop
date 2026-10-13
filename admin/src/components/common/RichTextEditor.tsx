"use client";

import { Button } from "@/components/ui/button";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Underline as UnderlineIcon } from "lucide-react";
import { useEffect } from "react";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: "Барааны тайлбарыг оруулна уу...",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[180px] w-full bg-white px-4 py-3 text-[15px] leading-7 text-foreground focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL оруулна уу", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const buttonClass =
    "h-9 rounded-full border border-border bg-white px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15";

  return (
    <div className="overflow-hidden rounded-2xl border border-input bg-white">
      <div className="flex flex-wrap gap-2 border-b border-border bg-muted/40 p-2">
        <Button type="button" variant="ghost" size="sm" className={buttonClass} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold">
          <Bold className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={buttonClass} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic">
          <Italic className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={buttonClass} onClick={() => editor.chain().focus().toggleUnderline().run()} aria-label="Underline">
          <UnderlineIcon className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={buttonClass} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list">
          <List className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={buttonClass} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Ordered list">
          <ListOrdered className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={buttonClass} onClick={addLink} aria-label="Link">
          <LinkIcon className="size-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
