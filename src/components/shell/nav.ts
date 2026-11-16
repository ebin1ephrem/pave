import {
  Building2,
  CalendarClock,
  ClipboardList,
  FileSearch,
  FileText,
  FolderOpen,
  Grid3x3,
  LayoutDashboard,
  Layers,
  ListChecks,
  ScrollText,
  Sigma,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/auth/session";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown as the empty state until the screen is built. */
  empty: { title: string; body: string };
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV: Record<Role, NavSection[]> = {
  founder: [
    {
      title: "Your venture",
      items: [
        {
          label: "Overview",
          href: "/founder",
          icon: LayoutDashboard,
          empty: {
            title: "No profile yet",
            body: "Your six-dimension profile appears here once you submit your first checkpoint.",
          },
        },
        {
          label: "Assessment",
          href: "/founder/assessment",
          icon: ClipboardList,
          empty: {
            title: "No checkpoint is open",
            body: "Your program manager opens each checkpoint. You will get an email when one is ready to fill in.",
          },
        },
        {
          label: "Evidence",
          href: "/founder/evidence",
          icon: FolderOpen,
          empty: {
            title: "No evidence uploaded",
            body: "Files and links you attach to your answers are listed here, with your manager's review of each.",
          },
        },
        {
          label: "90-day plan",
          href: "/founder/plan",
          icon: ListChecks,
          empty: {
            title: "No plan yet",
            body: "A plan is drawn up after each checkpoint, weighted to the dimension holding you back most.",
          },
        },
      ],
    },
  ],
  manager: [
    {
      title: "Cohort",
      items: [
        {
          label: "Cohort",
          href: "/manager",
          icon: Grid3x3,
          empty: {
            title: "No submissions yet",
            body: "The startup-by-dimension grid fills in as founders submit the open checkpoint.",
          },
        },
        {
          label: "Evidence gaps",
          href: "/manager/evidence-gaps",
          icon: FileSearch,
          empty: {
            title: "No gaps to show",
            body: "Claims with missing or weak evidence are listed here once founders have submitted.",
          },
        },
        {
          label: "Startups",
          href: "/manager/startups",
          icon: Users,
          empty: {
            title: "No startups in this program",
            body: "Add startups one at a time or by CSV, then invite their founders by email.",
          },
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: "Checkpoints",
          href: "/manager/checkpoints",
          icon: CalendarClock,
          empty: {
            title: "No checkpoint opened",
            body: "Open the Benchmark with a due date to let founders start. Midline and Endline follow the same way.",
          },
        },
        {
          label: "Profiles",
          href: "/manager/profiles",
          icon: FileText,
          empty: {
            title: "No profiles generated",
            body: "Venture Progression Profiles you generate for a checkpoint are stored and listed here.",
          },
        },
      ],
    },
  ],
  customer_admin: [
    {
      title: "Workspace",
      items: [
        {
          label: "Programs",
          href: "/customer",
          icon: Layers,
          empty: {
            title: "No programs yet",
            body: "Create a program with its dates and sector tags, then assign the managers who will run it.",
          },
        },
        {
          label: "Managers",
          href: "/customer/managers",
          icon: Users,
          empty: {
            title: "No managers invited",
            body: "Invite program managers by email and assign each to the programs they run.",
          },
        },
      ],
    },
  ],
  merstra_admin: [
    {
      title: "Platform",
      items: [
        {
          label: "Tenants",
          href: "/admin",
          icon: Building2,
          empty: { title: "No tenants yet", body: "Each customer organisation is an isolated tenant. Create the first one to begin." },
        },
        {
          label: "Aggregate",
          href: "/admin/aggregate",
          icon: Sigma,
          empty: {
            title: "Nothing to aggregate",
            body: "Anonymised results across tenants appear here once checkpoints have been submitted.",
          },
        },
      ],
    },
    {
      title: "Governance",
      items: [
        {
          label: "Framework",
          href: "/admin/framework",
          icon: Grid3x3,
          empty: {
            title: "Framework viewer not built yet",
            body: "The six dimensions and nine stages of the current framework version will be shown here.",
          },
        },
        {
          label: "Audit log",
          href: "/admin/audit",
          icon: ScrollText,
          empty: { title: "No activity recorded", body: "Score changes, overrides and access to tenant data are logged here." },
        },
      ],
    },
  ],
};

export function findNavItem(role: Role, pathname: string): NavItem | undefined {
  return NAV[role].flatMap((s) => s.items).find((i) => i.href === pathname);
}
