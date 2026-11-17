import { Building2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EmptyState } from "@/components/patterns/empty-state";
import { LoadState, Notice } from "@/components/patterns/notice";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { useLoad } from "@/lib/use-load";
import { createTenant, describeEmails, inviteCustomerAdmin, listTenants, type Tenant } from "@/ops/api";

const TYPES = ["incubator", "accelerator", "university", "government", "other"];

export default function AdminTenants() {
  const { data, loading, error, reload } = useLoad("tenants", listTenants);
  const [form, setForm] = useState({ name: "", type: "incubator", country: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      await createTenant(form);
      setForm({ name: "", type: "incubator", country: "" });
      setResult({ tone: "ok", text: "Organisation created. Invite its administrator below." });
      reload();
    } catch (err) {
      setResult({ tone: "error", text: err instanceof Error ? err.message : "That did not work." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Tenants" description="Each customer organisation is an isolated tenant. Create it, then invite its administrator." />
      <PageBody className="grid gap-6">
        <Card className="p-5">
          <h2 className="text-[17px] font-medium tracking-[-0.02em]">New organisation</h2>
          <form onSubmit={onCreate} className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="t-type">Type</Label>
              <Select id="t-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t[0]!.toUpperCase() + t.slice(1)}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="t-country">Country</Label>
              <Input id="t-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <Button type="submit" disabled={busy || !form.name.trim()}>{busy ? "Creating…" : "Create"}</Button>
          </form>
          {result ? <div className="mt-3"><Notice tone={result.tone}>{result.text}</Notice></div> : null}
        </Card>

        <LoadState loading={loading} error={error}>
          {data && data.length === 0 ? (
            <EmptyState icon={Building2} title="No tenants yet" body="Create the first organisation above." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {(data ?? []).map((t) => <TenantCard key={t.id} tenant={t} onChanged={reload} />)}
            </div>
          )}
        </LoadState>
      </PageBody>
    </AppShell>
  );
}

function TenantCard({ tenant, onChanged }: { tenant: Tenant; onChanged: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const onInvite = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const emails = await inviteCustomerAdmin(tenant.id, email, name);
      setResult({ tone: "ok", text: `Administrator added. ${describeEmails(emails)}` });
      setEmail("");
      setName("");
      onChanged();
    } catch (err) {
      setResult({ tone: "error", text: err instanceof Error ? err.message : "That did not work." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[17px] font-medium tracking-[-0.02em]">{tenant.name}</h3>
          <p className="mt-0.5 text-[13px] text-muted">
            {tenant.type[0]!.toUpperCase() + tenant.type.slice(1)}{tenant.country ? ` · ${tenant.country}` : ""} · {tenant.programs} program{tenant.programs === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <p className="eyebrow mt-4">Administrators</p>
      {tenant.admins.length ? (
        <ul className="mt-1.5 text-[13.5px]">
          {tenant.admins.map((a) => <li key={a.id}>{a.name ? `${a.name} · ` : ""}<span className="text-muted">{a.email}</span></li>)}
        </ul>
      ) : (
        <p className="mt-1.5 text-[13px] text-muted">None yet. Nobody can run this organisation until one is invited.</p>
      )}
      <form onSubmit={onInvite} className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto]">
        <Input className="field-sm" type="email" required placeholder="Email" aria-label={`Administrator email for ${tenant.name}`} value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input className="field-sm" placeholder="Name (optional)" aria-label="Administrator name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button size="sm" type="submit" disabled={busy || !email.includes("@")}>{busy ? "Inviting…" : "Invite administrator"}</Button>
      </form>
      {result ? <div className="mt-3"><Notice tone={result.tone}>{result.text}</Notice></div> : null}
    </Card>
  );
}
