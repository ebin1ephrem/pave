import { Inbox, Lock } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { ROLE_HOME, useSession } from "@/auth/session";
import { EmptyState } from "@/components/patterns/empty-state";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import { Brand } from "@/components/shell/brand";
import { findNavItem } from "@/components/shell/nav";
import { Button } from "@/components/ui/button";

/** Signed-in screen for a nav item that has no content yet: page header plus its empty state. */
export default function SectionPage() {
  const { loading, user, signOut } = useSession();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center text-[14px] text-muted" aria-busy="true">
        Loading…
      </main>
    );
  }
  if (!user) return <Navigate to="/sign-in" replace />;

  if (!user.role) {
    return (
      <main className="grid min-h-dvh place-items-center bg-subtle px-5">
        <div className="w-full max-w-[460px]">
          <Brand className="mb-6" />
          <EmptyState
            icon={Lock}
            title="You do not have access yet"
            body={`${user.email} is signed in but has not been added to a program. Ask your program manager to invite you.`}
            action={
              <Button size="sm" variant="secondary" onClick={() => void signOut()}>
                Sign out
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  const item = findNavItem(user.role, pathname);
  if (!item) return <Navigate to={ROLE_HOME[user.role]} replace />;

  return (
    <AppShell>
      <PageHeader title={item.label} />
      <PageBody>
        <EmptyState icon={item.icon ?? Inbox} title={item.empty.title} body={item.empty.body} />
      </PageBody>
    </AppShell>
  );
}
