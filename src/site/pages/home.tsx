import { ArrowRight, ArrowUpRight, Building2, Calculator, FileStack, GraduationCap, Landmark, Rocket, ShieldOff, Shuffle } from "lucide-react";
import { Link } from "react-router-dom";
import { DIMENSIONS } from "../../../framework/schema";
import { Button } from "@/components/ui/button";
import { SITE } from "@/site/config";
import { CHECKPOINT_RULES, DIMENSION_QUESTIONS, visibleFaq } from "@/site/content";
import { CheckList, Eyebrow, Pending, Section, SectionTitle, usePageMeta } from "@/site/components/primitives";
import { CohortGridPreview, EvidenceGapPreview, ProfilePreview } from "@/site/components/visuals";
import { FaqList } from "./faq";

const STATS = [
  { value: "6", label: "dimensions assessed" },
  { value: "9", label: "stages per dimension" },
  { value: "3", label: "checkpoints: Benchmark, Midline, Endline" },
  { value: "1", label: "report per startup: the Venture Progression Profile" },
];

const PROBLEMS = [
  { icon: ShieldOff, title: "Scores without proof.", body: "A founder says they have customers. Nobody asked to see the invoice." },
  { icon: Shuffle, title: "Progress that cannot be compared.", body: "Every mentor judges differently, and every review starts from a blank page." },
  { icon: Calculator, title: "Reports built by hand.", body: "When the funder asks what the program achieved, the team spends weeks assembling an answer." },
];

const DOES = [
  { title: "Founders complete a structured assessment.", body: "Six short sections. Plain-language answer choices. An evidence slot on every question." },
  { title: "PAVE places each venture on a stage.", body: "The highest stage with proof is awarded. Weak proof scores one stage lower. Claims with no proof are not counted." },
  { title: "Managers see the whole cohort.", body: "Stage by dimension for every startup, the evidence behind it, and a list of what is still missing." },
];

const STEPS = [
  { title: "Set up the program.", body: "Add your startups and invite founders by email." },
  { title: "Open the Benchmark.", body: "Founders answer and upload evidence. They can save and return." },
  { title: "Review the evidence.", body: "Accept it, mark it weak, or ask for more. Override a stage if you disagree, with a written reason." },
  { title: "Plan the next 90 days.", body: "Each startup gets a short plan weighted to its weakest dimension." },
  { title: "Repeat at Midline and Endline.", body: "PAVE carries earlier evidence forward and reports the change from first to last." },
];

const AUDIENCES = [
  { icon: Building2, title: "Incubators", body: "A baseline for every incubatee and a record of what your support changed.", anchor: "incubators" },
  { icon: Rocket, title: "Accelerators", body: "Measurable movement within a fixed program window.", anchor: "accelerators" },
  { icon: GraduationCap, title: "Universities", body: "One consistent way to assess spin-outs and student ventures.", anchor: "universities" },
  { icon: Landmark, title: "Government and donor programs", body: "The same measure across many implementing partners.", anchor: "government" },
];

const FIELD_RESULTS = [
  { value: "2.61 → 3.39", label: "Average stage across the cohort" },
  { value: "31 of 54", label: "Dimension scores advanced" },
  { value: "8 of 9", label: "Startups advanced on Customer, the largest move" },
  { value: "0", label: "Dimensions that declined for any startup" },
];

export default function Home() {
  usePageMeta(
    "PAVE — Venture progression assessment for startup programs",
    "PAVE shows where every startup in your program stands across six dimensions and nine stages, with the evidence behind each score and a clear view of what is missing.",
  );

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div aria-hidden="true" className="dot-grid absolute inset-x-0 top-0 h-[520px] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-70" />
        <div className="page-shell relative pt-14 pb-16 md:pt-24 md:pb-24">
          <div className="max-w-[920px]">
            <Eyebrow>Venture progression assessment</Eyebrow>
            <h1 className="display-xl mt-4">
              Know where every startup in your program stands.{" "}
              <span className="relative sm:whitespace-nowrap">
                <span className="relative z-10">Prove how far it moved.</span>
                <span aria-hidden="true" className="absolute inset-x-0 bottom-[0.08em] z-0 h-[0.22em] rounded-sm bg-accent" />
              </span>
            </h1>
            <p className="lede mt-6 max-w-[62ch]">
              PAVE assesses each venture across six dimensions and nine stages, backed by evidence founders upload. Program
              managers see what is proven, what is missing, and what changed between the start and end of the program.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/demo">
                  Book a demo <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/framework">Explore the framework</Link>
              </Button>
            </div>
            <p className="mt-5 text-[13px] text-muted">Built by Merstra from assessment work with live incubation cohorts.</p>
          </div>

          <div className="mt-14 md:mt-20">
            <CohortGridPreview />
          </div>
        </div>
      </header>

      {/* Stat strip */}
      <div className="border-y border-line bg-subtle">
        <div className="page-shell">
          <dl className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse justify-end gap-2 bg-subtle px-4 py-8 lg:px-8">
                <dt className="max-w-[24ch] text-[13.5px] leading-snug text-muted">{s.label}</dt>
                <dd className="font-display text-[44px] leading-none font-medium tracking-[-0.04em] tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Problem */}
      <Section>
        <SectionTitle
          eyebrow="The gap"
          title="Programs collect plenty of data. Very little of it shows progress."
          lede="Application forms, mentor notes, quarterly sheets for the funder. Each one is filled in separately, so the picture at intake never connects to the picture at exit."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-[12px] border border-line p-6">
              <span className="grid size-10 place-items-center rounded-[8px] bg-subtle">
                <Icon className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-[17px] leading-[1.25] tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* What PAVE does */}
      <Section tone="subtle">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow="The product" title="One assessment, repeated three times, with evidence attached." />
          <Button asChild variant="secondary">
            <Link to="/product">
              See how it works <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {DOES.map((d, i) => (
            <li key={d.title} className="rounded-[12px] border border-line bg-canvas p-6">
              <span className="font-display text-[13px] text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-[17px] leading-[1.25] tracking-[-0.02em]">{d.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* How it works */}
      <Section>
        <SectionTitle eyebrow="How it works" title="From invitation to report in five steps." />
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="how-step rounded-[12px] border border-line p-5">
              <span className="how-step-number font-display text-[13px] font-medium text-muted tabular-nums transition-colors">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-[15.5px] font-medium tracking-[-0.02em]">{s.title}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Framework */}
      <Section tone="subtle">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <div>
            <SectionTitle
              eyebrow="The framework"
              title="Six dimensions. Nine stages. One profile."
              lede="Most ventures do not stall on technology alone. The Venture Progression Assessment Framework looks at six things together, so a strong product cannot hide a missing customer."
            />
            <Button asChild className="mt-8">
              <Link to="/framework">
                Explore the framework <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-[12px] border border-line bg-canvas">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">The six dimensions and the question each answers</caption>
              <thead>
                <tr className="border-b border-line text-[11px] tracking-[0.07em] text-faint uppercase">
                  <th scope="col" className="px-5 py-3 font-semibold">Dimension</th>
                  <th scope="col" className="px-5 py-3 font-semibold">The question it answers</th>
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map((d) => (
                  <tr key={d.code} className="border-b border-line last:border-0">
                    <th scope="row" className="px-5 py-4 align-top text-[14.5px] font-medium whitespace-nowrap">{d.name}</th>
                    <td className="px-5 py-4 text-[14.5px] leading-relaxed text-muted">{DIMENSION_QUESTIONS[d.code]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Evidence view */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionTitle eyebrow="For program managers" title="See what is proven and what is only claimed." />
            <CheckList
              className="mt-8"
              items={[
                "A cohort grid: every startup, every dimension, one stage number each.",
                "A confidence marker on every score: high, medium or low.",
                "An evidence-gap list showing each claim with no proof or weak proof.",
                "One click to ask a founder for the missing document.",
                "Both the system score and any manager override are kept on record.",
              ]}
            />
          </div>
          <EvidenceGapPreview />
        </div>
      </Section>

      {/* Report */}
      <Section tone="subtle">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionTitle
              eyebrow="The output"
              title="The Venture Progression Profile."
              lede="A PDF for each startup at each checkpoint: its stage in all six dimensions, the reasoning, the evidence relied on, the evidence missing, and suggested next actions. A cohort summary shows the change from Benchmark to Endline."
            />
            <Button asChild variant="secondary" className="mt-8">
              <Link to="/product#profile">
                See what's in the profile <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ProfilePreview />
        </div>
      </Section>

      {/* Method */}
      <Section>
        <div className="on-dark relative overflow-hidden rounded-[22px] bg-ink px-6 py-14 text-on-dark md:px-14 md:py-16">
          <div aria-hidden="true" className="dot-grid-dark absolute inset-0 opacity-40" />
          <div className="relative">
            <p className="text-[11px] font-semibold tracking-[0.09em] text-on-dark-faint uppercase">The method</p>
            <h2 className="display-md mt-3 max-w-[20ch]">A founder who says less has not gone backwards.</h2>
            <p className="mt-5 max-w-[60ch] text-[16px] leading-relaxed text-on-dark-muted">
              Re-scoring from scratch at every review makes steady ventures look as if they regressed. PAVE avoids that with three rules.
            </p>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {CHECKPOINT_RULES.map((r) => (
                <div key={r.name} className="rounded-[12px] border border-white/10 bg-white/[0.03] p-6">
                  <span className="block h-[3px] w-9 rounded-full bg-accent" />
                  <p className="mt-5 font-display text-[22px] tracking-[-0.03em]">{r.name}</p>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-on-dark-muted">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Proof from the field */}
      <Section tone="subtle">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <SectionTitle eyebrow="In practice" title="Tested on a live cohort before it became a product." />
            <Pending note="IPTIF's written permission to be named and to publish these figures" block>
              <p className="lede mt-5">
                {SITE.iptifNamed
                  ? "In the IPTIF EIR 2026 program, nine startups were assessed at the start and at the end."
                  : "In a technology incubation program at a national institute, nine startups were assessed at the start and at the end."}
              </p>
            </Pending>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {FIELD_RESULTS.map((r, i) => (
              <div key={r.label} className="flex flex-col-reverse justify-end rounded-[12px] border border-line bg-canvas p-6">
                <dt className="mt-2 text-[13.5px] leading-snug text-muted">{r.label}</dt>
                <dd className="font-display text-[34px] leading-none font-medium tracking-[-0.035em] tabular-nums">
                  {r.value}
                  {i === 0 ? <span className="mt-3 block h-[3px] w-9 rounded-full bg-accent" /> : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* Who it's for */}
      <Section>
        <SectionTitle eyebrow="Built for programs" title="For the people who run and fund startup support." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map(({ icon: Icon, title, body, anchor }) => (
            <Link
              key={title}
              to={`/who-its-for#${anchor}`}
              className="card-interactive group flex flex-col rounded-[12px] border border-line p-6"
            >
              <span className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-[8px] bg-subtle">
                  <Icon className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <ArrowUpRight className="size-4 text-faint transition-colors group-hover:text-ink" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-[17px] leading-[1.25] tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* FAQ teaser */}
      <Section tone="subtle">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <SectionTitle eyebrow="Questions" title="What programs ask first." />
            <Button asChild variant="secondary" className="mt-8">
              <Link to="/faq">
                <FileStack className="size-4" aria-hidden="true" /> All questions
              </Link>
            </Button>
          </div>
          <FaqList items={visibleFaq().filter((f) => ["What if a founder has no evidence?", "Can a score go down?", "Is PAVE an investment rating?"].includes(f.q))} />
        </div>
      </Section>
    </>
  );
}
