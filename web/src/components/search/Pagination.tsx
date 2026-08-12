"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Хуудас {page} / {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          aria-label="Өмнөх хуудас"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
          aria-label="Дараагийн хуудас"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
