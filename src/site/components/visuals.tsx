import { DIMENSIONS } from "../../../framework/schema";
import { StageBadge, type Confidence } from "@/components/patterns/stage-badge";
import { cn } from "@/lib/utils";

/**
 * Illustrations of the product. All figures are invented sample data and are labelled as such
 * on screen; they are not results from any real cohort.
 */

type Row = { name: string; sector: string; stages: [number, Confidence][] };

const SAMPLE_COHORT: Row[] = [
  { name: "Startup A", sector: "Agritech", stages: [[4, "HIGH"], [5, "HIGH"], [3, "MEDIUM"], [2, "LOW"], [3, "HIGH"], [2, "MEDIUM"]] },
  { name: "Startup B", sector: "Health", stages: [[2, "MEDIUM"], [4, "HIGH"], [2, "LOW"], [4, "HIGH"], [3, "MEDIUM"], [3, "HIGH"]] },
  { name: "Startup C", sector: "Climate", stages: [[5, "HIGH"], [6, "HIGH"], [4, "MEDIUM"], [3, "MEDIUM"], [4, "HIGH"], [4, "MEDIUM"]] },
  { name: "Startup D", sector: "Fintech", stages: [[3, "LOW"], [3, "MEDIUM"], [3, "MEDIUM"], [1, "HIGH"], [2, "MEDIUM"], [2, "LOW"]] },
  { name: "Startup E", sector: "Edtech", stages: [[7, "HIGH"], [5, "HIGH"], [5, "HIGH"], [2, "MEDIUM"], [4, "HIGH"], [5, "MEDIUM"]] },
];

function SampleTag({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10.5px] font-medium tracking-[0.04em] uppercase",
        dark ? "border-white/15 text-on-dark-faint" : "border-line text-faint",
      )}
    >
      Sample data
    </span>
  );
}

/** Window chrome used to frame product previews. */
export function ProductFrame({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <figure className={cn("overflow-hidden rounded-[16px] border border-line bg-canvas shadow-[var(--shadow-showcase)]", className)}>
      <figcaption className="flex items-center justify-between gap-3 border-b border-line bg-subtle px-4 py-2.5">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="truncate text-[12px] text-muted">{title}</span>
        <SampleTag />
      </figcaption>
      {children}
    </figure>
  );
}

/** Cohort grid: every startup, every dimension, one stage each, with a confidence dot. */
export function CohortGridPreview({ compact = false }: { compact?: boolean }) {
  return (
    <ProductFrame title="Cohort grid · Benchmark">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-[12.5px]">
          <caption className="sr-only">Sample cohort grid showing stage by dimension for five startups</caption>
          <thead>
            <tr className="border-b border-line text-[10.5px] tracking-[0.06em] text-faint uppercase">
              <th scope="col" className="px-4 py-3 font-medium">Startup</th>
              {DIMENSIONS.map((d) => (
                <th key={d.code} scope="col" className="px-2 py-3 font-medium">
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(compact ? SAMPLE_COHORT.slice(0, 4) : SAMPLE_COHORT).map((row) => (
              <tr key={row.name} className="border-b border-line last:border-0">
                <th scope="row" className="px-4 py-3 font-normal">
                  <span className="block font-medium whitespace-nowrap text-ink">{row.name}</span>
                  <span className="text-[11.5px] text-muted">{row.sector}</span>
                </th>
                {row.stages.map(([stage, conf], i) => (
                  <td key={i} className="px-2 py-3">
                    <StageBadge stage={stage} confidence={conf} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-3 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-ok" />High confidence</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-warn" />Medium</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-danger" />Low</span>
      </div>
    </ProductFrame>
  );
}

/** Hexagonal six-dimension profile chart, Benchmark against Endline. */
export function ProfileChart({
  benchmark,
  endline,
  size = 300,
  className,
}: {
  benchmark: number[];
  endline?: number[];
  size?: number;
  className?: string;
}) {
  const c = size / 2;
  const r = size / 2 - 44;
  const point = (i: number, stage: number) => {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const d = (stage / 9) * r;
    return [c + d * Math.cos(a), c + d * Math.sin(a)] as const;
  };
  const poly = (vals: number[]) => vals.map((v, i) => point(i, v).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={cn("h-auto w-full", className)} role="img" aria-label="Six-dimension profile chart, sample data">
      {[3, 6, 9].map((ring) => (
        <polygon
          key={ring}
          points={poly(Array(6).fill(ring))}
          fill={ring === 9 ? "var(--color-subtle)" : "none"}
          stroke="var(--color-line-strong)"
          strokeWidth="1"
        />
      ))}
      {DIMENSIONS.map((_, i) => {
        const [x, y] = point(i, 9);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--color-line)" strokeWidth="1" />;
      })}
      <polygon points={poly(benchmark)} fill="none" stroke="var(--color-muted)" strokeWidth="1.5" strokeDasharray="4 3" />
      {endline ? (
        <polygon points={poly(endline)} fill="rgba(185,255,90,0.45)" stroke="var(--color-ink)" strokeWidth="1.75" strokeLinejoin="round" />
      ) : null}
      {(endline ?? benchmark).map((v, i) => {
        const [x, y] = point(i, v);
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--color-ink)" />;
      })}
      {DIMENSIONS.map((d, i) => {
        const [x, y] = point(i, 11.6);
        return (
          <text key={d.code} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="var(--color-muted)" fontFamily="var(--font-sans)">
            {d.name}
          </text>
        );
      })}
    </svg>
  );
}

const SAMPLE_BENCH = [2, 3, 2, 1, 2, 2];
const SAMPLE_END = [4, 4, 3, 2, 3, 3];

/** A page from a sample Venture Progression Profile. */
export function ProfilePreview() {
  return (
    <figure className="relative mx-auto w-full max-w-[460px]">
      <div aria-hidden="true" className="absolute inset-x-6 -top-3 h-full rounded-[14px] border border-line bg-canvas" />
      <div aria-hidden="true" className="absolute inset-x-3 -top-1.5 h-full rounded-[14px] border border-line bg-canvas" />
      <div className="relative rounded-[14px] border border-line bg-canvas p-6 shadow-[var(--shadow-lifted)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.09em] text-muted uppercase">Venture Progression Profile</p>
            <p className="mt-1.5 font-display text-[19px] font-medium tracking-[-0.02em]">Startup A</p>
            <p className="text-[12px] text-muted">Sample program · Endline</p>
          </div>
          <SampleTag />
        </div>
        <div className="mx-auto mt-2 max-w-[300px]">
          <ProfileChart benchmark={SAMPLE_BENCH} endline={SAMPLE_END} />
        </div>
        <div className="flex justify-center gap-5 text-[11.5px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="var(--color-muted)" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
            Benchmark
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-[2px] border border-ink bg-accent/60" aria-hidden="true" />
            Endline
          </span>
        </div>
        <div className="mt-5 rounded-[10px] border border-line p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium">Customer</p>
            <span className="flex items-center gap-1.5 text-[12px] text-muted">
              <StageBadge stage={2} /> → <StageBadge stage={4} confidence="HIGH" />
            </span>
          </div>
          <dl className="mt-3 grid gap-2 text-[12px] leading-snug">
            <div className="grid grid-cols-[88px_1fr] gap-2">
              <dt className="text-faint">Evidence used</dt>
              <dd>Two signed letters of intent</dd>
            </div>
            <div className="grid grid-cols-[88px_1fr] gap-2">
              <dt className="text-faint">Missing</dt>
              <dd>A paid order or invoice</dd>
            </div>
            <div className="grid grid-cols-[88px_1fr] gap-2">
              <dt className="text-faint">Next action</dt>
              <dd>Convert one letter of intent into a paid pilot</dd>
            </div>
          </dl>
        </div>
      </div>
    </figure>
  );
}

/** Evidence-gap list with confidence and a request action. */
export function EvidenceGapPreview() {
  const gaps = [
    { startup: "Startup B", dim: "Customer", claim: "Paying customers in two districts", status: "No proof" },
    { startup: "Startup D", dim: "Capital", claim: "Twelve months of runway", status: "Weak proof" },
    { startup: "Startup A", dim: "Moat", claim: "Design registration filed", status: "No proof" },
  ];
  return (
    <ProductFrame title="Evidence gaps · 3 open">
      <ul className="divide-y divide-line">
        {gaps.map((g) => (
          <li key={g.claim} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{g.claim}</p>
              <p className="text-[11.5px] text-muted">
                {g.startup} · {g.dim} ·{" "}
                <span className={g.status === "No proof" ? "text-danger" : "text-warn"}>{g.status}</span>
              </p>
            </div>
            <span className="shrink-0 rounded-[6px] border border-line px-2.5 py-1 text-[11.5px] font-medium">Request evidence</span>
          </li>
        ))}
      </ul>
    </ProductFrame>
  );
}

/** A single assessment question as a founder sees it. */
export function QuestionPreview() {
  const options = [
    "We believe there is demand but have not spoken to buyers.",
    "Buyers have described the problem to us in their own words.",
    "At least one buyer has signed a letter of intent.",
    "At least one buyer has paid for an order or pilot.",
  ];
  return (
    <ProductFrame title="Benchmark · Customer · 3 of 9">
      <div className="p-5">
        <div className="h-1 overflow-hidden rounded-full bg-subtle">
          <div className="h-full w-1/3 rounded-full bg-ink" />
        </div>
        <p className="mt-5 text-[15px] font-medium tracking-[-0.01em]">Which of these best describes where you are with buyers today?</p>
        <ul className="mt-4 grid gap-2">
          {options.map((o, i) => (
            <li
              key={o}
              className={cn(
                "flex items-start gap-3 rounded-[8px] border px-3 py-2.5 text-[13px]",
                i === 2 ? "border-ink bg-subtle" : "border-line",
              )}
            >
              <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border", i === 2 ? "border-ink" : "border-line-strong")}>
                {i === 2 ? <span className="size-2 rounded-full bg-ink" /> : null}
              </span>
              {o}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[8px] border border-dashed border-line-strong px-3 py-2.5 text-[12.5px]">
          <span className="text-muted">Evidence: letter-of-intent.pdf</span>
          <span className="text-ok">Uploaded</span>
        </div>
        <p className="mt-3 text-[11.5px] text-faint">Saved automatically</p>
      </div>
    </ProductFrame>
  );
}
