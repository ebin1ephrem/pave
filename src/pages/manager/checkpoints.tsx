import { CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/auth/session";
import { EmptyState } from "@/components/patterns/empty-state";
import { LoadState, Notice } from "@/components/patterns/notice";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Hint, Input, Label } from "@/components/ui/input";
import { CHECKPOINT_LABEL, CHECKPOINT_ORDER, type CheckpointType, type Window } from "@/founder/api";
import { useLoad } from "@/lib/use-load";
import { describeEmails, listWindows, saveWindow } from "@/ops/api";

export default function ManagerCheckpoints() {
  const { user, programId } = useSession();
  const key = user?.preview ? null : programId;
  const { data, loading, error, reload } = useLoad(key, () => listWindows(programId!));

  return (
    <AppShell>
      <PageHeader
        eyebrow={user?.programs.find((p) => p.id === programId)?.name}
        title="Checkpoints"
        description="Open a checkpoint to let founders fill it in and submit. Close it to stop new submissions. Opening emails every founder in the program."
      />
      <PageBody>
        {!key ? (
          <EmptyState icon={CalendarClock} title="No program selected" body="You are not assigned to a program yet." />
        ) : (
          <LoadState loading={loading} error={error}>
            <div className="grid gap-4 lg:grid-cols-3">
              {CHECKPOINT_ORDER.map((type) => (
                <WindowCard key={type} programId={key} type={type} current={data?.[type] ?? { is_open: false, due_date: null }} onSaved={reload} />
              ))}
            </div>
          </LoadState>
        )}
      </PageBody>
    </AppShell>
  );
}

function WindowCard({ programId, type, current, onSaved }: { programId: string; type: CheckpointType; current: Window; onSaved: () => void }) {
  const [due, setDue] = useState(current.due_date ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  useEffect(() => setDue(current.due_date ?? ""), [current.due_date]);

  const save = async (isOpen: boolean) => {
    setBusy(true);
    setResult(null);
    try {
      const emails = await saveWindow(programId, type, { is_open: isOpen, due_date: due || null }, current.is_open);
      setResult({
        tone: "ok",
        text: emails ? `Opened. ${describeEmails(emails)}` : isOpen ? "Saved." : current.is_open ? "Closed. Founders can no longer submit." : "Saved.",
      });
      onSaved();
    } catch (err) {
      setResult({ tone: "error", text: err instanceof Error ? err.message : "That did not work." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-medium tracking-[-0.02em]">{CHECKPOINT_LABEL[type]}</h2>
        <Badge tone={current.is_open ? "ok" : "faint"}>{current.is_open ? "Open" : "Closed"}</Badge>
      </div>
      <div className="mt-4">
        <Label htmlFor={`due-${type}`}>Due date</Label>
        <Input id={`due-${type}`} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <Hint className="mt-1.5">Founders who have not submitted get one reminder in the three days before this date.</Hint>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {current.is_open ? (
          <>
            <Button size="sm" disabled={busy || due === (current.due_date ?? "")} onClick={() => void save(true)}>Save date</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void save(false)}>Close</Button>
          </>
        ) : (
          <Button size="sm" disabled={busy} onClick={() => void save(true)}>{busy ? "Opening…" : "Open and email founders"}</Button>
        )}
      </div>
      {result ? <div className="mt-3"><Notice tone={result.tone}>{result.text}</Notice></div> : null}
    </Card>
  );
}
