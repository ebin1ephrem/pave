import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SITE, contactFor } from "@/site/config";
import { PageHero, Pending, Section, usePageMeta } from "@/site/components/primitives";
import { submitDemoRequest, validateDemoRequest, type DemoErrors, type DemoRequest } from "@/site/demo-request";

export const ORG_TYPES = [
  "Incubator",
  "Accelerator",
  "University",
  "Government or donor program",
  "Investor",
  "Other",
] as const;

export const VOLUMES = ["Up to 25", "26–100", "101–500", "More than 500"] as const;

const INTEREST_NOTE: Record<string, string> = {
  "emerging-markets": "I'd like to check eligibility for the Emerging Markets Edition.",
  "assessment-service": "I'd like Merstra to run the assessments for our cohort.",
};

function Email({ kind }: { kind: "general" | "partnerships" }) {
  const email = contactFor(kind);
  return email ? (
    <a href={`mailto:${email}`} className="underline underline-offset-2 hover:text-ink">
      {email}
    </a>
  ) : (
    <Pending note="Contact email">the email address on this page</Pending>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-1.5 text-[12.5px] text-danger">
      {message}
    </p>
  ) : null;
}

export default function Demo() {
  usePageMeta(
    "Book a PAVE demo",
    `See PAVE with your own program in mind. Book a ${SITE.demoMinutes}-minute demo with the Merstra team.`,
  );
  const [params] = useSearchParams();
  const [form, setForm] = useState<DemoRequest>({
    fullName: "",
    workEmail: "",
    organisation: "",
    role: "",
    orgType: "",
    country: "",
    volume: "",
    message: INTEREST_NOTE[params.get("interest") ?? ""] ?? "",
    consent: false,
  });
  const [errors, setErrors] = useState<DemoErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const set = <K extends keyof DemoRequest>(key: K, value: DemoRequest[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateDemoRequest(form);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`demo-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    setStatus((await submitDemoRequest(form)) ? "sent" : "failed");
  };

  const err = (key: keyof DemoRequest) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `demo-${key}-error` : undefined,
  });

  return (
    <>
      <PageHero
        eyebrow="Book a demo"
        title="See PAVE with your program in mind."
        lede={
          <Pending note="Demo length">
            A {SITE.demoMinutes}-minute call. We walk through the founder assessment, the dashboard and a sample profile, and
            answer your questions.
          </Pending>
        }
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          {status === "sent" ? (
            <div role="status" className="rounded-[16px] border border-line p-8 md:p-10">
              <CheckCircle2 className="size-8 text-ok" aria-hidden="true" />
              <h2 className="mt-5 text-[26px] leading-[1.12] tracking-[-0.032em]">Thank you.</h2>
              <p className="mt-3 max-w-[52ch] text-[15.5px] leading-relaxed text-muted">
                <Pending note="Response time">
                  We have your request and will reply within {SITE.responseTime} with available times.
                </Pending>
              </p>
              <Button asChild variant="secondary" className="mt-8">
                <Link to="/framework">Read about the framework</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="demo-fullName">Full name *</Label>
                <Input id="demo-fullName" autoComplete="name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} {...err("fullName")} />
                <FieldError id="demo-fullName-error" message={errors.fullName} />
              </div>
              <div>
                <Label htmlFor="demo-workEmail">Work email *</Label>
                <Input id="demo-workEmail" type="email" autoComplete="email" value={form.workEmail} onChange={(e) => set("workEmail", e.target.value)} {...err("workEmail")} />
                <FieldError id="demo-workEmail-error" message={errors.workEmail} />
              </div>
              <div>
                <Label htmlFor="demo-organisation">Organisation *</Label>
                <Input id="demo-organisation" autoComplete="organization" value={form.organisation} onChange={(e) => set("organisation", e.target.value)} {...err("organisation")} />
                <FieldError id="demo-organisation-error" message={errors.organisation} />
              </div>
              <div>
                <Label htmlFor="demo-role">Role *</Label>
                <Input id="demo-role" autoComplete="organization-title" value={form.role} onChange={(e) => set("role", e.target.value)} {...err("role")} />
                <FieldError id="demo-role-error" message={errors.role} />
              </div>
              <div>
                <Label htmlFor="demo-orgType">Type of organisation *</Label>
                <Select id="demo-orgType" value={form.orgType} onChange={(e) => set("orgType", e.target.value)} {...err("orgType")}>
                  <option value="">Choose one</option>
                  {ORG_TYPES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
                <FieldError id="demo-orgType-error" message={errors.orgType} />
              </div>
              <div>
                <Label htmlFor="demo-country">Country *</Label>
                <Input id="demo-country" autoComplete="country-name" value={form.country} onChange={(e) => set("country", e.target.value)} {...err("country")} />
                <FieldError id="demo-country-error" message={errors.country} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="demo-volume">Startups supported per year</Label>
                <Select id="demo-volume" value={form.volume} onChange={(e) => set("volume", e.target.value)}>
                  <option value="">Choose one (optional)</option>
                  {VOLUMES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="demo-message">What would you like to see? (optional)</Label>
                <Textarea id="demo-message" value={form.message} onChange={(e) => set("message", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-start gap-3 text-[14px] leading-relaxed">
                  <input
                    id="demo-consent"
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-ink"
                    checked={form.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    {...err("consent")}
                  />
                  <span>
                    I agree to be contacted about PAVE. See our{" "}
                    <Link to="/privacy" className="underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    . *
                  </span>
                </label>
                <FieldError id="demo-consent-error" message={errors.consent} />
              </div>

              <div className="sm:col-span-2">
                <Button type="submit" size="lg" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Request a demo"}
                </Button>
                {status === "failed" ? (
                  <p role="alert" className="mt-4 text-[14px] text-danger">
                    Something went wrong and your request was not sent. Please try again, or email us at <Email kind="general" />.
                  </p>
                ) : null}
              </div>
            </form>
          )}

          <aside className="grid content-start gap-6 rounded-[16px] bg-subtle p-7 text-[14.5px] leading-relaxed">
            <div>
              <p className="font-medium">Other enquiries</p>
              <p className="mt-1 text-muted">
                <Email kind="general" />
              </p>
            </div>
            <div>
              <p className="font-medium">Partnerships and research</p>
              <p className="mt-1 text-muted">
                <Email kind="partnerships" />
              </p>
            </div>
            <div>
              <p className="font-medium">Founders</p>
              <p className="mt-1 text-muted">PAVE is provided through your program. Ask your program manager for an invitation.</p>
            </div>
            <div>
              <p className="font-medium">Offices</p>
              <p className="mt-1 text-muted">
                <Pending note="Office addresses">{SITE.offices}</Pending>
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
