/** A labelled form control, with an error or hint line under it. */
export default function Field({
  label,
  hint,
  error,
  errorId,
  children,
}: {
  label: string;
  /** Shown under the field when there's no error. */
  hint?: string;
  /** Shown in red under the field; pair with the input's `aria-describedby`. */
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted-foreground">{label}</span>
        {children}
      </label>
      {error ? (
        <p id={errorId} className="mt-1.5 px-5 text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 px-5 text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
