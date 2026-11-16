import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ROLE_HOME, useSession } from "@/auth/session";
import { Brand } from "@/components/shell/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE } from "@/site/config";
import { CookieNotice } from "./cookie-notice";
import { Pending } from "./primitives";

const NAV = [
  { to: "/product", label: "Product" },
  { to: "/framework", label: "Framework" },
  { to: "/who-its-for", label: "Who it's for" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

const FOOTER: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { to: "/product", label: "How it works" },
      { to: "/product#founder-assessment", label: "Founder assessment" },
      { to: "/product#dashboard", label: "Program dashboard" },
      { to: "/product#profile", label: "Venture Progression Profile" },
      { to: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Framework",
    links: [
      { to: "/framework", label: "Overview" },
      { to: "/framework#dimensions", label: "Six dimensions" },
      { to: "/framework#stages", label: "Nine stages" },
      { to: "/framework#scoring", label: "Scoring rules" },
    ],
  },
  {
    title: "Who it's for",
    links: [
      { to: "/who-its-for#incubators", label: "Incubators" },
      { to: "/who-its-for#accelerators", label: "Accelerators" },
      { to: "/who-its-for#universities", label: "Universities" },
      { to: "/who-its-for#government", label: "Government programs" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Merstra" },
      { to: "/demo", label: "Contact" },
      { to: "/faq", label: "FAQ" },
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
      { to: "/sign-in", label: "Sign in" },
    ],
  },
];

/** Scrolls to the top on navigation, or to the #hash target when there is one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function SiteHeader() {
  const { user } = useSession();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const account = user ? (
    <Button asChild variant="ghost" size="sm">
      <Link to={ROLE_HOME[user.role]}>Open PAVE</Link>
    </Button>
  ) : (
    <Button asChild variant="ghost" size="sm">
      <Link to="/sign-in">Sign in</Link>
    </Button>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-canvas/90 backdrop-blur transition-colors duration-200",
        scrolled || open ? "border-line" : "border-transparent",
      )}
    >
      <div className="page-shell flex h-16 items-center justify-between gap-6">
        <Link to="/" className="inline-flex items-baseline gap-1.5" aria-label="PAVE by Merstra, home">
          <Brand />
          <span className="hidden text-[12px] text-muted sm:inline">by Merstra</span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-[6px] px-3 py-2 text-[13.5px] transition-colors hover:bg-subtle hover:text-ink",
                      isActive ? "font-medium text-ink" : "text-muted",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {account}
          <Button asChild size="sm">
            <Link to="/demo">Book a demo</Link>
          </Button>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-[8px] hover:bg-subtle lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line bg-canvas lg:hidden">
          <ul className="page-shell grid gap-1 py-4">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn("block rounded-[8px] px-3 py-3 text-[15px]", isActive ? "bg-subtle font-medium" : "text-ink")
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-3 grid grid-cols-2 gap-2">
              <Button asChild variant="secondary">
                <Link to={user ? ROLE_HOME[user.role] : "/sign-in"}>{user ? "Open PAVE" : "Sign in"}</Link>
              </Button>
              <Button asChild>
                <Link to="/demo">Book a demo</Link>
              </Button>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="on-dark bg-ink text-on-dark">
      <div className="page-shell py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link to="/" aria-label="PAVE, home" className="inline-flex">
              <Brand className="text-on-dark" />
            </Link>
            <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed text-on-dark-muted">
              PAVE is the Venture Progression Assessment tool from Merstra.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-semibold tracking-[0.09em] text-on-dark-faint uppercase">{col.title}</p>
                <ul className="mt-4 grid gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="text-[13.5px] text-on-dark-muted transition-colors hover:text-on-dark">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-[12.5px] text-on-dark-faint sm:flex-row sm:justify-between">
          <p>© 2026 Merstra. All rights reserved.</p>
          <Pending note="Office addresses to show">
            <p>{SITE.offices}</p>
          </Pending>
        </div>
      </div>
    </footer>
  );
}

/** Repeating call-to-action band at the bottom of every public page. */
export function CtaBand() {
  return (
    <section className="py-16 md:py-24">
      <div className="page-shell">
        <div className="on-dark relative overflow-hidden rounded-[22px] bg-ink px-6 py-14 text-on-dark md:px-14 md:py-20">
          <div aria-hidden="true" className="dot-grid-dark absolute inset-0 opacity-40" />
          <div className="relative max-w-[640px]">
            <p className="text-[11px] font-semibold tracking-[0.09em] text-on-dark-faint uppercase">Get started</p>
            <h2 className="display-md mt-3">Run your next cohort on evidence.</h2>
            <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-on-dark-muted">
              Start with one cohort. See where every startup stands at Benchmark, and prove what changed by Endline.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg">
                <Link to="/demo">
                  Book a demo <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" className="border-white/15 bg-transparent hover:bg-white/5">
                <Link to="/framework">See the framework</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-[8px] bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <ScrollManager />
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
        <CtaBand />
      </main>
      <SiteFooter />
      <CookieNotice />
    </div>
  );
}
