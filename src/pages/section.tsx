import { Inbox } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { ROLE_HOME, useSession } from "@/auth/session";
import { EmptyState } from "@/components/patterns/empty-state";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import { findNavItem } from "@/components/shell/nav";

/** Signed-in screen for a nav item that has no content yet: page header plus its empty state. */
export default function SectionPage() {
  const { user } = useSession();
  const { pathname } = useLocation();
  if (!user) return <Navigate to="/sign-in" replace />;

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
