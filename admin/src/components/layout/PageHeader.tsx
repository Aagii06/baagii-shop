/** Title block at the top of a tab page; `children` holds search / filters. */
export default function PageHeader({
  title,
  aside,
  children,
}: {
  title: string;
  /** Right of the title: a count, a date or an action button. */
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="-mx-4 mb-1 space-y-4 border-b border-border px-4 pb-4 pt-5">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-[22px] font-extrabold leading-tight">{title}</h1>
        {aside}
      </div>
      {children}
    </div>
  );
}
