import { ArrowRight, FileSearch, Plus, Upload } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/patterns/empty-state";
import { FilterChips } from "@/components/patterns/filter-chips";
import { SectionHeader } from "@/components/patterns/section-header";
import { BandBadge, StageBadge } from "@/components/patterns/stage-badge";
import { StatStrip } from "@/components/patterns/stat-tile";
import { StatusCard } from "@/components/patterns/status-card";
import { StepSequence } from "@/components/patterns/step-sequence";
import { Brand } from "@/components/shell/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, DarkPanel } from "@/components/ui/card";
import { Hint, Input, Label, Select, Textarea } from "@/components/ui/input";

const COLOURS: { name: string; token: string; hex: string; dark?: boolean }[] = [
  { name: "Canvas", token: "canvas", hex: "#ffffff" },
  { name: "Subtle", token: "subtle", hex: "#f6f7f4" },
  { name: "Line", token: "line", hex: "#e7e7e7" },
  { name: "Line strong", token: "line-strong", hex: "#d8d8d8" },
  { name: "Faint", token: "faint", hex: "#9a9a9a" },
  { name: "Muted", token: "muted", hex: "#707070", dark: true },
  { name: "Ink 3", token: "ink-3", hex: "#2a2a2a", dark: true },
  { name: "Ink 2", token: "ink-2", hex: "#202020", dark: true },
  { name: "Ink", token: "ink", hex: "#151515", dark: true },
  { name: "Accent", token: "accent", hex: "#b9ff5a" },
  { name: "Accent hover", token: "accent-hover", hex: "#aaf04d" },
  { name: "OK", token: "ok", hex: "#1f7a4d", dark: true },
  { name: "Warn", token: "warn", hex: "#b76e00", dark: true },
  { name: "Danger", token: "danger", hex: "#c0392b", dark: true },
];

const RADII = [
  ["Control", "6px"],
  ["Button", "8px"],
  ["Card", "12px"],
  ["Panel", "16px"],
  ["Showcase", "22px"],
] as const;

const SHADOWS = [
  ["Float", "var(--shadow-float)"],
  ["Lifted", "var(--shadow-lifted)"],
  ["Showcase", "var(--shadow-showcase)"],
] as const;

type Checkpoint = "benchmark" | "midline" | "endline";
type BandFilter = "explore" | "validate" | "scale";

function Block({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="border-t border-line py-12">
      <h2 className="text-[22px] leading-[1.15] tracking-[-0.03em]">{title}</h2>
      {note ? <p className="mt-1.5 max-w-[70ch] text-[13.5px] text-muted">{note}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 py-3 md:grid-cols-[160px_1fr] md:items-center">
      <p className="text-[12.5px] text-muted">{label}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

const SECTIONS = [
  ["colour", "Colour"],
  ["type", "Type"],
  ["shape", "Shape"],
  ["buttons", "Buttons"],
  ["badges", "Badges"],
  ["forms", "Forms"],
  ["section-header", "Section header"],
  ["stats", "Stat tiles"],
  ["cards", "Cards"],
  ["chips", "Filter chips"],
  ["steps", "Steps"],
  ["empty", "Empty states"],
] as const;

export default function Styleguide() {
  const [checkpoint, setCheckpoint] = useState<Checkpoint[]>(["benchmark"]);
  const [bands, setBands] = useState<BandFilter[]>(["validate"]);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="page-shell flex h-[66px] items-center justify-between gap-4">
          <Link to="/">
            <Brand />
          </Link>
          <nav aria-label="Style guide sections" className="hidden gap-5 overflow-x-auto lg:flex">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="text-[13px] whitespace-nowrap text-muted hover:text-ink">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="page-shell pb-24">
        <div className="py-14">
          <SectionHeader
            as="h1"
            size="lg"
            eyebrow="Design system"
            title="PAVE style guide"
            lede="Every component in each state. Tokens are taken from the FundRadar source so the two products read as one family: mostly white, some charcoal, very little lime."
          />
        </div>

        <Block id="colour" title="Colour" note="Hierarchy comes from type, space and 1px lines. Accent is kept under roughly 5% of any screen.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {COLOURS.map((c) => (
              <div key={c.token} className="overflow-hidden rounded-[12px] border border-line">
                <div className="h-16" style={{ background: c.hex }} />
                <div className="p-2.5">
                  <p className="text-[12.5px] font-medium">{c.name}</p>
                  <p className="text-[11.5px] text-muted tabular-nums">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block id="type" title="Type" note="Inter Tight (weight 500) for headings and figures; Inter for everything else.">
          <div className="grid gap-7">
            <div>
              <p className="eyebrow mb-2">display-xl · clamp(40px, 6vw, 82px) / 1.0 / -0.04em</p>
              <p className="display-xl">Venture progression</p>
            </div>
            <div>
              <p className="eyebrow mb-2">display-lg · clamp(32px, 4vw, 60px) / 1.04 / -0.035em</p>
              <p className="display-lg">Six dimensions, nine stages</p>
            </div>
            <div>
              <p className="eyebrow mb-2">display-md · clamp(26px, 2.6vw, 40px) / 1.08 / -0.03em</p>
              <p className="display-md">Benchmark to Endline</p>
            </div>
            <div>
              <p className="eyebrow mb-2">Page title · 26px / 1.12 / -0.032em</p>
              <p className="font-display text-[26px] leading-[1.12] font-medium tracking-[-0.032em]">Cohort overview</p>
            </div>
            <div>
              <p className="eyebrow mb-2">Card title · 17px / 1.25 / -0.02em</p>
              <p className="text-[17px] leading-[1.25] font-medium tracking-[-0.02em]">Customer evidence</p>
            </div>
            <div>
              <p className="eyebrow mb-2">lede · clamp(16px, 1.4vw, 19px) / 1.6</p>
              <p className="lede max-w-[60ch]">
                A stage is passed only when its test is true and proof exists.
              </p>
            </div>
            <div>
              <p className="eyebrow mb-2">Body · 16px / 1.55</p>
              <p className="max-w-[60ch]">
                Each dimension is scored at the highest stage whose test is passed with proof.
              </p>
            </div>
            <div>
              <p className="eyebrow mb-2">Small · 14px, 13px, 12.5px</p>
              <p className="text-[14px] text-muted">Supporting text at 14px.</p>
              <p className="text-[13px] text-muted">Secondary text at 13px.</p>
              <p className="hint">Hint text at 12.5px.</p>
            </div>
            <div>
              <p className="eyebrow mb-2">Eyebrow · 11px / 600 / 0.09em / uppercase</p>
              <p className="eyebrow">Evidence gaps</p>
            </div>
          </div>
        </Block>

        <Block id="shape" title="Shape" note="Radius, shadow and the dot grid.">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-wrap gap-3">
              {RADII.map(([name, r]) => (
                <div key={name} className="text-center">
                  <div className="size-20 border border-line-strong bg-subtle" style={{ borderRadius: r }} />
                  <p className="mt-2 text-[12.5px] font-medium">{name}</p>
                  <p className="text-[11.5px] text-muted">{r}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-6">
              {SHADOWS.map(([name, s]) => (
                <div key={name} className="text-center">
                  <div className="size-20 rounded-[12px] bg-canvas" style={{ boxShadow: s }} />
                  <p className="mt-3 text-[12.5px] font-medium">{name}</p>
                </div>
              ))}
              <div className="text-center">
                <div className="dot-grid size-20 rounded-[12px] border border-line" />
                <p className="mt-3 text-[12.5px] font-medium">Dot grid</p>
              </div>
            </div>
          </div>
        </Block>

        <Block id="buttons" title="Buttons">
          <div className="divide-y divide-line">
            <Row label="Primary">
              <Button>Open checkpoint</Button>
              <Button disabled>Disabled</Button>
            </Row>
            <Row label="Accent">
              <Button variant="accent">
                Submit assessment <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="accent" disabled>
                Disabled
              </Button>
            </Row>
            <Row label="Secondary">
              <Button variant="secondary">
                <Upload className="size-4" aria-hidden="true" /> Upload CSV
              </Button>
              <Button variant="secondary" disabled>
                Disabled
              </Button>
            </Row>
            <Row label="Ghost">
              <Button variant="ghost">Cancel</Button>
              <Button variant="ghost" disabled>
                Disabled
              </Button>
            </Row>
            <Row label="Danger">
              <Button variant="danger">Reject evidence</Button>
              <Button variant="danger" disabled>
                Disabled
              </Button>
            </Row>
            <Row label="Sizes">
              <Button size="sm">Small · 36px</Button>
              <Button size="md">Medium · 46px</Button>
              <Button size="lg">Large · 52px</Button>
            </Row>
            <Row label="As link">
              <Button asChild variant="secondary" size="sm">
                <Link to="/sign-in">Go to sign in</Link>
              </Button>
            </Row>
          </div>
        </Block>

        <Block
          id="badges"
          title="Badges"
          note="Stages are numbers only. Bands reuse the three surface tones; the dot shows confidence."
        >
          <div className="divide-y divide-line">
            <Row label="Tones">
              <Badge>Neutral</Badge>
              <Badge tone="faint">Closed</Badge>
              <Badge tone="dark">Submitted</Badge>
              <Badge tone="accent">Due in 3 days</Badge>
              <Badge tone="ok">Accepted</Badge>
              <Badge tone="warn">Weak</Badge>
              <Badge tone="danger">Rejected</Badge>
            </Row>
            <Row label="Bands">
              <BandBadge band="Explore" />
              <BandBadge band="Validate" />
              <BandBadge band="Scale" />
            </Row>
            <Row label="Stages 1 to 9">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                <StageBadge key={s} stage={s} />
              ))}
            </Row>
            <Row label="With confidence">
              <StageBadge stage={2} confidence="LOW" />
              <StageBadge stage={5} confidence="MEDIUM" />
              <StageBadge stage={8} confidence="HIGH" />
              <StageBadge stage={4} confidence="HIGH" showBand />
              <StageBadge stage={null} />
            </Row>
          </div>
        </Block>

        <Block id="forms" title="Forms">
          <div className="grid max-w-[760px] gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="sg-default">Default</Label>
              <Input id="sg-default" placeholder="Program name" />
              <Hint className="mt-1.5">Hint text sits under the field.</Hint>
            </div>
            <div>
              <Label htmlFor="sg-filled">Filled</Label>
              <Input id="sg-filled" defaultValue="Spring cohort" />
            </div>
            <div>
              <Label htmlFor="sg-invalid">Invalid</Label>
              <Input id="sg-invalid" defaultValue="not-an-email" aria-invalid="true" aria-describedby="sg-invalid-msg" />
              <p id="sg-invalid-msg" className="mt-1.5 text-[12.5px] text-danger">
                Enter a valid email address.
              </p>
            </div>
            <div>
              <Label htmlFor="sg-disabled">Disabled</Label>
              <Input id="sg-disabled" defaultValue="Locked after submit" disabled />
            </div>
            <div>
              <Label htmlFor="sg-select">Select</Label>
              <Select id="sg-select" defaultValue="midline">
                <option value="benchmark">Benchmark</option>
                <option value="midline">Midline</option>
                <option value="endline">Endline</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="sg-small">Small select · 36px</Label>
              <Select id="sg-small" className="field-sm" defaultValue="a">
                <option value="a">Sample program A</option>
                <option value="b">Sample program B</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="sg-textarea">Textarea</Label>
              <Textarea id="sg-textarea" placeholder="Override justification (at least 50 characters)" />
            </div>
          </div>
        </Block>

        <Block id="section-header" title="Section header" note="Uppercase eyebrow above a display headline, with optional lede and actions.">
          <div className="grid gap-10">
            <SectionHeader eyebrow="Cohort" title="Where each startup stands" />
            <SectionHeader
              eyebrow="Evidence"
              title="Claims without proof"
              lede="Every answer that points above Stage 1 needs a file or link a manager can open."
              actions={<Button size="sm">Request evidence</Button>}
            />
            <DarkPanel className="relative overflow-hidden px-6 py-12 lg:px-14">
              <div className="dot-grid-dark pointer-events-none absolute inset-0 opacity-40" />
              <div className="relative">
                <p className="text-[11px] font-semibold tracking-[0.09em] text-on-dark-muted uppercase">On dark</p>
                <h3 className="display-lg mt-4 max-w-[16ch] text-on-dark">Proof first, then the stage</h3>
                <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-on-dark-muted">
                  The dark panel is for one statement per screen, never for routine content.
                </p>
                <Button variant="accent" className="mt-7">
                  Accent on dark
                </Button>
              </div>
            </DarkPanel>
          </div>
        </Block>

        <Block id="stats" title="Stat tile strip" note="One tile at most carries the accent bar. Linked tiles darken their border on hover.">
          <StatStrip
            stats={[
              { label: "Startups", value: 6, hint: "In this program" },
              { label: "Submitted", value: "4 / 6", hint: "Benchmark" },
              { label: "Average stage", value: "3.4", hint: "Explore band" },
              { label: "Evidence gaps", value: 11, hint: "Across 3 dimensions", emphasis: true, href: "/styleguide#stats" },
            ]}
          />
          <div className="mt-3">
            <StatStrip
              stats={[
                { label: "Startups", value: 0, hint: "None added yet" },
                { label: "Submitted", value: "—" },
                { label: "Average stage", value: "—" },
                { label: "Evidence gaps", value: "—" },
              ]}
            />
          </div>
        </Block>

        <Block id="cards" title="Card with status badge and tag row" note="Linked cards lift 4px on hover. Muted is for closed or archived items.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatusCard
              href="/styleguide#cards"
              title="Sample venture one"
              subtitle="Sample program A"
              description="Linked card with every part: two status badges, description, two facts, tags and a call to action."
              statuses={[{ label: "Due in 3 days", tone: "accent" }, { label: "In progress" }]}
              facts={[
                { label: "Lowest dimension", value: "Capital · Stage 2" },
                { label: "Evidence", value: "7 of 12 attached" },
              ]}
              tags={["Agritech", "Benchmark"]}
              cta="Open startup"
            />
            <StatusCard
              href="/styleguide#cards"
              title="Sample venture two"
              subtitle="Sample program A"
              statuses={[{ label: "Submitted", tone: "dark" }]}
              facts={[
                { label: "Lowest dimension", value: "Moat · Stage 1" },
                { label: "Evidence", value: "12 of 12 attached" },
              ]}
              tags={["Medtech", "Benchmark", "Reviewed"]}
              cta="Open startup"
            />
            <StatusCard
              title="Sample venture three"
              subtitle="Sample program B"
              description="Static and muted: no link, no hover."
              statuses={[{ label: "Closed", tone: "faint" }]}
              tags={["Cleantech"]}
              muted
            />
            <Card className="p-5">
              <p className="eyebrow">Plain card</p>
              <p className="mt-2 text-[14px] text-muted">A bare container: white, 1px line, 12px radius.</p>
            </Card>
          </div>
        </Block>

        <Block id="chips" title="Filter chip row" note="Click to toggle. Selected chips turn ink; counts are optional.">
          <div className="divide-y divide-line">
            <Row label="Single select">
              <FilterChips<Checkpoint>
                label="Checkpoint"
                selected={checkpoint}
                onChange={setCheckpoint}
                options={[
                  { value: "benchmark", label: "Benchmark" },
                  { value: "midline", label: "Midline" },
                  { value: "endline", label: "Endline", disabled: true },
                ]}
              />
            </Row>
            <Row label="Multi with counts">
              <FilterChips<BandFilter>
                label="Band"
                multiple
                selected={bands}
                onChange={setBands}
                options={[
                  { value: "explore", label: "Explore", count: 14 },
                  { value: "validate", label: "Validate", count: 9 },
                  { value: "scale", label: "Scale", count: 2 },
                ]}
              />
            </Row>
            <Row label="Static tags">
              <span className="pill">Agritech</span>
              <span className="pill">Deep tech</span>
              <span className="pill">Entered by manager</span>
            </Row>
          </div>
        </Block>

        <Block id="steps" title="Numbered step sequence">
          <div className="grid gap-8">
            <div>
              <p className="eyebrow mb-3">Plain · five steps</p>
              <StepSequence
                steps={[
                  { title: "Answer", body: "Pick the option that describes where you are." },
                  { title: "Attach", body: "Add the file or link that proves it." },
                  { title: "Submit", body: "Submitting locks the checkpoint." },
                  { title: "Review", body: "Your manager checks each piece of evidence." },
                  { title: "Plan", body: "Agree the next 90 days." },
                ]}
              />
            </div>
            <div>
              <p className="eyebrow mb-3">With progress · six steps</p>
              <StepSequence
                columns={6}
                steps={[
                  { title: "Customer", state: "done" },
                  { title: "Product", state: "done" },
                  { title: "Business Model", state: "current" },
                  { title: "Moat", state: "upcoming" },
                  { title: "Team", state: "upcoming" },
                  { title: "Capital", state: "upcoming" },
                ]}
              />
            </div>
          </div>
        </Block>

        <Block id="empty" title="Empty states">
          <div className="grid gap-4 lg:grid-cols-2">
            <EmptyState
              icon={FileSearch}
              title="No gaps to show"
              body="Claims with missing or weak evidence are listed here once founders have submitted."
            />
            <EmptyState
              icon={Plus}
              title="No startups in this program"
              body="Add startups one at a time or by CSV, then invite their founders by email."
              action={
                <>
                  <Button size="sm">Add startup</Button>
                  <Button size="sm" variant="secondary">
                    Upload CSV
                  </Button>
                </>
              }
            />
          </div>
        </Block>

        <footer className="border-t border-line pt-8 text-[12.5px] text-muted">Merstra 2026</footer>
      </main>
    </div>
  );
}
