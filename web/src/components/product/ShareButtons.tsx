"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Check, Facebook, Link2, Send, Share2 } from "lucide-react";
import { useEffect, useState, type SVGProps } from "react";

// X (formerly Twitter) logo; lucide only ships the old bird.
function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type Props = {
  title: string;
  /** Same-site path to share (e.g. `/product/12`); defaults to the current page. */
  path?: string;
  /** "light" = white buttons for a dark/gradient background. */
  variant?: "default" | "light";
  /** Hide the "Share" label. */
  compact?: boolean;
  className?: string;
};

// Share links: Facebook, X, Telegram, copy link, and the phone's own share
// sheet where the browser offers one.
export default function ShareButtons({
  title,
  path,
  variant = "default",
  compact = false,
  className,
}: Props) {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(path ? window.location.origin + path : window.location.href);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, [path]);

  const u = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const links = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      icon: Facebook,
      color: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
    },
    {
      label: "X",
      href: `https://x.com/intent/post?url=${u}&text=${text}`,
      icon: XLogo,
      color: "hover:bg-black hover:text-white hover:border-black",
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${u}&text=${text}`,
      icon: Send,
      color: "hover:bg-[#229ED9] hover:text-white hover:border-[#229ED9]",
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = () => {
    navigator.share({ title, url }).catch(() => {});
  };

  const light = variant === "light";
  const btn = light
    ? "grid size-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
    : "grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors";
  const accent = light
    ? ""
    : "hover:bg-primary hover:text-primary-foreground hover:border-primary";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!compact && (
        <span className={cn("mr-1 text-sm", light ? "text-white/80" : "text-muted-foreground")}>
          {t("product.share")}
        </span>
      )}
      {links.map(({ label, href, icon: Icon, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={cn(btn, !light && color)}
        >
          <Icon className="size-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label={t("product.copyLink")}
        title={copied ? t("product.linkCopied") : t("product.copyLink")}
        className={cn(
          btn,
          copied
            ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600"
            : accent
        )}
      >
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          aria-label={t("product.share")}
          title={t("product.share")}
          className={cn(btn, accent)}
        >
          <Share2 className="size-4" />
        </button>
      )}
    </div>
  );
}
