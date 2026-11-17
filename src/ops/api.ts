import { supabase } from "@/lib/supabase";
import type { CheckpointStatus, CheckpointType, Window } from "@/founder/api";

function db() {
  if (!supabase) throw new Error("PAVE is not connected to its database.");
  return supabase;
}
function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export interface EmailResult {
  to_email: string;
  status: "queued" | "sent" | "skipped" | "failed";
  detail: string | null;
}

/** Calls the server function for actions that create accounts or send email. */
async function pave(action: string, body: Record<string, unknown>): Promise<EmailResult[]> {
  const { data: session } = await db().auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL || "https://osgporxbqlmrufqyborv.supabase.co"}/functions/v1/pave`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` },
    body: JSON.stringify({ action, origin: window.location.origin, ...body }),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; emails?: EmailResult[] };
  if (!res.ok) throw new Error(json.error ?? "That did not work. Try again.");
  return json.emails ?? [];
}

/** One sentence describing what happened to the emails of an action. */
export function describeEmails(emails: EmailResult[]): string {
  if (emails.length === 0) return "No one to email.";
  const sent = emails.filter((e) => e.status === "sent").length;
  const skipped = emails.filter((e) => e.status === "skipped").length;
  const failed = emails.filter((e) => e.status === "failed");
  const parts = [];
  if (sent) parts.push(`${sent} email${sent > 1 ? "s" : ""} sent`);
  const skippedRow = emails.find((e) => e.status === "skipped");
  if (skippedRow) {
    const why = /reserved/i.test(skippedRow.detail ?? "") ? "the address is a reserved test address" : "no email provider is set up";
    parts.push(`${skipped} not sent because ${why}`);
  }
  if (failed.length) parts.push(`${failed.length} failed (${failed[0]!.detail ?? "unknown reason"})`);
  return parts.join("; ") + ".";
}

export interface Person {
  id: string;
  name: string;
  email: string | null;
}

async function people(ids: string[]): Promise<Map<string, Person>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await db().from("profiles").select("id, full_name, email").in("id", [...new Set(ids)]);
  fail(error);
  return new Map((data ?? []).map((p) => [p.id, { id: p.id, name: p.full_name || "", email: p.email }]));
}

// Tenants ---------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  type: string;
  country: string | null;
  admins: Person[];
  programs: number;
}

export async function listTenants(): Promise<Tenant[]> {
  const [tenants, members, programs] = await Promise.all([
    db().from("tenants").select("id, name, type, country").order("name"),
    db().from("tenant_members").select("tenant_id, user_id, role").eq("role", "customer_admin"),
    db().from("programs").select("id, tenant_id"),
  ]);
  fail(tenants.error);
  fail(members.error);
  fail(programs.error);
  const who = await people((members.data ?? []).map((m) => m.user_id));
  return (tenants.data ?? []).map((t) => ({
    ...t,
    admins: (members.data ?? []).filter((m) => m.tenant_id === t.id).map((m) => who.get(m.user_id)).filter((p): p is Person => !!p),
    programs: (programs.data ?? []).filter((p) => p.tenant_id === t.id).length,
  }));
}

export async function createTenant(input: { name: string; type: string; country: string }): Promise<void> {
  const { error } = await db().from("tenants").insert({ name: input.name.trim(), type: input.type, country: input.country.trim() || null });
  fail(error);
}

export const inviteCustomerAdmin = (tenantId: string, email: string, fullName: string) =>
  pave("invite_customer_admin", { tenant_id: tenantId, email, full_name: fullName });

// Programs and managers ----------------------------------------------------------

export interface ProgramRow {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  sector_tags: string[];
  status: string;
  managers: Person[];
}

export interface Member extends Person {
  role: "customer_admin" | "manager";
}

export async function listTenantMembers(tenantId: string): Promise<Member[]> {
  const { data, error } = await db().from("tenant_members").select("user_id, role").eq("tenant_id", tenantId);
  fail(error);
  const who = await people((data ?? []).map((m) => m.user_id));
  return (data ?? []).map((m) => ({ ...(who.get(m.user_id) ?? { id: m.user_id, name: "", email: null }), role: m.role }));
}

export async function listPrograms(tenantId: string): Promise<ProgramRow[]> {
  const { data, error } = await db()
    .from("programs")
    .select("id, name, start_date, end_date, sector_tags, status, program_managers(user_id)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  fail(error);
  const rows = (data ?? []) as unknown as (Omit<ProgramRow, "managers"> & { program_managers: { user_id: string }[] })[];
  const who = await people(rows.flatMap((p) => p.program_managers.map((m) => m.user_id)));
  return rows.map(({ program_managers, ...p }) => ({
    ...p,
    managers: program_managers.map((m) => who.get(m.user_id)).filter((x): x is Person => !!x),
  }));
}

export async function createProgram(
  tenantId: string,
  input: { name: string; start_date: string; end_date: string; sector_tags: string[] },
): Promise<void> {
  const { error } = await db().from("programs").insert({
    tenant_id: tenantId,
    name: input.name.trim(),
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    sector_tags: input.sector_tags,
    status: "active",
  });
  fail(error);
}

export async function assignManager(programId: string, userId: string): Promise<void> {
  const { error } = await db().from("program_managers").upsert({ program_id: programId, user_id: userId });
  fail(error);
}

export async function unassignManager(programId: string, userId: string): Promise<void> {
  const { error } = await db().from("program_managers").delete().eq("program_id", programId).eq("user_id", userId);
  fail(error);
}

export const inviteManager = (tenantId: string, email: string, fullName: string, programId?: string) =>
  pave("invite_manager", { tenant_id: tenantId, email, full_name: fullName, program_id: programId ?? "" });

// Startups ---------------------------------------------------------------------

export interface StartupRow {
  enrollmentId: string;
  startupId: string;
  name: string;
  sector: string | null;
  founders: Person[];
  checkpoints: { id: string; type: CheckpointType; status: CheckpointStatus }[];
}

export async function listStartups(programId: string): Promise<StartupRow[]> {
  const { data, error } = await db()
    .from("enrollments")
    .select("id, startups(id, name, sector, startup_members(user_id)), checkpoints(id, type, status)")
    .eq("program_id", programId);
  fail(error);
  const rows = (data ?? []) as unknown as {
    id: string;
    startups: { id: string; name: string; sector: string | null; startup_members: { user_id: string }[] };
    checkpoints: StartupRow["checkpoints"];
  }[];
  const who = await people(rows.flatMap((r) => r.startups.startup_members.map((m) => m.user_id)));
  return rows
    .map((r) => ({
      enrollmentId: r.id,
      startupId: r.startups.id,
      name: r.startups.name,
      sector: r.startups.sector,
      founders: r.startups.startup_members.map((m) => who.get(m.user_id)).filter((x): x is Person => !!x),
      checkpoints: r.checkpoints,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addStartup(programId: string, name: string, sector: string): Promise<string> {
  const { data, error } = await db().rpc("add_startup_to_program", { _program: programId, _name: name.trim(), _sector: sector.trim() || null });
  fail(error);
  return data as string;
}

export const inviteFounder = (startupId: string, email: string, fullName: string) =>
  pave("invite_founder", { startup_id: startupId, email, full_name: fullName });

export async function reopenCheckpoint(checkpointId: string, note: string): Promise<EmailResult[]> {
  const { error } = await db().rpc("reopen_checkpoint", { _checkpoint: checkpointId });
  fail(error);
  return pave("notify_checkpoint_reopened", { checkpoint_id: checkpointId, note });
}

export async function exportStartup(startupId: string, name: string): Promise<void> {
  const { data, error } = await db().rpc("export_startup", { _startup: startupId });
  fail(error);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}-pave-export.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Removes a startup's stored files, then every record of it. Cannot be undone. */
export async function deleteStartup(startupId: string): Promise<void> {
  const paths = await db().rpc("startup_file_paths", { _startup: startupId });
  fail(paths.error);
  const list = (paths.data ?? []) as string[];
  if (list.length) {
    const removed = await db().storage.from("evidence").remove(list);
    fail(removed.error);
  }
  const { error } = await db().rpc("delete_startup", { _startup: startupId });
  fail(error);
}

// Checkpoint windows -------------------------------------------------------------

export async function listWindows(programId: string): Promise<Partial<Record<CheckpointType, Window>>> {
  const { data, error } = await db().from("checkpoint_windows").select("type, is_open, due_date").eq("program_id", programId);
  fail(error);
  return Object.fromEntries((data ?? []).map((w) => [w.type, { is_open: w.is_open, due_date: w.due_date }]));
}

/** Saves a window. Opening one emails every founder in the program. */
export async function saveWindow(programId: string, type: CheckpointType, next: Window, wasOpen: boolean): Promise<EmailResult[] | null> {
  const { error } = await db()
    .from("checkpoint_windows")
    .upsert({ program_id: programId, type, is_open: next.is_open, due_date: next.due_date || null });
  fail(error);
  if (next.is_open && !wasOpen) return pave("notify_checkpoint_opened", { program_id: programId, type });
  return null;
}

// CSV ---------------------------------------------------------------------------

/** Minimal CSV reader: commas, quoted fields, doubled quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

export interface CsvStartup {
  line: number;
  name: string;
  sector: string;
  founderEmail: string;
  founderName: string;
  problem: string | null;
}

export const CSV_TEMPLATE = "startup_name,sector,founder_email,founder_name\nExample Labs,agritech,founder@example.org,Asha Example\n";

export function readStartupCsv(text: string): { rows: CsvStartup[]; error: string | null } {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], error: "The file has no rows under the header." };
  const header = table[0]!.map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  if (col("startup_name") === -1 || col("founder_email") === -1) {
    return { rows: [], error: "The first row must name the columns: startup_name, sector, founder_email, founder_name." };
  }
  if (table.length > 201) return { rows: [], error: "Upload at most 200 startups at a time." };
  const get = (r: string[], name: string) => (col(name) === -1 ? "" : (r[col(name)] ?? "").trim());
  const rows = table.slice(1).map((r, i) => {
    const name = get(r, "startup_name");
    const founderEmail = get(r, "founder_email").toLowerCase();
    const problem = !name
      ? "Startup name is missing"
      : founderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(founderEmail)
        ? "Founder email is not valid"
        : null;
    return { line: i + 2, name, sector: get(r, "sector"), founderEmail, founderName: get(r, "founder_name"), problem };
  });
  return { rows, error: null };
}
