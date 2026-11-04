"use client";

import { createElement, useEffect, useState, type ReactNode } from "react";

const HTML_TAG = /<(?:p|br|strong|b|em|i|u|s|del|ul|ol|li|a|h[1-6]|blockquote|pre|code|hr)\b[^>]*>/i;
const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "strong",
  "u",
  "ul",
]);
const BLOCKED_TAGS = new Set(["iframe", "object", "script", "style", "svg", "template"]);

/** `<p></p>` гэх мэт текстгүй тайлбар эсэх. */
export function isEmptyDescription(value: string | null | undefined) {
  if (!value) return true;
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}

function safeHref(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

function renderNode(node: ChildNode, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (!(node instanceof Element)) return null;

  const tag = node.tagName.toLowerCase();
  if (BLOCKED_TAGS.has(tag)) return null;

  const children = Array.from(node.childNodes).map((child, index) =>
    renderNode(child, `${key}-${index}`)
  );

  if (tag === "a") {
    const href = safeHref(node.getAttribute("href"));
    return href ? (
      <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    ) : (
      <span key={key}>{children}</span>
    );
  }

  if (!ALLOWED_TAGS.has(tag)) return <span key={key}>{children}</span>;
  return createElement(tag, { key }, ...children);
}

function parseDescription(value: string): ReactNode {
  const document = new DOMParser().parseFromString(value, "text/html");
  return Array.from(document.body.childNodes).map((node, index) =>
    renderNode(node, String(index))
  );
}

export default function RichDescription({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const hasHtml = HTML_TAG.test(value);
  const [parsed, setParsed] = useState<{ value: string; content: ReactNode } | null>(null);

  useEffect(() => {
    if (hasHtml) setParsed({ value, content: parseDescription(value) });
  }, [hasHtml, value]);

  const content = hasHtml
    ? parsed?.value === value
      ? parsed.content
      : null
    : value;

  return (
    <div
      className={`whitespace-pre-wrap [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p+p]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 ${className ?? ""}`}
    >
      {content}
    </div>
  );
}
