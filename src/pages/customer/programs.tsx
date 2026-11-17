import { Layers } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSession } from "@/auth/session";
import { EmptyState } from "@/components/patterns/empty-state";
import { LoadState, Notice } from "@/components/patterns/notice";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Hint, Input, Label, Select } from "@/components/ui/input";
import { useLoad } from "@/lib/use-load";
import { assignManager, createProgram, listPrograms, listTenantMembers, unassignManager, type Member, type ProgramRow } from "@/ops/api";

const date = (d: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function CustomerPrograms() {
  const { user } = useSession();
  const tenantId = user?.tenantId ?? null;
  const { data, loading, error, reload } = useLoad(tenantId, async () => {
    const [programs, members] = await Promise.all([listPrograms(tenantId!), listTenantMembers(tenantId!)]);
    return { programs, members };
  });
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", tags: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      return setResult({ tone: "error", text: "The end date is before the start date." });
    }
    setBusy(true);
    setResult(null);
    try {
      await createProgram(tenantId, {
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
        sector_tags: [...new Set(form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))],
      });
      setForm({ name: "", start_date: "", end_date: "", tags: "" });
      setResult({ tone: "ok", text: "Program created. Assign its managers below. Reload the page to see it in the program switcher." });
      reload();
    } catch (err) {
      setResult({ tone: "error", text: err instanceof Error ? err.message : "That did not work." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Programs" description="Create a program with its dates and sector tags, then assign the managers who will run it." />
      <PageBody className="grid gap-6">
        <Card className="p-5">
          <h2 className="text-[17px] font-medium tracking-[-0.02em]">New program</h2>
          <form onSubmit={onCreate} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
            <div className="sm:col-span-2 lg:col-span-1">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="p-start">Start date</Label>
              <Input id="p-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="p-end">End date</Label>
              <Input id="p-end" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-tags">Sector tags</Label>
              <Input id="p-tags" placeholder="agritech, medtech" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              <Hint className="mt-1.5">Separate tags with commas.</Hint>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busy || !form.name.trim()}>{busy ? "Creating…" : "Create program"}</Button>
            </div>
          </form>
          {result ? <div className="mt-3"><Notice tone={result.tone}>{result.text}</Notice></div> : null}
        </Card>

        <LoadState loading={loading} error={error}>
          {data && data.programs.length === 0 ? (
            <EmptyState icon={Layers} title="No programs yet" body="Create your first program above." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {(data?.programs ?? []).map((p) => <ProgramCard key={p.id} program={p} members={data!.members} onChanged={reload} />)}
            </div>
          )}
        </LoadState>
      </PageBody>
    </AppShell>
  );
}

function ProgramCard({ program, members, onChanged }: { program: ProgramRow; members: Member[]; onChanged: () => void }) {
  const [pick, setPick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const assigned = new Set(program.managers.map((m) => m.id));
  const available = members.filter((m) => !assigned.has(m.id));

  const run = async (work: () => Promise<void>) => {
    setError(null);
    try {
      await work();
      setPick("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-[17px] font-medium tracking-[-0.02em]">{program.name}</h3>
        <Badge tone={program.status === "active" ? "ok" : "neutral"}>{program.status[0]!.toUpperCase() + program.status.slice(1)}</Badge>
      </div>
      <p className="mt-1 text-[13px] text-muted">{date(program.start_date)} to {date(program.end_date)}</p>
      {program.sector_tags.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">{program.sector_tags.map((t) => <span key={t} className="pill">{t}</span>)}</div>
      ) : null}

      <p className="eyebrow mt-4">Managers</p>
      {program.managers.length ? (
        <ul className="mt-1.5 grid gap-1">
          {program.managers.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 text-[13.5px]">
              <span className="min-w-0 truncate">{m.name ? `${m.name} · ` : ""}<span className="text-muted">{m.email}</span></span>
              <button type="button" className="cursor-pointer text-[12.5px] text-muted underline-offset-2 hover:text-danger hover:underline" onClick={() => void run(() => unassignManager(program.id, m.id))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[13px] text-muted">No manager assigned. As administrator you can still run it yourself.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-4">
        <Select className="field-sm min-w-0 flex-1" aria-label={`Assign a manager to ${program.name}`} value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">{available.length ? "Choose a person…" : "Everyone is already assigned"}</option>
          {available.map((m) => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
        </Select>
        <Button size="sm" disabled={!pick} onClick={() => void run(() => assignManager(program.id, pick))}>Assign</Button>
      </div>
      <Hint className="mt-2">Someone missing? Invite them on the Managers page first.</Hint>
      {error ? <div className="mt-3"><Notice tone="error">{error}</Notice></div> : null}
    </Card>
  );
}
