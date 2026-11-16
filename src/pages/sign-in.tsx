import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ROLE_HOME, ROLE_LABEL, useSession, type Role } from "@/auth/session";
import { Brand } from "@/components/shell/brand";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label } from "@/components/ui/input";

const PREVIEW_ROLES: Role[] = ["founder", "manager", "customer_admin", "merstra_admin"];

export default function SignIn() {
  const { user, previewAs } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Email sign-in is wired up with the data model and auth work.
    setNotice("Email sign-in is not connected yet.");
  };

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_44%]">
      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-[380px]">
          <Link to="/" aria-label="PAVE, home" className="mb-11 inline-flex">
            <Brand />
          </Link>
          <h1 className="text-[30px] leading-[1.1] font-medium tracking-[-0.035em]">Sign in to PAVE</h1>
          <Hint className="mt-2">Enter your email and we will send you a sign-in link.</Hint>

          <form onSubmit={onSubmit} className="mt-8 grid gap-4" noValidate>
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@organisation.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={notice ? "sign-in-notice" : undefined}
                required
              />
            </div>
            <Button type="submit" disabled={!email.includes("@")}>
              Send link
            </Button>
            {notice ? (
              <p id="sign-in-notice" role="status" className="text-[13px] text-warn">
                {notice}
              </p>
            ) : null}
          </form>

          <p className="mt-6 text-[13.5px] leading-relaxed text-muted">
            PAVE is by invitation. Ask your program manager, or{" "}
            <Link to="/demo" className="text-ink underline underline-offset-2">
              book a demo
            </Link>
            .
          </p>

          {import.meta.env.DEV ? (
            <div className="mt-10 border-t border-line pt-6">
              <p className="eyebrow">Development preview</p>
              <Hint className="mt-1.5">Open the app shell as a sample user. Not available in production builds.</Hint>
              <div className="mt-3 flex flex-wrap gap-2">
                {PREVIEW_ROLES.map((role) => (
                  <Button
                    key={role}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      previewAs(role);
                      navigate(ROLE_HOME[role]);
                    }}
                  >
                    {ROLE_LABEL[role]}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <aside className="on-dark hidden bg-ink p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="dot-grid-dark h-24 rounded-[12px] opacity-40" />
        <div>
          <p className="text-[26px] leading-[1.15] font-medium tracking-[-0.03em] text-on-dark">
            Where a venture stands, and the evidence behind it.
          </p>
          <p className="mt-4 max-w-[38ch] text-[14px] leading-relaxed text-on-dark-muted">
            Six dimensions, nine stages, three checkpoints. Every stage is backed by proof a program manager can open.
          </p>
        </div>
        <p className="text-[12px] tracking-[0.06em] text-on-dark-faint uppercase">Venture Progression Assessment</p>
      </aside>
    </main>
  );
}
