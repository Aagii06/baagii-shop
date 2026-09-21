import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** Sticky back-button header for pages below a tab (product edit, order detail). */
export default function DetailHeader({
  backHref,
  title,
  subtitle,
  aside,
}: {
  backHref: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 flex min-h-[4.25rem] items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <Link
        href={backHref}
        aria-label="Буцах"
        className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-white transition-colors hover:bg-muted"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <div className="min-w-0 grow">
        <h1 className="truncate text-lg font-extrabold leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {aside}
    </header>
  );
}
