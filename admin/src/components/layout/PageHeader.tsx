import { formatQty } from "@/lib/utils";

/** Title block at the top of a tab page; `children` holds search / filters. */
export default function PageHeader({
  title,
  count,
  aside,
  hideTitle,
  children,
}: {
  title: string;
  /** Keep the title for screen readers only (the home page shows just the date). */
  hideTitle?: boolean;
  /** Shown faintly after the title, in parentheses: how many items the list holds. */
  count?: number;
  /** Right of the title: a date or an action button. */
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="-mx-4 mb-1 space-y-4 border-b border-border px-4 pb-4 pt-5">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <h1 className={hideTitle ? "sr-only" : "min-w-0 truncate text-[22px] font-extrabold leading-tight"}>
          {title}
          {count != null && (
            <span className="ml-1.5 font-semibold text-muted-foreground/70">({formatQty(count)})</span>
          )}
        </h1>
        {aside}
      </div>
      {children}
    </div>
  );
}
