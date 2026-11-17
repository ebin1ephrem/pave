import { Download, Upload, Users } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/auth/session";
import { EmptyState } from "@/components/patterns/empty-state";
import { LoadState, Notice } from "@/components/patterns/notice";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Hint, Input, Label, Textarea } from "@/components/ui/input";
import { CHECKPOINT_LABEL, CHECKPOINT_ORDER, type CheckpointStatus } from "@/founder/api";
import { useLoad } from "@/lib/use-load";
import {
  addStartup,
  CSV_TEMPLATE,
  deleteStartup,
  describeEmails,
  exportStartup,
  inviteFounder,
  listStartups,
  readStartupCsv,
  reopenCheckpoint,
  type CsvStartup,
  type StartupRow,
} from "@/ops/api";

const STATUS: Record<CheckpointStatus, { label: string; tone: BadgeTone }> = {
  not_started: { label: "Not started", tone: "faint" },
  in_progress: { label: "In progress", tone: "accent" },
  submitted: { label: "Submitted", tone: "dark" },
  reviewed: { label: "Reviewed", tone: "ok" },
};
type Result = { tone: "ok" | "error" | "info"; text: string } | null;
const message = (e: unknown) => (e instanceof Error ? e.message : "That did not work.");

export default function ManagerStartups() {
  const { user, programId } = useSession();
  const key = user?.preview ? null : programId;
  const { data, loading, error, reload } = useLoad(key, () => listStartups(programId!));
  const programName = user?.programs.find((p) => p.id === programId)?.name;

  return (
    <AppShell>
      <PageHeader
        eyebrow={programName}
        title="Startups"
        description="Add startups one at a time or by CSV, then invite their founders. A startup can have several founders; they share one submission per checkpoint."
      />
      <PageBody className="grid gap-6">
        {!key ? (
          <EmptyState icon={Users} title="No program selected" body="You are not assigned to a program yet. Ask your administrator to assign you." />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <AddOne programId={key} onAdded={reload} />
              <AddMany programId={key} onAdded={reload} />
            </div>
            <LoadState loading={loading} error={error}>
              {data && data.length === 0 ? (
                <EmptyState icon={Users} title="No startups in this program" body="Add the first one above." />
              ) : (
                <div className="grid gap-4">
                  {(data ?? []).map((s) => <StartupCard key={s.enrollmentId} startup={s} canDelete={user?.role === "customer_admin"} onChanged={reload} />)}
                </div>
              )}
            </LoadState>
          </>
        )}
      </PageBody>
    </AppShell>
  );
}

function AddOne({ programId, onAdded }: { programId: string; onAdded: () => void }) {
  const [form, setForm] = useState({ name: "", sector: "", email: "", founder: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const startupId = await addStartup(programId, form.name, form.sector);
      let text = "Startup added.";
      if (form.email.trim()) text += ` Founder invited. ${describeEmails(await inviteFounder(startupId, form.email, form.founder))}`;
      setResult({ tone: "ok", text });
      setForm({ name: "", sector: "", email: "", founder: "" });
      onAdded();
    } catch (err) {
      setResult({ tone: "error", text: message(err) });
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-[17px] font-medium tracking-[-0.02em]">Add a startup</h2>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-name">Startup name</Label>
          <Input id="s-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="s-sector">Sector</Label>
          <Input id="s-sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="s-email">Founder email</Label>
          <Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="s-founder">Founder name</Label>
          <Input id="s-founder" value={form.founder} onChange={(e) => setForm({ ...form, founder: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy || !form.name.trim()}>{busy ? "Adding…" : "Add startup"}</Button>
        </div>
      </form>
      {result ? <div className="mt-3"><Notice tone={result.tone}>{result.text}</Notice></div> : null}
    </Card>
  );
}

function AddMany({ programId, onAdded }: { programId: string; onAdded: () => void }) {
  const [rows, setRows] = useState<CsvStartup[] | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; failed: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const valid = (rows ?? []).filter((r) => !r.problem);

  const onFile = async (file: File | undefined) => {
    setRows(null);
    setProgress(null);
    setFileError(null);
    if (!file) return;
    if (file.size > 1024 * 1024) return setFileError("That file is over 1 MB. Split it into smaller files.");
    const parsed = readStartupCsv(await file.text());
    if (parsed.error) return setFileError(parsed.error);
    setRows(parsed.rows);
  };

  const onImport = async () => {
    setBusy(true);
    const failed: string[] = [];
    let done = 0;
    for (const r of valid) {
      try {
        const id = await addStartup(programId, r.name, r.sector);
        if (r.founderEmail) await inviteFounder(id, r.founderEmail, r.founderName);
        done++;
      } catch (err) {
        failed.push(`Line ${r.line} (${r.name}): ${message(err)}`);
      }
      setProgress({ done, failed: [...failed] });
    }
    setBusy(false);
    setRows(null);
    if (input.current) input.current.value = "";
    onAdded();
  };

  const template = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
    a.download = "pave-startups-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px] font-medium tracking-[-0.02em]">Add many by CSV</h2>
        <Button size="sm" variant="ghost" onClick={template}><Download className="size-3.5" aria-hidden="true" /> Template</Button>
      </div>
      <Hint className="mt-1.5">Columns: startup_name, sector, founder_email, founder_name. One founder per row; repeat the startup on another row is not needed, add more founders afterwards.</Hint>
      <div className="mt-4">
        <Label htmlFor="csv-file">CSV file</Label>
        <input
          id="csv-file"
          ref={input}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void onFile(e.target.files?.[0])}
          className="block w-full text-[13px] text-muted file:mr-3 file:h-9 file:cursor-pointer file:rounded-[6px] file:border file:border-solid file:border-line file:bg-white file:px-3 file:text-[13px] file:font-medium file:text-ink"
        />
      </div>
      {fileError ? <div className="mt-3"><Notice tone="error">{fileError}</Notice></div> : null}
      {rows ? (
        <div className="mt-4">
          <p className="text-[13px]">
            <span className="font-medium">{valid.length}</span> ready to import
            {rows.length - valid.length ? <>, <span className="font-medium text-danger">{rows.length - valid.length}</span> with problems (skipped)</> : null}
          </p>
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-[8px] border border-line text-[12.5px]">
            {rows.map((r) => (
              <li key={r.line} className="flex justify-between gap-3 border-b border-line px-3 py-1.5 last:border-b-0">
                <span className="min-w-0 truncate">{r.line}. {r.name || "(no name)"} <span className="text-muted">{r.founderEmail}</span></span>
                {r.problem ? <span className="shrink-0 text-danger">{r.problem}</span> : null}
              </li>
            ))}
          </ul>
          <Button className="mt-3" size="sm" disabled={busy || valid.length === 0} onClick={() => void onImport()}>
            <Upload className="size-3.5" aria-hidden="true" /> {busy ? `Importing ${progress?.done ?? 0} of ${valid.length}…` : `Import ${valid.length} startup${valid.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      ) : null}
      {progress && !busy ? (
        <div className="mt-3 grid gap-2">
          <Notice tone="ok">{progress.done} startup{progress.done === 1 ? "" : "s"} imported.</Notice>
          {progress.failed.length ? <Notice tone="error">{progress.failed.join(" ")}</Notice> : null}
        </div>
      ) : null}
    </Card>
  );
}

function StartupCard({ startup, canDelete, onChanged }: { startup: StartupRow; canDelete: boolean; onChanged: () => void }) {
  const [panel, setPanel] = useState<null | "invite" | "reopen" | "delete">(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [reopenId, setReopenId] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const ordered = [...startup.checkpoints].sort((a, b) => CHECKPOINT_ORDER.indexOf(a.type) - CHECKPOINT_ORDER.indexOf(b.type));
  const reopenable = ordered.filter((c) => c.status === "submitted" || c.status === "reviewed");

  const run = async (work: () => Promise<string>) => {
    setBusy(true);
    setResult(null);
    try {
      setResult({ tone: "ok", text: await work() });
      setPanel(null);
      onChanged();
    } catch (err) {
      setResult({ tone: "error", text: message(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-medium tracking-[-0.02em]">{startup.name}</h3>
          <p className="mt-0.5 text-[13px] text-muted">
            {startup.sector ? `${startup.sector} · ` : ""}
            {startup.founders.length ? startup.founders.map((f) => f.name || f.email).join(", ") : "No founder invited yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setPanel(panel === "invite" ? null : "invite")}>Invite founder</Button>
          {reopenable.length ? <Button size="sm" variant="secondary" onClick={() => { setReopenId(reopenable[reopenable.length - 1]!.id); setPanel(panel === "reopen" ? null : "reopen"); }}>Reopen</Button> : null}
          <Button size="sm" variant="ghost" onClick={() => void exportStartup(startup.startupId, startup.name).catch((e) => setResult({ tone: "error", text: message(e) }))}>Export data</Button>
          {canDelete ? <Button size="sm" variant="ghost" onClick={() => setPanel(panel === "delete" ? null : "delete")}>Delete</Button> : null}
        </div>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {ordered.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 rounded-[8px] border border-line px-3 py-2">
            <span className="text-[13px] font-medium">{CHECKPOINT_LABEL[c.type]}</span>
            <span className="flex items-center gap-2">
              <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
              <Link to={`/manager/startups/${startup.enrollmentId}/assessment/${c.type}`} className="text-[12.5px] text-muted underline-offset-2 hover:text-ink hover:underline">
                {c.status === "submitted" || c.status === "reviewed" ? "View" : "Fill in"}
              </Link>
            </span>
          </li>
        ))}
      </ul>

      {panel === "invite" ? (
        <form
          className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => { e.preventDefault(); void run(async () => `Founder invited. ${describeEmails(await inviteFounder(startup.startupId, email, name))}`); }}
        >
          <Input className="field-sm" type="email" required placeholder="Founder email" aria-label={`Founder email for ${startup.name}`} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input className="field-sm" placeholder="Name (optional)" aria-label="Founder name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="sm" type="submit" disabled={busy || !email.includes("@")}>{busy ? "Inviting…" : "Send invitation"}</Button>
        </form>
      ) : null}

      {panel === "reopen" ? (
        <form
          className="mt-4 grid gap-3 border-t border-line pt-4"
          onSubmit={(e) => { e.preventDefault(); void run(async () => `Reopened. ${describeEmails(await reopenCheckpoint(reopenId, note))}`); }}
        >
          <div className="flex flex-wrap gap-1.5">
            {reopenable.map((c) => (
              <button key={c.id} type="button" aria-pressed={reopenId === c.id} onClick={() => setReopenId(c.id)} className={`pill h-8 cursor-pointer px-3 text-[12.5px] ${reopenId === c.id ? "border-ink bg-ink text-white" : ""}`}>
                {CHECKPOINT_LABEL[c.type]}
              </button>
            ))}
          </div>
          <div>
            <Label htmlFor={`reopen-${startup.enrollmentId}`}>Note to the founders (optional)</Label>
            <Textarea id={`reopen-${startup.enrollmentId}`} className="min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should they change?" />
          </div>
          <div><Button size="sm" type="submit" disabled={busy}>{busy ? "Reopening…" : "Reopen and email founders"}</Button></div>
        </form>
      ) : null}

      {panel === "delete" ? (
        <form
          className="mt-4 grid gap-3 border-t border-line pt-4"
          onSubmit={(e) => { e.preventDefault(); void run(async () => { await deleteStartup(startup.startupId); return "Deleted."; }); }}
        >
          <Notice tone="error">This permanently deletes {startup.name}: every answer, evidence file, score and override, in every program. It cannot be undone. Export the data first if you may need it.</Notice>
          <div>
            <Label htmlFor={`del-${startup.enrollmentId}`}>Type the startup name to confirm</Label>
            <Input id={`del-${startup.enrollmentId}`} className="field-sm" value={typed} onChange={(e) => setTyped(e.target.value)} />
          </div>
          <div><Button size="sm" variant="danger" type="submit" disabled={busy || typed.trim() !== startup.name}>{busy ? "Deleting…" : "Delete permanently"}</Button></div>
        </form>
      ) : null}

      {result ? <div className="mt-3"><Notice tone={result.tone}>{result.text}</Notice></div> : null}
    </Card>
  );
}
