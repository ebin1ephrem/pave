import { ArrowRight, Check, Globe2, Minus, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE } from "@/site/config";
import { PageHero, Pending, Section, usePageMeta } from "@/site/components/primitives";

const ON_REQUEST = "On request";

function tbd(value: string | null, note: string): ReactNode {
  return value ? value : <Pending note={note}>{ON_REQUEST}</Pending>;
}

type Cell = boolean | ReactNode;

const TIERS = [
  {
    name: "Starter",
    for: "One cohort",
    price: tbd(SITE.pricing.starter.price, "Starter price"),
    cta: { label: "Book a demo", to: "/demo" },
  },
  {
    name: "Growth",
    for: "Several programs a year",
    price: tbd(SITE.pricing.growth.price, "Growth price"),
    cta: { label: "Book a demo", to: "/demo" },
    featured: true,
  },
  {
    name: "Enterprise",
    for: "Government, multi-partner and national programs",
    price: "Contact us",
    cta: { label: "Talk to us", to: "/demo" },
  },
];

const ROWS: { label: string; cells: [Cell, Cell, Cell] }[] = [
  {
    label: "Active startups",
    cells: [tbd(SITE.pricing.starter.startups, "Starter startup limit"), tbd(SITE.pricing.growth.startups, "Growth startup limit"), "Custom"],
  },
  {
    label: "Manager seats",
    cells: [tbd(SITE.pricing.starter.seats, "Starter seats"), tbd(SITE.pricing.growth.seats, "Growth seats"), "Custom"],
  },
  { label: "Checkpoints, evidence review, dashboard", cells: [true, true, true] },
  { label: "Venture Progression Profile PDFs", cells: [true, true, true] },
  { label: "Cohort summary report", cells: [true, true, true] },
  { label: "Your logo on reports", cells: [false, true, true] },
  { label: "Cross-program view", cells: [false, true, true] },
  {
    label: "Onboarding and assessor training",
    cells: [tbd(SITE.pricing.starter.onboarding, "Starter onboarding"), tbd(SITE.pricing.growth.onboarding, "Growth onboarding"), "Included"],
  },
];

function Value({ v }: { v: Cell }) {
  if (v === true) return <Check className="size-4 text-ok" aria-label="Included" />;
  if (v === false) return <Minus className="size-4 text-faint" aria-label="Not included" />;
  return <span className="text-[14px]">{v}</span>;
}

export default function Pricing() {
  usePageMeta("PAVE pricing", "PAVE pricing for startup programs, from a single cohort to multi-program organisations.");

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Priced by program, not by founder login."
        lede={
          <Pending note="Pricing model and all figures">
            Founders and mentors do not pay.
          </Pending>
        }
      />

      <Section>
        {/* Tier cards */}
        <div className="grid gap-4 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={cn(
                "flex flex-col rounded-[16px] border p-7",
                t.featured ? "on-dark border-ink bg-ink text-on-dark" : "border-line",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] tracking-[-0.03em]">{t.name}</h2>
                {t.featured ? <span className="block h-[3px] w-9 rounded-full bg-accent" /> : null}
              </div>
              <p className={cn("mt-1.5 text-[14px]", t.featured ? "text-on-dark-muted" : "text-muted")}>{t.for}</p>
              <p className="mt-8 font-display text-[32px] leading-none font-medium tracking-[-0.035em]">{t.price}</p>
              <ul className={cn("mt-8 grid gap-2.5 text-[14px]", t.featured ? "text-on-dark-muted" : "text-muted")}>
                {ROWS.filter((r) => [true, "Included"].includes(r.cells[TIERS.indexOf(t)] as never)).map((r) => (
                  <li key={r.label} className="flex items-start gap-2.5">
                    <Check className={cn("mt-0.5 size-4 shrink-0", t.featured ? "text-accent" : "text-ok")} aria-hidden="true" />
                    {r.label}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <Button asChild className="w-full" variant={t.featured ? "accent" : "primary"}>
                  <Link to={t.cta.to}>{t.cta.label}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-16 overflow-x-auto rounded-[12px] border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Plan comparison</caption>
            <thead>
              <tr className="border-b border-line bg-subtle">
                <th scope="col" className="px-5 py-4 text-[11px] font-semibold tracking-[0.07em] text-faint uppercase">
                  Compare plans
                </th>
                {TIERS.map((t) => (
                  <th key={t.name} scope="col" className="px-5 py-4 text-[14px] font-medium">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <th scope="row" className="px-5 py-4 text-[14px] font-normal text-muted">For</th>
                {TIERS.map((t) => (
                  <td key={t.name} className="px-5 py-4 text-[14px]">{t.for}</td>
                ))}
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="px-5 py-4 text-[14px] font-normal text-muted">Price</th>
                {TIERS.map((t) => (
                  <td key={t.name} className="px-5 py-4 text-[14px] font-medium">{t.price}</td>
                ))}
              </tr>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-b border-line last:border-0">
                  <th scope="row" className="px-5 py-4 text-[14px] font-normal text-muted">{r.label}</th>
                  {r.cells.map((c, i) => (
                    <td key={i} className="px-5 py-4">
                      <Value v={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {SITE.showEmergingMarkets || SITE.showAssessmentService ? (
        <Section tone="subtle">
          <div className="grid gap-4 lg:grid-cols-2">
            {SITE.showEmergingMarkets ? (
              <Pending note="Whether the Emerging Markets Edition launches with v1, eligibility, and limits" block>
                <div className="flex h-full flex-col rounded-[16px] border border-line bg-canvas p-7">
                  <span className="grid size-10 place-items-center rounded-[8px] bg-accent">
                    <Globe2 className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <p className="eyebrow mt-6">Emerging Markets Edition</p>
                  <h2 className="mt-2 text-[24px] leading-[1.15] tracking-[-0.03em]">Free for eligible programs in emerging markets.</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    Verified incubators and accelerators in eligible countries can run PAVE at no cost, within set limits. In
                    return, programs agree to contribute anonymised progression data to Merstra's research.
                  </p>
                  <div className="mt-auto pt-7">
                    <Button asChild variant="secondary">
                      <Link to="/demo?interest=emerging-markets">
                        Check eligibility <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Pending>
            ) : null}
            {SITE.showAssessmentService ? (
              <Pending note="Assessment-as-a-service offer and price" block>
                <div className="flex h-full flex-col rounded-[16px] border border-line bg-canvas p-7">
                  <span className="grid size-10 place-items-center rounded-[8px] bg-subtle">
                    <UsersRound className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <p className="eyebrow mt-6">Assessment as a service</p>
                  <h2 className="mt-2 text-[24px] leading-[1.15] tracking-[-0.03em]">Prefer that Merstra runs the assessment for you?</h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    Our team can conduct Benchmark, Midline and Endline assessments for your cohort and deliver the profiles.
                  </p>
                  <div className="mt-auto pt-7">
                    <Button asChild variant="secondary">
                      <Link to="/demo?interest=assessment-service">
                        Talk to us <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Pending>
            ) : null}
          </div>
        </Section>
      ) : null}
    </>
  );
}
