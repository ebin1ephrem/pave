import { Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSession } from "@/auth/session";
import { EmptyState } from "@/components/patterns/empty-state";
import { LoadState, Notice } from "@/components/patterns/notice";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { useLoad } from "@/lib/use-load";
import { describeEmails, inviteManager, listPrograms, listTenantMembers } from "@/ops/api";

export default function CustomerManagers() {
  const { user } = useSession();
  const tenantId = user?.tenantId ?? null;
  const { data, loading, error, reload } = useLoad(tenantId, async () => {
    const [members, programs] = await Promise.all([listTenantMembers(tenantId!), listPrograms(tenantId!)]);
    return { members, programs };
  });
  const [form, setForm] = useState({ email: "", name: "", program: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const onInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setBusy(true);
    setResult(null);
    try {
      const emails = await inviteManager(tenantId, form.email, form.name, form.program || undefined);
      setResult({ tone: "ok", text: `Manager added. ${describeEmails(emails)}` });
      setForm({ email: "", name: "", program: "" });
      reload();
    } catch (err) {
      setResult({ tone: "error", text: err instanceof Error ? err.message : "That did not work." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Managers" description="Invite program managers by email. A manager sees only the programs they are assigned to." />
      <PageBody className="grid gap-6">
        <Card className="p-5">
          <h2 className="text-[17px] font-medium tracking-[-0.02em]">Invite a manager</h2>
          <form onSubmit={onInvite} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_auto] lg:items-end">
            <div>
              <Label htmlFor="m-email">Email</Label>
              <Input id="m-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="m-name">Name</Label>
              <Input id="m-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="m-program">Assign to program</Label>
              <Select id="m-program" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}>
                <option value="">Not yet</option>
                {(data?.programs ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <Button type="submit" disabled={busy || !form.email.includes("@")}>{busy ? "Inviting…" : "Invite"}</Button>
          </form>
          {result ? <div className="mt-3"><Notice tone={result.tone}>{result.text}</Notice></div> : null}
        </Card>

        <LoadState loading={loading} error={error}>
          {data && data.members.length === 0 ? (
            <EmptyState icon={Users} title="No one here yet" body="Invite your first manager above." />
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-line text-[11.5px] tracking-[0.07em] text-muted uppercase">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Programs</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.members ?? []).map((m) => (
                    <tr key={m.id} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-3 font-medium">{m.name || "—"}</td>
                      <td className="px-5 py-3 text-muted">{m.email}</td>
                      <td className="px-5 py-3"><Badge tone={m.role === "customer_admin" ? "dark" : "neutral"}>{m.role === "customer_admin" ? "Administrator" : "Manager"}</Badge></td>
                      <td className="px-5 py-3 text-muted">
                        {m.role === "customer_admin" ? "All" : data!.programs.filter((p) => p.managers.some((x) => x.id === m.id)).map((p) => p.name).join(", ") || "None assigned"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </LoadState>
      </PageBody>
    </AppShell>
  );
}
