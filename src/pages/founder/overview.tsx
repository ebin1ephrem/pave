import { LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DIMENSIONS } from "../../../framework/schema";
import { EmptyState } from "@/components/patterns/empty-state";
import { SectionHeader } from "@/components/patterns/section-header";
import { bandOf, StageBadge } from "@/components/patterns/stage-badge";
import { StatStrip } from "@/components/patterns/stat-tile";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHECKPOINT_LABEL, loadCheckpointData, scoreChain, type Checkpoint, type CheckpointData } from "@/founder/api";
import { cn } from "@/lib/utils";
import { bottleneck, type DimensionScore } from "@/scoring/engine";
import { useEnrollment } from "./assessment";

const DIMENSION_NAME = new Map(DIMENSIONS.map((d) => [d.code, d.name]));
const CONFIDENCE_TEXT = { HIGH: "High confidence", MEDIUM: "Medium confidence", LOW: "Low confidence" } as const;
const BAND_BAR = { Explore: "bg-faint", Validate: "bg-ink", Scale: "bg-accent" } as const;

export default function FounderOverview() {
  const { status, enrollment } = useEnrollment();
  const location = useLocation();
  const justSubmitted = (location.state as { submitted?: string } | null)?.submitted;
  const [profile, setProfile] = useState<{ checkpoint: Checkpoint; scores: DimensionScore[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (status !== "ready") return;
    const submitted = (enrollment?.checkpoints ?? []).filter((c) => c.status === "submitted" || c.status === "reviewed");
    if (submitted.length === 0) {
      setProfile(null);
      return setLoading(false);
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(submitted.map((c) => loadCheckpointData(c.id)))
      .then((chain: CheckpointData[]) => {
        if (cancelled) return;
        setProfile({ checkpoint: submitted[submitted.length - 1]!, scores: scoreChain(chain) });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, enrollment]);

  const open = enrollment?.checkpoints.find((c) => c.status === "in_progress") ?? enrollment?.checkpoints.find((c) => c.status === "not_started");
  const lowest = profile ? bottleneck(profile.scores) : null;
  const average = profile ? profile.scores.reduce((t, s) => t + s.stage, 0) / profile.scores.length : 0;
  const missingCount = profile ? profile.scores.filter((s) => s.nextStage && s.nextStage.needs.length > 0).length : 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow={enrollment?.startupName}
        title="Overview"
        description={profile ? `Your profile at ${CHECKPOINT_LABEL[profile.checkpoint.type]}, scored from your answers and the evidence attached.` : undefined}
        actions={
          open && enrollment ? (
            <Button asChild size="sm" variant={open.status === "in_progress" ? "accent" : "primary"}>
              <Link to={`/founder/assessment/${open.type}`}>
                {open.status === "in_progress" ? "Continue" : "Start"} {CHECKPOINT_LABEL[open.type]}
              </Link>
            </Button>
          ) : null
        }
      />
      <PageBody>
        {justSubmitted ? (
          <p role="status" className="mb-5 rounded-[8px] border border-ok/30 bg-ok/5 px-4 py-3 text-[13.5px] text-ok">
            Submitted. Your answers are locked and your program manager has them.
          </p>
        ) : null}

        {status === "loading" || loading ? (
          <p className="text-[14px] text-muted" aria-busy="true">Loading…</p>
        ) : status === "error" || failed ? (
          <EmptyState title="We could not load your profile" body="Check your connection and reload the page." />
        ) : !profile ? (
          <EmptyState
            icon={LayoutDashboard}
            title="No profile yet"
            body="Your six-dimension profile appears here once you submit your first checkpoint."
            action={
              open ? (
                <Button asChild size="sm">
                  <Link to={`/founder/assessment/${open.type}`}>{open.status === "in_progress" ? "Continue" : "Start"} {CHECKPOINT_LABEL[open.type]}</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <StatStrip
              stats={[
                { label: "Checkpoint", value: CHECKPOINT_LABEL[profile.checkpoint.type], hint: profile.checkpoint.status === "reviewed" ? "Reviewed by your manager" : "Awaiting manager review" },
                { label: "Average stage", value: average.toFixed(1), hint: `${bandOf(Math.round(average))} band` },
                { label: "Holding you back", value: lowest ? DIMENSION_NAME.get(lowest.dimension)! : "—", hint: lowest ? `Stage ${lowest.stage}` : undefined, emphasis: true },
                { label: "Dimensions needing proof", value: missingCount, hint: "To reach the next stage" },
              ]}
            />

            <SectionHeader className="mt-10" eyebrow="Your profile" title="Six dimensions" />
            <p className="mt-3 max-w-[70ch] text-[13.5px] text-muted">
              These are system scores from your submission. Your program manager reviews the evidence and may adjust a stage,
              with a written reason.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {profile.scores.map((s) => (
                <article key={s.dimension} className={cn("rounded-[12px] border bg-canvas p-5", s === lowest ? "border-ink" : "border-line")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[17px] font-medium tracking-[-0.02em]">{DIMENSION_NAME.get(s.dimension)}</h3>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {s === lowest ? <Badge tone="accent">Bottleneck</Badge> : null}
                      <StageBadge stage={s.stage} confidence={s.confidence} showBand />
                    </span>
                  </div>

                  <div className="mt-3 flex gap-1" role="img" aria-label={`Stage ${s.stage} of 9`}>
                    {Array.from({ length: 9 }, (_, i) => (
                      <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < s.stage ? BAND_BAR[bandOf(s.stage)] : "bg-line")} />
                    ))}
                  </div>

                  <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                    <span className="text-ink">{CONFIDENCE_TEXT[s.confidence]}.</span> {s.rationale}
                  </p>
                  {s.contradictions.map((c) => (
                    <p key={c} className="mt-2 text-[13px] text-warn">{c}</p>
                  ))}

                  {s.nextStage ? (
                    <div className="mt-4 border-t border-line pt-3.5">
                      <p className="eyebrow">To reach Stage {s.nextStage.stage}</p>
                      {s.nextStage.needs.length > 0 ? (
                        <ul className="mt-2 grid gap-1 text-[13.5px]">
                          {s.nextStage.needs.map((n) => (
                            <li key={n} className="flex gap-2">
                              <span className="mt-[9px] size-1 shrink-0 rounded-full bg-ink" />
                              Attach: {n}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[13.5px] text-muted">
                          The proof is already attached. Update your answers at the next checkpoint to claim it.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 border-t border-line pt-3.5 text-[13.5px] text-muted">This is the highest stage.</p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </PageBody>
    </AppShell>
  );
}
