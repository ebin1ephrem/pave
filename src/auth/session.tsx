import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "merstra_admin" | "customer_admin" | "manager" | "founder";

export const ROLE_LABEL: Record<Role, string> = {
  merstra_admin: "Merstra admin",
  customer_admin: "Customer admin",
  manager: "Program manager",
  founder: "Founder",
};

export const ROLE_HOME: Record<Role, string> = {
  merstra_admin: "/admin",
  customer_admin: "/customer",
  manager: "/manager",
  founder: "/founder",
};

/** When someone holds several roles, the shell opens on the widest one. */
const ROLE_ORDER: Role[] = ["merstra_admin", "customer_admin", "manager", "founder"];

export interface Program {
  id: string;
  name: string;
  /** Founders cannot read tenant records, so this is absent for them. */
  tenant: string | null;
}

export interface SessionUser {
  name: string;
  email: string;
  /** Null when the account exists but has not been given access to anything yet. */
  role: Role | null;
  programs: Program[];
  preview: boolean;
}

interface SessionValue {
  /** True until the first check of the stored session has finished. */
  loading: boolean;
  user: SessionUser | null;
  programId: string | null;
  setProgramId: (id: string) => void;
  /** Sends a sign-in link. Resolves to an error message, or null when the email was accepted. */
  signInWithEmail: (email: string) => Promise<string | null>;
  /** Development only: open the shell as a sample user without signing in. */
  previewAs: (role: Role) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionValue | null>(null);

const PREVIEW_PROGRAMS: Program[] = [
  { id: "sample-1", name: "Sample program A", tenant: "Sample incubator" },
  { id: "sample-2", name: "Sample program B", tenant: "Sample incubator" },
];

function previewUser(role: Role): SessionUser {
  return {
    name: `Sample ${ROLE_LABEL[role].toLowerCase()}`,
    email: "sample.user@example.org",
    role,
    programs: role === "merstra_admin" ? [] : role === "founder" ? PREVIEW_PROGRAMS.slice(0, 1) : PREVIEW_PROGRAMS,
    preview: true,
  };
}

async function loadUser(userId: string, email: string): Promise<SessionUser> {
  if (!supabase) throw new Error("Supabase is not configured");
  const [roles, programs, profile] = await Promise.all([
    supabase.rpc("my_roles"),
    supabase.from("programs").select("id, name, tenants(name)").order("name"),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);
  if (roles.error) throw roles.error;
  if (programs.error) throw programs.error;

  const held = new Set((roles.data as { role: Role }[]).map((r) => r.role));
  return {
    name: profile.data?.full_name || email,
    email,
    role: ROLE_ORDER.find((r) => held.has(r)) ?? null,
    programs: (programs.data as unknown as { id: string; name: string; tenants: { name: string } | null }[]).map((p) => ({
      id: p.id,
      name: p.name,
      tenant: p.tenants?.name ?? null,
    })),
    preview: false,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(supabase !== null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    const apply = async (session: { user: { id: string; email?: string } } | null) => {
      if (!session) {
        if (!cancelled) {
          setUser((u) => (u?.preview ? u : null));
          setLoading(false);
        }
        return;
      }
      try {
        const next = await loadUser(session.user.id, session.user.email ?? "");
        if (cancelled) return;
        setUser(next);
        setProgramId((current) => (next.programs.some((p) => p.id === current) ? current : (next.programs[0]?.id ?? null)));
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    // Defer the follow-up queries: calling the client inside this callback can deadlock it.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void apply(session), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) return "Sign-in is not configured for this build.";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Accounts are created by invitation only; an unknown address gets no link.
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/sign-in` },
    });
    if (!error) return null;
    return error.status === 429
      ? "Too many attempts. Wait a minute and try again."
      : "We could not send a link to that address. Check it, or ask your program manager for an invitation.";
  }, []);

  const previewAs = useCallback((role: Role) => {
    if (!import.meta.env.DEV) return;
    const next = previewUser(role);
    setUser(next);
    setProgramId(next.programs[0]?.id ?? null);
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setProgramId(null);
    await supabase?.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ loading, user, programId, setProgramId, signInWithEmail, previewAs, signOut }),
    [loading, user, programId, signInWithEmail, previewAs, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}
