import { Eyebrow, PageHero, Section, usePageMeta } from "@/site/components/primitives";

const BELIEFS = [
  "Progress should be shown with evidence.",
  "A fair assessment never punishes a founder for saying less.",
  "A score is only useful if it leads to a next step.",
];

export default function About() {
  usePageMeta(
    "About PAVE and Merstra",
    "PAVE is built by Merstra, a strategy and execution organisation working with startup programs in India and internationally.",
  );

  return (
    <>
      <PageHero eyebrow="About" title="Built by people who run startup programs." />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <Eyebrow>Our story</Eyebrow>
          <div className="grid max-w-[64ch] gap-6 text-[17px] leading-relaxed">
            <p>
              Merstra designs and delivers incubation, acceleration and market-access programs, based in Kochi, India, with a
              presence in Sweden. PAVE came out of a practical problem in that work: funders asked what a program had changed,
              and nobody could answer with evidence.
            </p>
            <p className="text-muted">
              We started assessing every startup the same way at the start, middle and end of a program. The method became the
              Venture Progression Assessment Framework. The tool we built to run it became PAVE.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="subtle">
        <Eyebrow>What we believe</Eyebrow>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {BELIEFS.map((b, i) => (
            <li key={b} className="rounded-[16px] border border-line bg-canvas p-7">
              <span className="font-display text-[13px] text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-6 font-display text-[22px] leading-[1.2] tracking-[-0.03em]">{b}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Team and Partners: [TBD] names, roles and photos; partners only with written permission.
          Left off the page until supplied. */}
    </>
  );
}
