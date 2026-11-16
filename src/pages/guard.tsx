import { Navigate, Outlet } from "react-router-dom";
import { ROLE_HOME, useSession, type Role } from "@/auth/session";
import SectionPage from "./section";

/** Lets a signed-in user with the given role through; everyone else is sent where they belong. */
export function RequireRole({ role }: { role: Role }) {
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
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
