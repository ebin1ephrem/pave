import { ArrowRight, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { BandBadge, StageBadge } from "@/components/patterns/stage-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE } from "@/site/config";
import { BANDS, CHECKPOINT_RULES, DIMENSION_DETAILS, SCORING_RULES } from "@/site/content";
import { Eyebrow, PageHero, Pending, Section, SectionTitle, usePageMeta } from "@/site/components/primitives";

const BAND_FILL = {
  Explore: "bg-subtle border-line",
  Validate: "bg-ink border-ink",
  Scale: "bg-accent border-accent",
} as const;

export default function Framework() {
  usePageMeta(
    "The Venture Progression Assessment Framework — six dimensions, nine stages",
    "The framework behind PAVE: six dimensions of venture progress, nine stages each, with evidence-based scoring rules developed by Merstra.",
  );

  return (
    <>
      <PageHero
        eyebrow="The framework"
        title="The Venture Progression Assessment Framework."
        lede="A way to say, with evidence, how far a venture has come and what stands between it and the next stage."
        actions={
          <>
            <Button asChild size="lg">
              <Link to="/demo">
                Book a demo <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            {SITE.frameworkPdfUrl ? (
              <Button asChild size="lg" variant="secondary">
                <a href={SITE.frameworkPdfUrl} download>
                  <Download className="size-4" aria-hidden="true" /> Download the one-page overview
                </a>
              </Button>
            ) : import.meta.env.DEV ? (
              <Pending note="One-page overview PDF (hidden in production until supplied)">
                <Button size="lg" variant="secondary" disabled>
                  <Download className="size-4" aria-hidden="true" /> Download the one-page overview
                </Button>
              </Pending>
            ) : null}
          </>
        }
      />

      {/* Origin */}
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <SectionTitle eyebrow="Where it comes from" title="Developed in the room with founders." />
          <Pending note="Final wording after the IP review of the framework text" block>
            <p className="lede lg:pt-8">
              Merstra developed the framework through its assessment work with startup cohorts, refining the stage tests and
              scoring rules against the evidence founders actually submitted.
            </p>
          </Pending>
        </div>
      </Section>

      {/* Shape */}
      <Section id="stages" tone="subtle">
        <SectionTitle eyebrow="The shape" title="Six dimensions, nine stages, three bands." />

        <div className="mt-12" aria-hidden="true">
          <div className="grid grid-cols-9 gap-1.5">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((s) => {
              const band = s <= 3 ? "Explore" : s <= 6 ? "Validate" : "Scale";
              return (
                <div
                  key={s}
                  className={cn(
                    "flex items-end rounded-[8px] border p-2 sm:p-3",
                    BAND_FILL[band],
                    band === "Validate" ? "text-white" : "text-ink",
                  )}
                  style={{ height: `${44 + s * 12}px` }}
                >
                  <span className="font-display text-[13px] font-medium tabular-nums sm:text-[15px]">{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {BANDS.map((b) => (
            <div key={b.name} className="rounded-[12px] border border-line bg-canvas p-6">
              <div className="flex items-center justify-between gap-3">
                <BandBadge band={b.name} />
                <span className="text-[12.5px] text-muted">{b.range}</span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
        <p className="lede mt-10 max-w-[70ch]">
          A venture has one stage per dimension. The six stages together are its profile. Uneven profiles are normal, and the
          lowest dimension is usually where support helps most.
        </p>
      </Section>

      {/* Dimensions */}
      <Section id="dimensions">
        <SectionTitle
          eyebrow="The six dimensions"
          title="What each dimension tracks."
          lede="Stage 1, Stage 5 and Stage 9 are shown as examples. The full stage tests appear in the product."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {DIMENSION_DETAILS.map((d) => (
            <article key={d.code} id={d.name.toLowerCase().replace(/\s+/g, "-")} className="scroll-mt-24 rounded-[16px] border border-line p-6 md:p-7">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[22px] tracking-[-0.03em]">{d.name}</h3>
                <span className="font-display text-[12px] tracking-[0.08em] text-faint">{d.code}</span>
              </div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{d.summary}</p>
              <ol className="mt-6 grid gap-3 border-t border-line pt-5">
                {d.examples.map((ex) => (
                  <li key={ex.stage} className="grid grid-cols-[76px_1fr] items-start gap-3">
                    <StageBadge stage={ex.stage} className="justify-self-start" />
                    <span className="text-[14.5px] leading-relaxed">{ex.text}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 rounded-[8px] bg-subtle px-4 py-3 text-[13px] leading-relaxed">
                <span className="font-medium">Typical evidence: </span>
                <span className="text-muted">{d.evidence}</span>
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* Scoring */}
      <Section id="scoring" tone="subtle">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <SectionTitle eyebrow="Scoring rules" title="How a stage is awarded." />
          <ol className="grid gap-px overflow-hidden rounded-[12px] border border-line bg-line">
            {SCORING_RULES.map((rule, i) => (
              <li key={rule} className="flex items-baseline gap-5 bg-canvas px-6 py-5">
                <span className="font-display text-[13px] text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[16px] leading-relaxed">{rule}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Across checkpoints */}
      <Section>
        <SectionTitle eyebrow="Across checkpoints" title="Measuring change fairly." />
        <div className="mt-12 grid gap-3 md:grid-cols-4">
          {CHECKPOINT_RULES.map((r) => (
            <div key={r.name} className="rounded-[12px] border border-line p-6">
              <span className="block h-[3px] w-9 rounded-full bg-accent" />
              <p className="mt-5 font-display text-[20px] tracking-[-0.03em]">{r.name}</p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{r.text}</p>
            </div>
          ))}
          <div className="on-dark rounded-[12px] bg-ink p-6 text-on-dark">
            <span className="block h-[3px] w-9 rounded-full bg-accent" />
            <p className="mt-5 font-display text-[20px] tracking-[-0.03em]">Reported change</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-on-dark-muted">Always Benchmark to Endline.</p>
          </div>
        </div>
      </Section>

      {/* What it is not */}
      <Section tone="subtle">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <Eyebrow>Limits</Eyebrow>
            <h2 className="display-md mt-2.5">What the framework is not.</h2>
          </div>
          <ul className="grid gap-3">
            {[
              ["Not a valuation or an investment recommendation.", null],
              ["Not a ranking of founders.", null],
              ["Not a pass/fail gate.", "A low stage describes where a venture is, not what it is worth."],
            ].map(([title, note]) => (
              <li key={title} className="rounded-[12px] border border-line bg-canvas px-6 py-5">
                <p className="text-[16px] font-medium tracking-[-0.01em]">{title}</p>
                {note ? <p className="mt-1 text-[14.5px] text-muted">{note}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
