// PAVE server actions that need more than a signed-in user's own rights:
// inviting people (creates accounts) and sending email. Every action checks the caller's
// rights with the same database functions the access rules use.
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { render } from "./emails/templates.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

class Refused extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function siteOf(origin: unknown): string {
  const o = typeof origin === "string" ? origin.replace(/\/+$/, "") : "";
  if (/^https:\/\/[a-z0-9.-]+$/i.test(o) || /^http:\/\/localhost(:\d+)?$/.test(o)) return o;
  throw new Refused("A valid site address is required.");
}

/** Sends one queued email. Without an email provider only invitations go out, through Supabase's own mail. */
async function deliver(row: { id: string; to_email: string; template: string; payload: Record<string, string> }) {
  const done = (status: string, detail: string) =>
    admin.from("email_outbox").update({ status, detail, sent_at: status === "sent" ? new Date().toISOString() : null }).eq("id", row.id);
  try {
    const site = row.payload.site;
    if (RESEND_KEY && EMAIL_FROM) {
      const payload = { ...row.payload };
      if (row.template === "invitation") {
        const { data, error } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email: row.to_email,
          options: { redirectTo: `${site}/sign-in` },
        });
        if (error) throw error;
        payload.link = data.properties.action_link;
      }
      const mail = render(row.template, payload);
      if (!mail) return await done("failed", `Unknown template ${row.template}`);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: EMAIL_FROM, to: [row.to_email], subject: mail.subject, text: mail.text }),
      });
      if (!res.ok) return await done("failed", `Email provider answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return await done("sent", "Sent through the email provider");
    }
    if (row.template === "invitation") {
      const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
      const { error } = await anon.auth.signInWithOtp({
        email: row.to_email,
        options: { shouldCreateUser: false, emailRedirectTo: `${site}/sign-in` },
      });
      if (error) return await done("failed", error.message);
      return await done("sent", "Sent as a standard Supabase sign-in email (no email provider is configured)");
    }
    return await done("skipped", "No email provider is configured, so this message was not sent");
  } catch (e) {
    return await done("failed", e instanceof Error ? e.message : String(e));
  }
}

async function dispatch(limit = 50) {
  const { data } = await admin.from("email_outbox").select("id, to_email, template, payload").eq("status", "queued").order("created_at").limit(limit);
  for (const row of data ?? []) await deliver(row);
  return (data ?? []).length;
}

async function queue(rows: { tenant_id: string | null; to_email: string; template: string; payload: Record<string, unknown> }[]) {
  if (rows.length === 0) return [];
  const { data, error } = await admin.from("email_outbox").insert(rows).select("id, to_email, template, payload");
  if (error) throw error;
  for (const row of data) await deliver(row);
  const { data: after } = await admin.from("email_outbox").select("to_email, status, detail").in("id", data.map((r) => r.id));
  return after ?? [];
}

/** Finds the account for an email, or creates one. Accounts exist only by invitation. */
async function ensureUser(email: string, fullName: string | null): Promise<string> {
  const { data: found } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (found) return found.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName ?? "" },
  });
  if (error || !data.user) throw new Refused(error?.message ?? "The account could not be created.");
  return data.user.id;
}

async function founderRecipients(filter: { program_id?: string; enrollment_id?: string }) {
  let q = admin
    .from("enrollments")
    .select("id, tenant_id, programs(name), startups(name, startup_members(profiles(email)))")
    .eq("status", "active");
  if (filter.program_id) q = q.eq("program_id", filter.program_id);
  if (filter.enrollment_id) q = q.eq("id", filter.enrollment_id);
  const { data, error } = await q;
  if (error) throw error;
  // deno-lint-ignore no-explicit-any
  return (data as any[]).flatMap((e) =>
    (e.startups?.startup_members ?? [])
      // deno-lint-ignore no-explicit-any
      .map((m: any) => m.profiles?.email)
      .filter(Boolean)
      .map((email: string) => ({ email, tenant_id: e.tenant_id, startup: e.startups.name, program: e.programs.name, enrollment_id: e.id })),
  );
}

async function handle(body: Record<string, unknown>, caller: SupabaseClient, callerName: string) {
  const can = async (fn: string, args: Record<string, unknown> = {}) => {
    const { data, error } = await caller.rpc(fn, args);
    if (error) throw new Refused("Your rights could not be checked.", 403);
    return data === true;
  };
  const text = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const emailOf = () => {
    const email = text("email").toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) throw new Refused("Enter a valid email address.");
    return email;
  };
  const invite = (tenant_id: string, email: string, role: string, context: string, site: string) =>
    queue([{ tenant_id, to_email: email, template: "invitation", payload: { name: text("full_name"), role, context, inviter: callerName, site } }]);

  switch (body.action) {
    case "invite_customer_admin": {
      if (!(await can("is_merstra_admin"))) throw new Refused("Only Merstra can add a customer administrator.", 403);
      const site = siteOf(body.origin), email = emailOf(), tenant = text("tenant_id");
      const { data: t } = await admin.from("tenants").select("name").eq("id", tenant).maybeSingle();
      if (!t) throw new Refused("That organisation does not exist.");
      const user = await ensureUser(email, text("full_name") || null);
      await admin.from("tenant_members").upsert({ tenant_id: tenant, user_id: user, role: "customer_admin" });
      return { emails: await invite(tenant, email, "customer_admin", t.name, site) };
    }
    case "invite_manager": {
      const tenant = text("tenant_id"), program = text("program_id");
      if (!((await can("is_merstra_admin")) || (await can("is_tenant_admin", { _tenant: tenant })))) {
        throw new Refused("Only an administrator of this organisation can add managers.", 403);
      }
      const site = siteOf(body.origin), email = emailOf();
      const { data: t } = await admin.from("tenants").select("name").eq("id", tenant).maybeSingle();
      if (!t) throw new Refused("That organisation does not exist.");
      let context = t.name;
      if (program) {
        const { data: p } = await admin.from("programs").select("name, tenant_id").eq("id", program).maybeSingle();
        if (!p || p.tenant_id !== tenant) throw new Refused("That program does not belong to this organisation.");
        context = p.name;
      }
      const user = await ensureUser(email, text("full_name") || null);
      const { data: existing } = await admin.from("tenant_members").select("role").eq("tenant_id", tenant).eq("user_id", user).maybeSingle();
      if (!existing) await admin.from("tenant_members").insert({ tenant_id: tenant, user_id: user, role: "manager" });
      if (program) await admin.from("program_managers").upsert({ program_id: program, user_id: user });
      return { emails: await invite(tenant, email, "manager", context, site) };
    }
    case "invite_founder": {
      const startup = text("startup_id");
      if (!((await can("is_merstra_admin")) || (await can("manages_startup", { _startup: startup })))) {
        throw new Refused("You do not manage this startup.", 403);
      }
      const site = siteOf(body.origin), email = emailOf();
      const { data: s } = await admin.from("startups").select("name, tenant_id").eq("id", startup).maybeSingle();
      if (!s) throw new Refused("That startup does not exist.");
      const user = await ensureUser(email, text("full_name") || null);
      await admin.from("startup_members").upsert({ startup_id: startup, user_id: user });
      return { emails: await invite(s.tenant_id, email, "founder", s.name, site) };
    }
    case "notify_checkpoint_opened": {
      const program = text("program_id"), type = text("type");
      if (!(await can("manages_program", { _program: program }))) throw new Refused("You do not manage this program.", 403);
      const site = siteOf(body.origin);
      const { data: w } = await admin.from("checkpoint_windows").select("is_open, due_date").eq("program_id", program).eq("type", type).maybeSingle();
      if (!w?.is_open) throw new Refused("That checkpoint is not open.");
      const people = await founderRecipients({ program_id: program });
      return {
        emails: await queue(people.map((p) => ({
          tenant_id: p.tenant_id, to_email: p.email, template: "checkpoint_opened",
          payload: { startup: p.startup, program: p.program, checkpoint: type, due_date: w.due_date, site },
        }))),
      };
    }
    case "notify_checkpoint_reopened":
    case "request_evidence": {
      const checkpoint = text("checkpoint_id");
      const { data: c } = await admin.from("checkpoints").select("type, enrollment_id").eq("id", checkpoint).maybeSingle();
      if (!c || !(await can("manages_enrollment", { _enrollment: c.enrollment_id }))) throw new Refused("You do not manage this startup.", 403);
      const site = siteOf(body.origin);
      const people = await founderRecipients({ enrollment_id: c.enrollment_id });
      const template = body.action === "request_evidence" ? "evidence_requested" : "checkpoint_reopened";
      return {
        emails: await queue(people.map((p) => ({
          tenant_id: p.tenant_id, to_email: p.email, template,
          payload: { startup: p.startup, program: p.program, checkpoint: c.type, note: text("note").slice(0, 1000), dimension: text("dimension"), site },
        }))),
      };
    }
    default:
      throw new Refused("Unknown action.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // The daily job calls this with no sign-in. It can only send mail that is already queued.
    if (body.action === "dispatch") return json({ processed: await dispatch() });

    const auth = req.headers.get("Authorization") ?? "";
    const caller = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: who } = await caller.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    if (!who?.user) return json({ error: "Sign in first." }, 401);
    const { data: me } = await admin.from("profiles").select("full_name").eq("id", who.user.id).maybeSingle();
    return json(await handle(body, caller, me?.full_name || who.user.email || "Your program"));
  } catch (e) {
    if (e instanceof Refused) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Something went wrong. Try again." }, 500);
  }
});
