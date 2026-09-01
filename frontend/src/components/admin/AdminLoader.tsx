import { cn } from "@/lib/utils";

type AdminLoaderProps = {
  label?: string;
  fullPage?: boolean;
  className?: string;
};

export function AdminLoader({
  label = "Loading…",
  fullPage = false,
  className,
}: AdminLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullPage ? "min-h-screen" : "py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
        <div className="h-2 w-2 rounded-full bg-brand-orange" />
      </div>
      {label ? (
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-white p-5 animate-pulse"
        >
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="mt-3 h-10 w-14 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-4 px-4 py-4"
          >
            <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/4 rounded bg-muted" />
            </div>
            <div className="h-8 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-border bg-white animate-pulse"
        >
          <div className="aspect-[16/7] bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
