import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/auth/session";
import { EmptyState } from "@/components/patterns/empty-state";
import { StatusCard } from "@/components/patterns/status-card";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import type { BadgeTone } from "@/components/ui/badge";
import { CHECKPOINT_LABEL, CHECKPOINT_ORDER, loadEnrollment, type CheckpointStatus, type Enrollment } from "@/founder/api";

const STATUS: Record<CheckpointStatus, { label: string; tone: BadgeTone; cta: string }> = {
  not_started: { label: "Not started", tone: "neutral", cta: "Start" },
  in_progress: { label: "In progress", tone: "accent", cta: "Continue" },
  submitted: { label: "Submitted", tone: "dark", cta: "View answers" },
  reviewed: { label: "Reviewed", tone: "ok", cta: "View answers" },
};

const ABOUT: Record<string, string> = {
  benchmark: "Where you stand at the start of the program.",
  midline: "What has changed since the Benchmark.",
  endline: "Where you stand at the end. Your reported progress is Benchmark to Endline.",
};

export function useEnrollment() {
  const { user, programId } = useSession();
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; enrollment: Enrollment | null }>({
    status: "loading",
    enrollment: null,
  });
  useEffect(() => {
    if (!programId || user?.preview) return setState({ status: "ready", enrollment: null });
    let cancelled = false;
    setState({ status: "loading", enrollment: null });
    loadEnrollment(programId)
      .then((enrollment) => !cancelled && setState({ status: "ready", enrollment }))
      .catch(() => !cancelled && setState({ status: "error", enrollment: null }));
    return () => {
      cancelled = true;
    };
  }, [programId, user?.preview]);
  return state;
}

export default function FounderAssessment() {
  const { status, enrollment } = useEnrollment();

  return (
    <AppShell>
      <PageHeader
        eyebrow={enrollment?.startupName}
        title="Assessment"
        description="Three checkpoints across the program. Each has six steps, one per dimension, and saves as you go."
      />
      <PageBody>
        {status === "loading" ? (
          <p className="text-[14px] text-muted" aria-busy="true">Loading…</p>
        ) : status === "error" ? (
          <EmptyState title="We could not load your checkpoints" body="Check your connection and reload the page." />
        ) : !enrollment ? (
          <EmptyState
            icon={ClipboardList}
            title="No checkpoint is open"
            body="Your startup is not enrolled in a program yet. You will get an email when your program manager adds you."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {enrollment.checkpoints.map((c, i) => {
              const before = enrollment.checkpoints[i - 1];
              const priorPending = !!before && (before.status === "not_started" || before.status === "in_progress") && c.status === "not_started";
              const window = enrollment.windows[c.type];
              const closed = !window?.is_open && (c.status === "not_started" || c.status === "in_progress");
              const waiting = priorPending || (closed && c.status === "not_started");
              const s = STATUS[c.status];
              const dueText = window?.due_date
                ? new Date(`${window.due_date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
                : null;
              return (
                <StatusCard
                  key={c.id}
                  href={waiting ? undefined : `/founder/assessment/${c.type}`}
                  title={CHECKPOINT_LABEL[c.type]}
                  subtitle={`Checkpoint ${CHECKPOINT_ORDER.indexOf(c.type) + 1} of 3`}
                  description={ABOUT[c.type]}
                  statuses={[
                    priorPending
                      ? { label: `Opens after ${CHECKPOINT_LABEL[before!.type]}`, tone: "faint" }
                      : closed
                        ? { label: c.status === "in_progress" ? "Closed by your manager" : "Not open yet", tone: "faint" }
                        : { label: s.label, tone: s.tone },
                  ]}
                  facts={
                    c.submitted_at
                      ? [{ label: "Submitted", value: new Date(c.submitted_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) }]
                      : dueText && !closed
                        ? [{ label: "Due", value: dueText }]
                        : []
                  }
                  cta={waiting ? undefined : closed ? "View answers" : s.cta}
                  muted={waiting}
                />
              );
            })}
          </div>
        )}
      </PageBody>
    </AppShell>
  );
}
