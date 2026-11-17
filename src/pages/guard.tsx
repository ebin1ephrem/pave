import { Navigate, Outlet } from "react-router-dom";
import { ROLE_HOME, useSession, type Role } from "@/auth/session";
import Consent from "./consent";
import SectionPage from "./section";

/** Lets a signed-in user with one of the given roles through; everyone else is sent where they belong. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const { loading, user } = useSession();
  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center text-[14px] text-muted" aria-busy="true">
        Loading…
      </main>
    );
  }
  if (!user) return <Navigate to="/sign-in" replace />;
  // No role yet: the section page explains that access has not been granted.
  if (!user.role) return <SectionPage />;
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  // Founders accept the data notice once before seeing anything else.
  if (user.role === "founder" && !user.consented) return <Consent />;
  return <Outlet />;
}
