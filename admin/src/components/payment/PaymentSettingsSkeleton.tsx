import { Card } from "@/components/ui/card";

function ToggleRow() {
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 grow space-y-1.5">
        <span className="block h-4 w-1/3 rounded-md bg-muted" />
        <span className="block h-3.5 w-3/4 rounded-md bg-muted" />
      </span>
      <span className="block h-6 w-11 shrink-0 rounded-full bg-muted" />
    </div>
  );
}

function FieldRow() {
  return (
    <div className="space-y-1.5">
      <span className="block h-3.5 w-24 rounded-md bg-muted" />
      <span className="block h-11 w-full rounded-xl bg-muted" />
    </div>
  );
}

/** Placeholder shaped like the payment settings form, shown while it loads. */
export default function PaymentSettingsSkeleton() {
  return (
    <div aria-hidden className="animate-pulse space-y-4">
      <Card className="space-y-4 p-4">
        <ToggleRow />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <FieldRow key={i} />
          ))}
        </div>
      </Card>
      <Card className="space-y-4 p-4">
        <ToggleRow />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <FieldRow key={i} />
          ))}
        </div>
      </Card>
    </div>
  );
}
