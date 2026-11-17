import { cn } from "@/lib/utils";

/** A one-line result message under a form or action. */
export function Notice({ tone, children }: { tone: "ok" | "error" | "info"; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[8px] border px-3.5 py-2.5 text-[13px]",
        tone === "ok" && "border-ok/30 bg-ok/5 text-ok",
        tone === "error" && "border-danger/30 bg-danger/5 text-danger",
        tone === "info" && "border-line bg-subtle text-muted",
      )}
    >
      {children}
    </p>
  );
}

export function LoadState({ loading, error, children }: { loading: boolean; error: string | null; children: React.ReactNode }) {
  if (loading) return <p className="text-[14px] text-muted" aria-busy="true">Loading…</p>;
  if (error) return <Notice tone="error">{error}</Notice>;
  return <>{children}</>;
}
