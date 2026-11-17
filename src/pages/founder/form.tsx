import { ArrowLeft, ArrowRight, Check, ExternalLink, FileText, Link2, Lock, Paperclip, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { DIMENSIONS, type DimensionCode } from "../../../framework/schema";
import { useSession } from "@/auth/session";
import { EmptyState } from "@/components/patterns/empty-state";
import { AppShell, PageBody, PageHeader } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  addFileEvidence,
  addLinkEvidence,
  ACCEPTED_FILE_TYPES,
  CHECKPOINT_LABEL,
  CHECKPOINT_ORDER,
  checkFile,
  evidenceHref,
  loadCheckpointData,
  loadEnrollment,
  loadEnrollmentById,
  removeEvidence,
  saveResponse,
  submitCheckpoint,
  type Checkpoint,
  type CheckpointType,
  type Enrollment,
  type EvidenceRow,
  type ResponseRow,
} from "@/founder/api";
import { cn } from "@/lib/utils";
import type { CarryStatus } from "@/scoring/engine";
import { QUESTIONS, VPAF } from "@/scoring/framework";

type Question = (typeof QUESTIONS.questions)[number];
type SaveState = "idle" | "saving" | "saved" | "error";

const EVIDENCE_LABEL = new Map(VPAF.evidence_types.map((t) => [t.id, t.label]));
const REVIEW_BADGE = {
  pending: { label: "Not reviewed yet", tone: "neutral" },
  accepted: { label: "Accepted", tone: "ok" },
  weak: { label: "Weak", tone: "warn" },
  rejected: { label: "Rejected", tone: "danger" },
} as const;

const blank = (questionId: string): ResponseRow => ({ question_id: questionId, option_id: null, narrative: null, carry_status: null });
const isAnswered = (r: ResponseRow | undefined) => !!r?.option_id;

/** The six-step assessment. A manager can open it for any startup they manage and fill it in on the founder's behalf. */
export default function FounderForm({ asManager = false }: { asManager?: boolean }) {
  const { type, enrollmentId } = useParams();
  const navigate = useNavigate();
  const { user, programId } = useSession();
  const checkpointType = CHECKPOINT_ORDER.find((t) => t === type) as CheckpointType | undefined;

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [responses, setResponses] = useState<Record<string, ResponseRow>>({});
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [previous, setPrevious] = useState<{ responses: Record<string, ResponseRow>; evidence: EvidenceRow[] } | null>(null);
  const [step, setStep] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirming, setConfirming] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const pending = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(0);

  const checkpoint: Checkpoint | undefined = enrollment?.checkpoints.find((c) => c.type === checkpointType);
  const priorCheckpoint = useMemo(() => {
    if (!enrollment || !checkpointType) return undefined;
    const earlier = CHECKPOINT_ORDER.slice(0, CHECKPOINT_ORDER.indexOf(checkpointType)).reverse();
    return earlier.map((t) => enrollment.checkpoints.find((c) => c.type === t)).find((c) => c && c.status !== "not_started" && c.status !== "in_progress");
  }, [enrollment, checkpointType]);
  const needsPrior = checkpointType !== undefined && checkpointType !== "benchmark";
  const blocked = needsPrior && enrollment !== null && !priorCheckpoint;
  const submitted = checkpoint ? checkpoint.status === "submitted" || checkpoint.status === "reviewed" : false;
  // Founders can only write while their manager has the checkpoint open. Managers are not bound by the window.
  const windowOpen = asManager || (checkpointType ? enrollment?.windows[checkpointType]?.is_open === true : false);
  const locked = submitted || !windowOpen;
  const home = asManager ? "/manager/startups" : "/founder";

  useEffect(() => {
    if (!checkpointType || (asManager ? !enrollmentId : !programId)) return;
    let cancelled = false;
    (async () => {
      try {
        const e = asManager ? await loadEnrollmentById(enrollmentId!) : await loadEnrollment(programId!);
        if (cancelled) return;
        const cp = e?.checkpoints.find((c) => c.type === checkpointType);
        if (!e || !cp) return setLoadState("missing");
        const data = await loadCheckpointData(cp.id);
        const earlier = CHECKPOINT_ORDER.slice(0, CHECKPOINT_ORDER.indexOf(checkpointType)).reverse();
        const prior = earlier.map((t) => e.checkpoints.find((c) => c.type === t)).find((c) => c && (c.status === "submitted" || c.status === "reviewed"));
        const priorData = prior ? await loadCheckpointData(prior.id) : null;
        if (cancelled) return;
        const map = Object.fromEntries(data.responses.map((r) => [r.question_id, r]));
        setEnrollment(e);
        setResponses(map);
        setEvidence(data.evidence);
        setPrevious(priorData ? { responses: Object.fromEntries(priorData.responses.map((r) => [r.question_id, r])), evidence: priorData.evidence } : null);
        // Resume at the first dimension that still has an unanswered question.
        const firstOpen = DIMENSIONS.findIndex((d) => QUESTIONS.questions.some((q) => q.dimension === d.code && !isAnswered(map[q.id])));
        setStep(firstOpen === -1 ? 0 : firstOpen);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programId, checkpointType, asManager, enrollmentId]);

  const persist = useCallback(
    async (row: ResponseRow) => {
      if (!checkpoint) return;
      inFlight.current += 1;
      setSaveState("saving");
      try {
        await saveResponse(checkpoint.id, row, asManager);
        inFlight.current -= 1;
        if (inFlight.current === 0 && pending.current.size === 0) setSaveState("saved");
      } catch {
        inFlight.current -= 1;
        setSaveState("error");
      }
    },
    [checkpoint, asManager],
  );

  const latest = useRef(responses);
  latest.current = responses;

  /** Updates an answer locally and saves it: at once for choices, after a pause for typing. */
  const update = useCallback(
    (questionId: string, patch: Partial<ResponseRow>, debounce = false) => {
      const next = { ...(latest.current[questionId] ?? blank(questionId)), ...patch, entered_by_manager: asManager };
      latest.current = { ...latest.current, [questionId]: next };
      setResponses(latest.current);

      const timer = pending.current.get(questionId);
      if (timer) clearTimeout(timer);
      pending.current.delete(questionId);
      if (!debounce) return void persist(next);
      setSaveState("saving");
      pending.current.set(
        questionId,
        setTimeout(() => {
          pending.current.delete(questionId);
          void persist(latest.current[questionId] ?? next);
        }, 700),
      );
    },
    [persist, asManager],
  );

  // Save anything still waiting when the founder leaves the page.
  useEffect(() => {
    const timers = pending.current;
    return () => {
      for (const [questionId, timer] of timers) {
        clearTimeout(timer);
        const row = latest.current[questionId];
        if (row) void persist(row);
      }
      timers.clear();
    };
  }, [persist]);

  const progress = useMemo(
    () =>
      DIMENSIONS.map((d) => {
        const qs = QUESTIONS.questions.filter((q) => q.dimension === d.code);
        const answered = qs.filter((q) => isAnswered(responses[q.id]));
        const missing = answered.filter((q) => {
          const stage = q.options.find((o) => o.id === responses[q.id]?.option_id)?.stage ?? null;
          const has = evidence.some((e) => e.question_id === q.id) || (responses[q.id]?.carry_status !== "lost" && previous?.evidence.some((e) => e.question_id === q.id));
          return stage !== null && stage > 1 && !has;
        });
        return { code: d.code, name: d.name, total: qs.length, answered: answered.length, missing: missing.length };
      }),
    [responses, evidence, previous],
  );

  const listPath = asManager ? "/manager/startups" : "/founder/assessment";
  if (!checkpointType || user?.preview) return <Navigate to={listPath} replace />;

  const title = `${CHECKPOINT_LABEL[checkpointType]} assessment`;
  const shell = (body: React.ReactNode) => (
    <AppShell>
      <PageHeader eyebrow={enrollment?.startupName} title={title} />
      <PageBody>{body}</PageBody>
    </AppShell>
  );

  if (loadState === "loading") return shell(<p className="text-[14px] text-muted" aria-busy="true">Loading your assessment…</p>);
  if (loadState === "error") {
    return shell(<EmptyState title="We could not load your assessment" body="Check your connection and reload the page. Your saved answers are not affected." />);
  }
  if (loadState === "missing" || !checkpoint || !enrollment) {
    return shell(<EmptyState title="No assessment found" body={asManager ? "This startup is not in a program you manage." : "Your startup is not enrolled in this program. Ask your program manager to check your invitation."} />);
  }
  if (blocked) {
    return shell(
      <EmptyState
        icon={Lock}
        title={`${CHECKPOINT_LABEL[checkpointType]} is not open yet`}
        body="It opens once the checkpoint before it has been submitted."
        action={<Button asChild size="sm" variant="secondary"><Link to={listPath}>Back</Link></Button>}
      />,
    );
  }

  const dimension = DIMENSIONS[step]!;
  const questions = QUESTIONS.questions.filter((q) => q.dimension === dimension.code);
  const totals = progress.reduce((t, p) => ({ answered: t.answered + p.answered, total: t.total + p.total, missing: t.missing + p.missing }), { answered: 0, total: 0, missing: 0 });
  const isLast = step === DIMENSIONS.length - 1;

  const onSubmit = async () => {
    setSubmitError(null);
    try {
      // Flush any typing still waiting to be saved before the checkpoint locks.
      for (const [questionId, timer] of pending.current) {
        clearTimeout(timer);
        const row = latest.current[questionId];
        if (row) await saveResponse(checkpoint.id, row, asManager);
      }
      pending.current.clear();
      await submitCheckpoint(checkpoint.id);
      navigate(home, { state: { submitted: checkpointType } });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submitting failed. Try again.");
      setConfirming(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow={enrollment.startupName}
        title={title}
        description={
          submitted
            ? asManager
              ? "This checkpoint has been submitted and is locked. Reopen it from the Startups page to change it."
              : "This checkpoint has been submitted and is locked. Only your program manager can reopen it."
            : !windowOpen
              ? "This checkpoint is not open. Your program manager opens and closes each checkpoint; you can read your answers but not change them."
              : asManager
                ? "You are filling this in on the founder's behalf. Everything you enter is marked as entered by manager."
                : "Pick the option that describes where you are today, and attach the proof. You can leave and come back; everything saves as you go."
        }
        actions={
          locked ? (
            <Badge tone={submitted ? "dark" : "faint"}><Lock className="size-3" aria-hidden="true" /> {submitted ? "Submitted" : "Closed"}</Badge>
          ) : (
            <span role="status" aria-live="polite" className={cn("text-[12.5px]", saveState === "error" ? "text-danger" : "text-muted")}>
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved" : saveState === "error" ? "Could not save. Check your connection." : `${totals.answered} of ${totals.total} answered`}
            </span>
          )
        }
      />

      <PageBody className="mx-auto max-w-[900px]">
        <nav aria-label="Dimensions" className="-mx-5 mb-6 overflow-x-auto px-5 lg:mx-0 lg:px-0">
          <ol className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-6">
            {progress.map((p, i) => {
              const done = p.answered === p.total;
              return (
                <li key={p.code}>
                  <button
                    type="button"
                    onClick={() => { setStep(i); setConfirming(false); window.scrollTo({ top: 0 }); }}
                    aria-current={i === step ? "step" : undefined}
                    className={cn(
                      "w-[132px] cursor-pointer rounded-[12px] border bg-canvas p-3 text-left transition-colors duration-200 lg:w-full",
                      i === step ? "border-ink" : "border-line hover:border-line-strong",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-display text-[12px] font-medium text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      {done ? <Check className="size-3.5 text-ok" aria-label="All answered" /> : null}
                    </span>
                    <span className="mt-1.5 block truncate text-[13.5px] font-medium tracking-[-0.01em]">{p.name}</span>
                    <span className="mt-0.5 block text-[11.5px] text-muted tabular-nums">
                      {p.answered}/{p.total} answered{p.missing ? ` · ${p.missing} need proof` : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mb-5">
          <p className="eyebrow">Step {step + 1} of 6</p>
          <h2 className="display-md mt-2">{dimension.name}</h2>
          <p className="mt-2 max-w-[62ch] text-[14px] text-muted">
            {VPAF.dimensions.find((d) => d.code === dimension.code)?.tracks.replace(/^./, (c) => c.toUpperCase())}
          </p>
        </div>

        <div className="grid gap-4">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              index={i + 1}
              question={q}
              response={responses[q.id]}
              evidence={evidence.filter((e) => e.question_id === q.id)}
              previous={previous ? { response: previous.responses[q.id], evidence: previous.evidence.filter((e) => e.question_id === q.id), label: priorCheckpoint ? CHECKPOINT_LABEL[priorCheckpoint.type] : "previous checkpoint" } : null}
              locked={locked}
              enrollment={enrollment}
              checkpointId={checkpoint.id}
              onChange={update}
              onEvidenceAdded={(item) => setEvidence((all) => [...all, item])}
              onEvidenceRemoved={(id) => setEvidence((all) => all.filter((e) => e.id !== id))}
            />
          ))}
        </div>

        {isLast && !locked ? (
          <section aria-labelledby="review-heading" className="mt-6 rounded-[12px] border border-line bg-canvas p-5">
            <p className="eyebrow">Before you submit</p>
            <h3 id="review-heading" className="mt-2 text-[17px] font-medium tracking-[-0.02em]">
              {totals.answered} of {totals.total} questions answered
              {totals.missing ? `, ${totals.missing} without proof` : ""}
            </h3>
            <ul className="mt-3 grid gap-1.5 text-[13.5px] sm:grid-cols-2">
              {progress.map((p) => (
                <li key={p.code} className="flex justify-between gap-3 border-b border-line py-1.5">
                  <span>{p.name}</span>
                  <span className="text-muted tabular-nums">
                    {p.answered}/{p.total}{p.missing ? ` · ${p.missing} need proof` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <Hint className="mt-3">
              Unanswered questions are recorded as unanswered. An answer without proof counts for less. Submitting locks this
              checkpoint; only your program manager can reopen it.
            </Hint>
            {submitError ? <p role="alert" className="mt-3 text-[13px] text-danger">{submitError}</p> : null}
          </section>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" disabled={step === 0} onClick={() => { setStep(step - 1); setConfirming(false); window.scrollTo({ top: 0 }); }}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Back
          </Button>
          {!isLast ? (
            <Button onClick={() => { setStep(step + 1); window.scrollTo({ top: 0 }); }}>
              Next: {DIMENSIONS[step + 1]!.name} <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : locked ? (
            <Button asChild><Link to={home}>{asManager ? "Back to startups" : submitted ? "View your profile" : "Back to overview"}</Link></Button>
          ) : confirming ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-muted">Submit and lock?</span>
              <Button variant="ghost" onClick={() => setConfirming(false)}>Not yet</Button>
              <Button variant="accent" onClick={() => void onSubmit()}>Yes, submit</Button>
            </span>
          ) : (
            <Button variant="accent" disabled={totals.answered === 0} onClick={() => setConfirming(true)}>
              Submit {CHECKPOINT_LABEL[checkpointType]}
            </Button>
          )}
        </div>
      </PageBody>
    </AppShell>
  );
}

function QuestionCard({
  index,
  question,
  response,
  evidence,
  previous,
  locked,
  enrollment,
  checkpointId,
  onChange,
  onEvidenceAdded,
  onEvidenceRemoved,
}: {
  index: number;
  question: Question;
  response: ResponseRow | undefined;
  evidence: EvidenceRow[];
  previous: { response: ResponseRow | undefined; evidence: EvidenceRow[]; label: string } | null;
  locked: boolean;
  enrollment: Enrollment;
  checkpointId: string;
  onChange: (questionId: string, patch: Partial<ResponseRow>, debounce?: boolean) => void;
  onEvidenceAdded: (item: EvidenceRow) => void;
  onEvidenceRemoved: (id: string) => void;
}) {
  const selected = question.options.find((o) => o.id === response?.option_id);
  const priorOption = question.options.find((o) => o.id === previous?.response?.option_id);
  const carry = response?.carry_status ?? null;
  // At Midline and Endline, a question with an earlier answer must be confirmed before it can be edited.
  const mustConfirm = !!priorOption && !carry && !selected;
  const carriedEvidence = carry === "lost" ? [] : (previous?.evidence ?? []);
  const hasProof = evidence.length + carriedEvidence.length > 0;
  const needsProof = !!selected && selected.stage !== null && selected.stage > 1;
  const name = `q-${question.id}`;

  const setCarry = (status: CarryStatus) => {
    if (status === "still_true") {
      onChange(question.id, { carry_status: status, option_id: previous?.response?.option_id ?? null, narrative: previous?.response?.narrative ?? null });
    } else {
      onChange(question.id, { carry_status: status, option_id: null });
    }
  };

  return (
    <article className="rounded-[12px] border border-line bg-canvas p-4 sm:p-5" aria-labelledby={`${name}-label`}>
      <div className="flex flex-wrap items-start gap-2">
        <p className="mr-auto font-display text-[12px] font-medium text-muted tabular-nums">{String(index).padStart(2, "0")}</p>
        {response?.entered_by_manager ? <Badge>Entered by manager</Badge> : null}
        {needsProof ? (
          hasProof ? (
            <Badge tone="ok"><Paperclip className="size-3" aria-hidden="true" /> Evidence attached</Badge>
          ) : (
            <Badge tone="warn">Evidence missing</Badge>
          )
        ) : null}
      </div>
      <h3 id={`${name}-label`} className="mt-1.5 text-[17px] leading-[1.3] font-medium tracking-[-0.02em]">{question.text}</h3>
      {question.why ? <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{question.why}</p> : null}

      {priorOption ? (
        <div className="mt-4 rounded-[8px] border border-line bg-subtle p-3.5">
          <p className="eyebrow">Your {previous!.label} answer</p>
          <p className="mt-1.5 text-[14px]">{priorOption.label}</p>
          {previous!.evidence.length ? (
            <p className="mt-1 text-[12.5px] text-muted">
              {previous!.evidence.length} piece{previous!.evidence.length > 1 ? "s" : ""} of evidence attached then
              {carry === "lost" ? " (marked as lost)" : ", still counted now"}
            </p>
          ) : null}
          <fieldset className="mt-3" disabled={locked}>
            <legend className="text-[13px] font-medium">Is this still the case?</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {([["still_true", "Still true"], ["changed", "Changed"], ["lost", "Lost"]] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={carry === value}
                  onClick={() => setCarry(value)}
                  className={cn(
                    "pill h-8 cursor-pointer px-3 text-[12.5px] transition-colors duration-[180ms] disabled:cursor-not-allowed disabled:opacity-60",
                    carry === value ? "border-ink bg-ink text-white" : "hover:border-ink hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          {carry === "lost" ? (
            <Hint className="mt-2">Explain below what was lost and when. Your earlier stage is kept unless the loss is explained.</Hint>
          ) : null}
        </div>
      ) : null}

      <fieldset className="mt-4" disabled={locked || mustConfirm}>
        <legend className="sr-only">{question.text}</legend>
        {mustConfirm ? <Hint className="mb-2">Choose above before changing your answer.</Hint> : null}
        <div className="grid gap-2">
          {question.options.map((o) => {
            const on = response?.option_id === o.id;
            return (
              <label
                key={o.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[8px] border px-3.5 py-3 text-[14.5px] leading-snug transition-colors duration-[180ms]",
                  on ? "border-ink bg-subtle" : "border-line hover:border-line-strong",
                  (locked || mustConfirm) && "cursor-not-allowed opacity-70",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  className="mt-[3px] size-4 shrink-0 accent-[#151515]"
                  checked={on}
                  onChange={() => onChange(question.id, { option_id: o.id })}
                />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
        {selected && !locked ? (
          <button
            type="button"
            className="mt-2 cursor-pointer text-[12.5px] text-muted underline-offset-2 hover:text-ink hover:underline"
            onClick={() => onChange(question.id, { option_id: null })}
          >
            Clear answer
          </button>
        ) : null}
      </fieldset>

      <div className="mt-4">
        <Label htmlFor={`${name}-note`}>
          {carry === "lost" ? "What was lost, and when?" : "Add detail"} <span className="font-normal text-muted">{carry === "lost" ? "" : "(optional)"}</span>
        </Label>
        <Textarea
          id={`${name}-note`}
          className="min-h-[76px]"
          placeholder="Names, dates and numbers make an answer easier to verify."
          value={response?.narrative ?? ""}
          disabled={locked || mustConfirm}
          onChange={(e) => onChange(question.id, { narrative: e.target.value }, true)}
        />
      </div>

      <EvidenceSlot
        question={question}
        evidence={evidence}
        carried={carriedEvidence}
        carriedLabel={previous?.label ?? ""}
        locked={locked || mustConfirm}
        enrollment={enrollment}
        checkpointId={checkpointId}
        onAdded={onEvidenceAdded}
        onRemoved={onEvidenceRemoved}
      />
    </article>
  );
}

function EvidenceSlot({
  question,
  evidence,
  carried,
  carriedLabel,
  locked,
  enrollment,
  checkpointId,
  onAdded,
  onRemoved,
}: {
  question: Question;
  evidence: EvidenceRow[];
  carried: EvidenceRow[];
  carriedLabel: string;
  locked: boolean;
  enrollment: Enrollment;
  checkpointId: string;
  onAdded: (item: EvidenceRow) => void;
  onRemoved: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(question.evidence_types[0]!);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = `ev-${question.id}`;
  const target = { checkpointId, questionId: question.id, dimension: question.dimension as DimensionCode, evidenceType: type };

  const run = async (work: () => Promise<EvidenceRow>) => {
    setBusy(true);
    setError(null);
    try {
      onAdded(await work());
      setUrl("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That could not be added. Try again.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const addLink = () => {
    let parsed: URL | null = null;
    try {
      parsed = new URL(url.trim());
    } catch {
      parsed = null;
    }
    if (!parsed || !/^https?:$/.test(parsed.protocol)) return setError("Enter a full link starting with https://");
    void run(() => addLinkEvidence(target, parsed.toString()));
  };

  const addFile = (file: File | undefined) => {
    if (!file) return;
    const problem = checkFile(file);
    if (problem) return setError(problem);
    void run(() => addFileEvidence(target, enrollment, file));
  };

  const openItem = async (item: EvidenceRow) => {
    const href = await evidenceHref(item);
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  };

  const remove = async (item: EvidenceRow) => {
    setError(null);
    try {
      await removeEvidence(item);
      onRemoved(item.id);
    } catch {
      setError("That could not be removed. Try again.");
    }
  };

  const row = (item: EvidenceRow, isCarried: boolean) => (
    <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line py-2 last:border-b-0">
      <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-subtle text-muted">
        {item.kind === "file" ? <FileText className="size-3.5" aria-hidden="true" /> : <Link2 className="size-3.5" aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <button type="button" onClick={() => void openItem(item)} className="inline-flex max-w-full cursor-pointer items-center gap-1 text-left text-[13.5px] font-medium underline-offset-2 hover:underline">
          <span className="truncate">{item.kind === "file" ? item.file_name : item.url}</span>
          <ExternalLink className="size-3 shrink-0 text-faint" aria-hidden="true" />
        </button>
        <span className="block text-[12px] text-muted">
          {EVIDENCE_LABEL.get(item.evidence_type) ?? item.evidence_type}
          {isCarried ? ` · from ${carriedLabel}` : ""}
          {item.review_note ? ` · “${item.review_note}”` : ""}
        </span>
      </span>
      <Badge tone={REVIEW_BADGE[item.review_status].tone}>{REVIEW_BADGE[item.review_status].label}</Badge>
      {!locked && !isCarried ? (
        <button type="button" onClick={() => void remove(item)} aria-label={`Remove ${item.file_name ?? item.url}`} className="grid size-7 cursor-pointer place-items-center rounded-[6px] text-muted hover:bg-subtle hover:text-danger">
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-medium">Evidence</p>
        {!locked && !open ? (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Paperclip className="size-3.5" aria-hidden="true" /> Add evidence
          </Button>
        ) : null}
      </div>

      {evidence.length + carried.length > 0 ? (
        <ul className="mt-2">
          {carried.map((e) => row(e, true))}
          {evidence.map((e) => row(e, false))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[12.5px] text-muted">
          Nothing attached. Proof that would count: {question.evidence_types.map((t) => EVIDENCE_LABEL.get(t) ?? t).join(", ")}.
        </p>
      )}

      {open ? (
        <div className="mt-3 grid gap-3 rounded-[8px] border border-line bg-subtle p-3.5">
          <div>
            <Label htmlFor={`${id}-type`}>What is it?</Label>
            <Select id={`${id}-type`} className="field-sm bg-white" value={type} onChange={(e) => setType(e.target.value)}>
              {question.evidence_types.map((t) => (
                <option key={t} value={t}>{EVIDENCE_LABEL.get(t) ?? t}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor={`${id}-url`}>Paste a link</Label>
            <div className="flex flex-wrap gap-2">
              <Input id={`${id}-url`} type="url" inputMode="url" className="field-sm min-w-0 flex-1" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
              <Button size="sm" disabled={busy || !url.trim()} onClick={addLink}>Add link</Button>
            </div>
            <Hint className="mt-1.5">Make sure your program manager can open it.</Hint>
          </div>
          <div>
            <Label htmlFor={`${id}-file`}>Or upload a file</Label>
            <input
              id={`${id}-file`}
              ref={fileInput}
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(",")}
              disabled={busy}
              onChange={(e) => addFile(e.target.files?.[0])}
              className="block w-full text-[13px] text-muted file:mr-3 file:h-9 file:cursor-pointer file:rounded-[6px] file:border file:border-solid file:border-line file:bg-white file:px-3 file:text-[13px] file:font-medium file:text-ink"
            />
            <Hint className="mt-1.5">PDF, image, Word, Excel, PowerPoint, CSV or text. Up to 10 MB.</Hint>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span role="status" className="text-[12.5px] text-muted">{busy ? "Adding…" : ""}</span>
            <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setError(null); }}>Close</Button>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-2 text-[12.5px] text-danger">{error}</p> : null}
    </div>
  );
}
