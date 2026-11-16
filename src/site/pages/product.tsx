import { ArrowRight, Check, CircleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckList, Eyebrow, PageHero, Pending, Section, usePageMeta } from "@/site/components/primitives";
import { CohortGridPreview, ProfilePreview, QuestionPreview } from "@/site/components/visuals";

function Block({
  id,
  index,
  title,
  children,
  visual,
  reverse = false,
  tone,
}: {
  id: string;
  index: number;
  title: string;
  children: ReactNode;
  visual?: ReactNode;
  reverse?: boolean;
  tone?: "subtle";
}) {
  return (
    <Section id={id} tone={tone}>
      <div className={cn("grid items-center gap-12 lg:gap-16", visual && "lg:grid-cols-2")}>
        <div className={cn("min-w-0", reverse && visual && "lg:order-2")}>
          <Eyebrow>{String(index).padStart(2, "0")}</Eyebrow>
          <h2 className="display-md mt-2.5 max-w-[20ch]">{title}</h2>
          <div className="mt-7">{children}</div>
        </div>
        {visual ? <div className={cn("min-w-0", reverse && "lg:order-1")}>{visual}</div> : null}
      </div>
    </Section>
  );
}

const REVIEW = [
  { icon: Check, label: "Accepted", tone: "text-ok border-ok/30 bg-ok/5" },
  { icon: CircleAlert, label: "Weak", tone: "text-warn border-warn/40 bg-warn/5" },
  { icon: X, label: "Rejected", tone: "text-danger border-danger/30 bg-danger/5" },
];

const ROLES = [
  { role: "Founder", can: "Complete assessments, upload evidence, see their own profile and plan" },
  { role: "Program manager", can: "Review evidence, override scores, see their programs, generate profiles" },
  { role: "Organisation admin", can: "Create programs, assign managers, see all programs in the organisation" },
];

export default function Product() {
  usePageMeta(
    "How PAVE works — assessment, evidence, dashboard, report",
    "Founders complete a structured assessment with evidence. Managers review it on a cohort dashboard and generate a Venture Progression Profile for each startup.",
  );

  return (
    <>
      <PageHero
        eyebrow="Product"
        title="Assessment, evidence and reporting in one place."
        lede="PAVE replaces the forms, spreadsheets and scattered notes a program uses to track its startups."
        actions={
          <Button asChild size="lg">
            <Link to="/demo">
              Book a demo <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        <nav aria-label="On this page" className="mt-12 flex flex-wrap gap-2">
          {[
            ["founder-assessment", "Founder assessment"],
            ["scoring", "Scoring"],
            ["dashboard", "Dashboard"],
            ["evidence-review", "Evidence review"],
            ["plan", "90-day plan"],
            ["profile", "Profile"],
            ["roles", "Roles and access"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="pill h-8 px-3 text-[12.5px] transition-colors hover:border-ink hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
      </PageHero>

      <Block id="founder-assessment" index={1} title="A form founders can finish." visual={<QuestionPreview />}>
        <CheckList
          items={[
            "Six sections, one per dimension.",
            "Answer choices describe a situation in plain words. No self-scoring.",
            "Every question has a slot for a file or a link.",
            "Progress saves automatically. Founders can leave and return.",
            "At Midline and Endline, founders see their earlier answers and mark each one as still true, changed or lost.",
            "After submitting, founders see their own profile and what evidence would move each dimension up a stage.",
          ]}
        />
      </Block>

      <Block id="scoring" index={2} title="Scores you can explain to a funder." tone="subtle">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "The highest stage with proof is awarded.",
            "Weak proof scores one stage lower.",
            "Where two stages are arguable, the lower one is taken.",
            "Contradictory answers are not counted.",
            "Every score comes with a short reason, the evidence used and the evidence missing.",
            "Managers can override any score with a written justification. Both scores stay on record.",
          ].map((rule, i) => (
            <div key={rule} className="rounded-[12px] border border-line bg-canvas p-5">
              <span className="font-display text-[13px] text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-3 text-[15px] leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block id="dashboard" index={3} title="The whole cohort on one screen." visual={<CohortGridPreview compact />} reverse>
        <CheckList
          items={[
            "Cohort grid of startups by dimension.",
            "Filters by program, checkpoint and sector.",
            "Evidence-gap view with a request-evidence action.",
            "Startup detail page: stage history, evidence previews, comments.",
            "Change table from Benchmark to Endline, with each startup's weakest dimension.",
            "Export to CSV.",
          ]}
        />
      </Block>

      <Block
        id="evidence-review"
        index={4}
        title="Proof is checked, not just collected."
        tone="subtle"
        visual={
          <div className="grid gap-3 sm:grid-cols-3">
            {REVIEW.map(({ icon: Icon, label, tone }) => (
              <div key={label} className="rounded-[12px] border border-line bg-canvas p-5">
                <span className={cn("inline-grid size-9 place-items-center rounded-full border", tone)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <p className="mt-4 text-[15px] font-medium">{label}</p>
                <p className="mt-1 text-[13px] text-muted">With a note to the founder</p>
              </div>
            ))}
          </div>
        }
      >
        <p className="lede">
          Managers mark each item accepted, weak or rejected, with a note. Founders see the decision and can resubmit.
        </p>
      </Block>

      <Block
        id="plan"
        index={5}
        title="Every assessment ends in a plan."
        visual={
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium">90-day plan · weighted to Capital</p>
              <span className="rounded-full border border-line px-2 py-0.5 text-[10.5px] tracking-[0.04em] text-faint uppercase">Sample data</span>
            </div>
            <ol className="mt-4 grid gap-2">
              {[
                ["Build a 12-month runway sheet", "Founder", "Runway sheet"],
                ["Put an amount against each milestone", "Founder", "Milestone budget"],
                ["Hold three funder conversations", "Founder + manager", "Funder correspondence"],
              ].map(([action, owner, proof]) => (
                <li key={action} className="rounded-[8px] border border-line px-4 py-3">
                  <p className="text-[14px] font-medium">{action}</p>
                  <p className="mt-1 text-[12px] text-muted">
                    Owner: {owner} · Proof: {proof}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        }
        reverse
      >
        <p className="lede">
          After each checkpoint, PAVE drafts a short plan for each startup, weighted to its weakest dimension. Each action names
          an owner and the proof that will show it is done. Completed actions become evidence at the next checkpoint.
        </p>
      </Block>

      <Block id="profile" index={6} title="One report per startup, one summary per cohort." tone="subtle" visual={<ProfilePreview />}>
        <p className="text-[13px] font-medium">What's inside</p>
        <CheckList
          className="mt-4"
          items={[
            "Cover with startup, program, checkpoint and date.",
            "Six-dimension profile chart.",
            "For each dimension: stage, reasoning, evidence relied on, evidence missing, suggested next actions.",
            "Change from Benchmark to Endline once both exist.",
          ]}
        />
        <p className="mt-6 text-[14.5px] text-muted">Generate one at a time or for the whole cohort.</p>
      </Block>

      <Block id="roles" index={7} title="Roles and access.">
        <div className="overflow-hidden rounded-[12px] border border-line">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-subtle text-[11px] tracking-[0.07em] text-faint uppercase">
                <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                <th scope="col" className="px-5 py-3 font-semibold">What they can do</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role} className="border-b border-line last:border-0">
                  <th scope="row" className="px-5 py-4 align-top text-[14.5px] font-medium whitespace-nowrap">{r.role}</th>
                  <td className="px-5 py-4 text-[14.5px] leading-relaxed text-muted">{r.can}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pending note="Security wording with the developer once the build passes its access tests" block>
          <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-muted">
            Each organisation's data is kept separate. Founders see only their own startup.
          </p>
        </Pending>
      </Block>
    </>
  );
}
