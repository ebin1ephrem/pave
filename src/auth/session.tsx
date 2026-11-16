import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

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

export interface Program {
  id: string;
  name: string;
  tenant: string;
}

export interface SessionUser {
  name: string;
  email: string;
  role: Role;
  programs: Program[];
}

interface SessionValue {
  user: SessionUser | null;
  programId: string | null;
  setProgramId: (id: string) => void;
  /** Preview only: real sign-in arrives with the data model and auth work. */
  previewAs: (role: Role) => void;
  signOut: () => void;
}

const KEY = "pave.preview-session";
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
  };
}

function load(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? previewUser(JSON.parse(raw).role as Role) : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(load);
  const [programId, setProgramId] = useState<string | null>(() => load()?.programs[0]?.id ?? null);

  const previewAs = useCallback((role: Role) => {
    const next = previewUser(role);
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ role }));
    } catch {
      /* storage unavailable: session lasts for this page only */
    }
    setUser(next);
    setProgramId(next.programs[0]?.id ?? null);
  }, []);

  const signOut = useCallback(() => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
    setUser(null);
    setProgramId(null);
  }, []);

  const value = useMemo(
    () => ({ user, programId, setProgramId, previewAs, signOut }),
    [user, programId, previewAs, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}
