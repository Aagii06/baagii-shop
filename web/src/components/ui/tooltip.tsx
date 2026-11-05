"use client";

import { cn } from "@/lib/utils";
import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const GAP = 10; // trigger ↔ bubble
const EDGE = 8; // keep this far from the viewport sides

type Pos = { left: number; top: number; arrowLeft: number; side: "top" | "bottom" };

type TriggerProps = {
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  "aria-describedby"?: string;
};

/**
 * Styled hover / focus tooltip. Rendered in a portal with fixed positioning
 * so a scrolling or overflow-hidden parent can't clip it. Sits above the
 * trigger, flips below when there is no room, and stays inside the viewport.
 */
export default function Tooltip({
  content,
  children,
  delay = 120,
  className,
}: {
  content: ReactNode;
  /** One element that accepts mouse / focus handlers (a button, a link…). */
  children: ReactElement<TriggerProps>;
  delay?: number;
  className?: string;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  const show = (el: HTMLElement) => {
    triggerRef.current = el;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
    setPos(null);
  }, []);

  // Measure once the bubble is in the DOM, before paint.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !bubbleRef.current) return;
    const t = triggerRef.current.getBoundingClientRect();
    const b = bubbleRef.current.getBoundingClientRect();
    const center = t.left + t.width / 2;
    const left = Math.min(
      Math.max(center - b.width / 2, EDGE),
      window.innerWidth - b.width - EDGE
    );
    const side = t.top - b.height - GAP >= EDGE ? "top" : "bottom";
    const top = side === "top" ? t.top - b.height - GAP : t.bottom + GAP;
    const arrowLeft = Math.min(Math.max(center - left, 14), b.width - 14);
    setPos({ left, top, arrowLeft, side });
  }, [open]);

  // Positions go stale on scroll / resize: just close.
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [open, hide]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const child = children.props;
  const trigger = cloneElement(children, {
    "aria-describedby": open ? id : child["aria-describedby"],
    onMouseEnter: (e) => {
      child.onMouseEnter?.(e);
      show(e.currentTarget as HTMLElement);
    },
    onMouseLeave: (e) => {
      child.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e) => {
      child.onFocus?.(e);
      show(e.currentTarget as HTMLElement);
    },
    onBlur: (e) => {
      child.onBlur?.(e);
      hide();
    },
  });

  return (
    <>
      {trigger}
      {open &&
        createPortal(
          <div
            ref={bubbleRef}
            id={id}
            role="tooltip"
            style={{
              left: pos?.left ?? 0,
              top: pos?.top ?? 0,
              visibility: pos ? "visible" : "hidden",
            }}
            className={cn(
              "pointer-events-none fixed z-[100] max-w-64 rounded-xl bg-foreground px-3 py-2 text-background shadow-xl shadow-black/20 ring-1 ring-white/10",
              pos && "tooltip-in",
              pos?.side === "bottom"
                ? "origin-top [--tooltip-shift:-4px]"
                : "origin-bottom",
              className
            )}
          >
            {content}
            {pos && (
              <span
                aria-hidden
                style={{ left: pos.arrowLeft }}
                className={cn(
                  "absolute size-2.5 -translate-x-1/2 rotate-45 bg-foreground",
                  pos.side === "top" ? "-bottom-1" : "-top-1"
                )}
              />
            )}
          </div>,
          document.body
        )}
    </>
  );
}
