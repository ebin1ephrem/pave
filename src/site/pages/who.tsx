import { Building2, GraduationCap, Landmark, Lightbulb, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHero, Section, usePageMeta } from "@/site/components/primitives";

const SEGMENTS = [
  {
    id: "incubators",
    icon: Building2,
    title: "Incubators",
    problem: "Long programs, changing staff, and no shared record of where each incubatee stands.",
    pave: "A Benchmark at entry, a profile at each review, and a clear record of what moved while the venture was with you.",
  },
  {
    id: "accelerators",
    icon: Rocket,
    title: "Accelerators",
    problem: "A short window and pressure to show movement by demo day.",
    pave: "A Benchmark in week one, a plan weighted to the weakest dimension, and an Endline that shows change in numbers.",
  },
  {
    id: "universities",
    icon: GraduationCap,
    title: "Universities and research institutions",
    problem: "Spin-outs with strong technology and little else, assessed differently by every office.",
    pave: "One consistent assessment that puts customer, model, ownership, team and funding next to the technology.",
  },
  {
    id: "government",
    icon: Landmark,
    title: "Government and donor-funded programs",
    problem: "Many implementing partners, each reporting in its own format.",
    pave: "The same six dimensions and nine stages across every partner, with evidence behind each figure.",
  },
];

export default function WhoItsFor() {
  usePageMeta(
    "PAVE for incubators, accelerators, universities and government programs",
    "How startup support programs use PAVE to baseline their ventures, direct support and report results to funders.",
  );

  return (
    <>
      <PageHero eyebrow="Who it's for" title="One measure for every kind of startup program." />

      <Section>
        <div className="grid gap-4">
          {SEGMENTS.map(({ id, icon: Icon, title, problem, pave }) => (
            <article
              key={id}
              id={id}
              className="grid scroll-mt-24 gap-6 rounded-[16px] border border-line p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)] md:gap-10 md:p-8"
            >
              <div>
                <span className="grid size-10 place-items-center rounded-[8px] bg-subtle">
                  <Icon className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-[24px] leading-[1.15] tracking-[-0.03em]">{title}</h2>
              </div>
              <div>
                <p className="eyebrow">The problem</p>
                <p className="mt-2.5 text-[15.5px] leading-relaxed text-muted">{problem}</p>
              </div>
              <div className="rounded-[12px] bg-subtle p-5">
                <p className="eyebrow text-ink">With PAVE</p>
                <p className="mt-2.5 text-[15.5px] leading-relaxed">{pave}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="founders" tone="subtle">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr_auto] md:gap-10">
          <span className="grid size-14 place-items-center rounded-[12px] bg-accent">
            <Lightbulb className="size-6" strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">For founders</p>
            <h2 className="display-md mt-2.5">Founders</h2>
            <p className="lede mt-4 max-w-[64ch]">
              You get a clear picture of where your venture stands, what proof is missing, and what to do in the next 90 days.
              Your program invites you; there is nothing to buy.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
