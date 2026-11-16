import { DIMENSIONS, type DimensionCode, type QuestionBank, type Vpaf } from "../../framework/schema";
import { CONTRADICTIONS, type ContradictionRule } from "./contradictions";

/**
 * VPAF scoring. Pure functions: the same inputs always give the same scores, with no I/O.
 * The rules implemented here are numbered as in docs/scoring.md.
 */

export type ReviewStatus = "pending" | "accepted" | "weak" | "rejected";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type CarryStatus = "still_true" | "changed" | "lost";
export type DeclineReason = "loss" | "pivot" | "over_scored";

export interface AnswerInput {
  questionId: string;
  /** null = unanswered. Never defaulted. */
  optionId: string | null;
  narrative?: string | null;
  /** Midline and Endline only: what the founder said about their previous answer. */
  carry?: CarryStatus | null;
}

export interface EvidenceInput {
  id: string;
  dimension: DimensionCode;
  evidenceType: string;
  questionId?: string | null;
  review: ReviewStatus;
  label?: string;
  /** True when the item comes from an earlier checkpoint. */
  carried?: boolean;
}

export interface AnchorInput {
  stage: number;
  evidence: EvidenceInput[];
}

export interface DeclineInput {
  reason: DeclineReason;
  note: string;
}

export interface Submission {
  answers: AnswerInput[];
  evidence: EvidenceInput[];
  /** The previous checkpoint's stage and proof, per dimension. Absent at Benchmark. */
  anchors?: Partial<Record<DimensionCode, AnchorInput>>;
  /** Explicit statements of loss, pivot or earlier over-scoring, per dimension. */
  declines?: Partial<Record<DimensionCode, DeclineInput>>;
}

export interface EvidenceRef {
  id: string;
  evidenceType: string;
  label: string;
  review: ReviewStatus;
  carried: boolean;
}

export interface DimensionScore {
  dimension: DimensionCode;
  /** The awarded stage, after anchor and ratchet rules. */
  stage: number;
  /** What this checkpoint's answers and proof support on their own. */
  computedStage: number;
  confidence: Confidence;
  rationale: string;
  evidenceUsed: EvidenceRef[];
  /** Proof still needed for the stages claimed or next in line, as readable labels. */
  evidenceMissing: string[];
  anchorStage: number | null;
  /** Why the awarded stage differs from the computed one, if it does. */
  held: null | "anchor" | "silence" | "low_confidence";
  contradictions: string[];
  nextStage: { stage: number; needs: string[] } | null;
}

const PLACEHOLDERS = new Set([
  "na", "n/a", "n.a.", "nil", "none", "no", "tbd", "tbc", "todo", "test", "testing", "asdf", "abc", "xyz", "xxx",
  "-", "--", "...", ".", "?", "nothing", "not applicable", "same as above", "as above", "placeholder",
]);

/** Unfilled, placeholder or template text counts as no answer. */
export function isPlaceholder(text: string | null | undefined): boolean {
  const t = (text ?? "").trim().toLowerCase();
  if (t.length < 3) return true;
  if (PLACEHOLDERS.has(t)) return true;
  if (t.startsWith("lorem ipsum")) return true;
  if (/^(.)\1+$/.test(t)) return true; // one character repeated
  if (/^[\[<{(].*[\]>})]$/.test(t)) return true; // "[your answer here]"
  return false;
}

type Strength = "strong" | "pending" | "weak";

interface StageCheck {
  met: boolean;
  strength: Strength;
  used: EvidenceInput[];
  /** One readable label per unmet group, e.g. "Invoice or Pilot agreement". */
  missing: string[];
}

function checkStage(
  vpaf: Vpaf,
  labels: Map<string, string>,
  dimension: DimensionCode,
  stage: number,
  pool: EvidenceInput[],
): StageCheck {
  const cell = vpaf.dimensions.find((d) => d.code === dimension)?.stages.find((s) => s.stage === stage);
  if (!cell) return { met: false, strength: "pending", used: [], missing: [] };

  const used: EvidenceInput[] = [];
  const missing: string[] = [];
  let strength: Strength = "strong";

  for (const group of cell.evidence_groups) {
    const items = pool.filter((e) => group.includes(e.evidenceType));
    if (items.length === 0) {
      missing.push(group.map((id) => labels.get(id) ?? id).join(" or "));
      continue;
    }
    used.push(...items);
    if (items.some((e) => e.review === "accepted")) continue;
    // No accepted item in this group: the whole stage is at most as strong as this group.
    const groupStrength: Strength = items.every((e) => e.review === "weak") ? "weak" : "pending";
    if (groupStrength === "weak" || strength === "strong") strength = groupStrength;
  }
  return { met: missing.length === 0, strength, used, missing };
}

function describe(items: EvidenceInput[], labels: Map<string, string>): string {
  const names = [...new Set(items.map((e) => labels.get(e.evidenceType) ?? e.evidenceType))];
  return names.join(", ");
}

const DECLINE_WORD: Record<DeclineReason, string> = {
  loss: "a reported loss",
  pivot: "a reported pivot",
  over_scored: "disclosed earlier over-scoring",
};

function scoreDimension(
  vpaf: Vpaf,
  questions: QuestionBank,
  rules: ContradictionRule[],
  labels: Map<string, string>,
  dimension: DimensionCode,
  submission: Submission,
): DimensionScore {
  const own = questions.questions.filter((q) => q.dimension === dimension);
  const byId = new Map(submission.answers.map((a) => [a.questionId, a]));
  const anchor = submission.anchors?.[dimension] ?? null;
  const optionOf = (questionId: string) => {
    const a = byId.get(questionId);
    return a?.optionId ?? null;
  };

  // Rule 4: answers that contradict each other are both set aside.
  const contradicted = new Set<string>();
  const contradictions: string[] = [];
  for (const rule of rules) {
    const a = optionOf(rule.a.question);
    const b = optionOf(rule.b.question);
    if (a && b && rule.a.options.includes(a) && rule.b.options.includes(b)) {
      const touches = own.some((q) => q.id === rule.a.question || q.id === rule.b.question);
      if (touches) {
        contradictions.push(rule.message);
        contradicted.add(rule.a.question);
        contradicted.add(rule.b.question);
      }
    }
  }

  // Answers that exist for this dimension, and the stage each one claims.
  const answered = own.filter((q) => {
    const id = optionOf(q.id);
    return id !== null && q.options.some((o) => o.id === id);
  });
  const claims = answered
    .filter((q) => !contradicted.has(q.id))
    .map((q) => ({
      question: q.id,
      stage: q.options.find((o) => o.id === optionOf(q.id))?.stage ?? null,
      narrated: !isPlaceholder(byId.get(q.id)?.narrative),
    }))
    .filter((c): c is { question: string; stage: number; narrated: boolean } => c.stage !== null);

  // Proof available: this checkpoint's, plus earlier proof that still stands (rule 7).
  const lostQuestions = new Set(submission.answers.filter((a) => a.carry === "lost").map((a) => a.questionId));
  const carried = (anchor?.evidence ?? [])
    .filter((e) => !(e.questionId && lostQuestions.has(e.questionId)))
    .map((e) => ({ ...e, carried: true }));
  const pool = [...submission.evidence, ...carried].filter((e) => e.dimension === dimension && e.review !== "rejected");

  const toRef = (e: EvidenceInput): EvidenceRef => ({
    id: e.id,
    evidenceType: e.evidenceType,
    label: e.label ?? labels.get(e.evidenceType) ?? e.evidenceType,
    review: e.review,
    carried: e.carried === true,
  });
  const nextStageOf = (stage: number) =>
    stage >= 9 ? null : { stage: stage + 1, needs: checkStage(vpaf, labels, dimension, stage + 1, pool).missing };
  const missingBetween = (from: number, to: number) => {
    const out: string[] = [];
    for (let s = from; s <= Math.min(to, 9); s++) {
      for (const m of checkStage(vpaf, labels, dimension, s, pool).missing) if (!out.includes(m)) out.push(m);
    }
    return out;
  };

  // Rule 9 (silence): a dimension not addressed holds at its anchor, or sits at Stage 1.
  if (answered.length === 0) {
    const stage = anchor?.stage ?? 1;
    return {
      dimension,
      stage,
      computedStage: 1,
      confidence: "LOW",
      rationale: anchor
        ? `Not addressed at this checkpoint; held at Stage ${stage} from the previous checkpoint.`
        : "Not addressed: no answers were given, so it is scored at Stage 1.",
      evidenceUsed: [],
      evidenceMissing: missingBetween(stage + 1, stage + 1),
      anchorStage: anchor?.stage ?? null,
      held: anchor ? "silence" : null,
      contradictions,
      nextStage: nextStageOf(stage),
    };
  }

  // Rules 1, 3 and 5: walk down from the highest claimed stage to the highest one actually passed.
  const claimed = claims.reduce((max, c) => Math.max(max, c.stage), 0);
  let passed = 1;
  let mode: Strength | "narrative" | "floor" = claimed <= 1 ? "pending" : "floor";
  let used: EvidenceInput[] = [];
  for (let s = claimed; s >= 2; s--) {
    const check = checkStage(vpaf, labels, dimension, s, pool);
    if (check.met) {
      passed = s;
      mode = check.strength;
      used = check.used;
      break;
    }
    // A written answer alone can carry the Explore band (Stages 2-3), at low confidence.
    if (s <= 3 && claims.some((c) => c.stage >= s && c.narrated)) {
      passed = s;
      mode = "narrative";
      break;
    }
  }

  // Rule 2: weak proof scores one stage lower.
  const computed = mode === "weak" ? Math.max(1, passed - 1) : passed;

  // Rule 6: confidence.
  let confidence: Confidence =
    mode === "strong" ? "HIGH" : mode === "pending" || mode === "weak" ? "MEDIUM" : "LOW";
  if (contradictions.length > 0) confidence = "LOW";

  const proof = describe(used, labels);
  let rationale: string;
  if (mode === "strong") rationale = `Stage ${computed} test met with accepted proof (${proof}).`;
  else if (mode === "weak") rationale = `Proof for Stage ${passed} was reviewed as weak (${proof}), so it is scored one stage lower.`;
  else if (mode === "narrative") rationale = `Stage ${computed} rests on the written answer only; no proof is attached.`;
  else if (mode === "floor") rationale = `Stage ${claimed} is claimed but no stage above 1 has proof attached.`;
  else if (claimed <= 1) rationale = "The answers place this at Stage 1, which needs no proof.";
  else rationale = `Stage ${computed} test met; the proof (${proof}) has not been reviewed yet.`;
  if (claimed > passed && mode !== "floor") rationale += ` Stage ${claimed} is claimed, but its proof is missing.`;
  if (contradictions.length > 0) rationale += " Contradictory answers were not counted.";

  // Rules 7, 8 and 10: anchor, ratchet, low confidence.
  let stage = computed;
  let held: DimensionScore["held"] = null;
  if (anchor) {
    const decline = submission.declines?.[dimension];
    const explicitDecline = decline && !isPlaceholder(decline.note) && decline.note.trim().length >= 10 ? decline : null;
    if (explicitDecline && computed < anchor.stage) {
      rationale = `Lowered from Stage ${anchor.stage} on ${DECLINE_WORD[explicitDecline.reason]}. ${rationale}`;
    } else if (confidence === "LOW") {
      stage = anchor.stage;
      held = "low_confidence";
      rationale = `Held at Stage ${anchor.stage} from the previous checkpoint: the new answers have low confidence. ${rationale}`;
    } else if (computed < anchor.stage) {
      stage = anchor.stage;
      held = "anchor";
      rationale = `Held at Stage ${anchor.stage} from the previous checkpoint: there is no proof of loss, pivot or earlier over-scoring. ${rationale}`;
    }
  }

  return {
    dimension,
    stage,
    computedStage: computed,
    confidence,
    rationale,
    evidenceUsed: used.map(toRef),
    evidenceMissing: missingBetween(stage + 1, Math.max(claimed, stage + 1)),
    anchorStage: anchor?.stage ?? null,
    held,
    contradictions,
    nextStage: nextStageOf(stage),
  };
}

/** Scores all six dimensions of one checkpoint. */
export function scoreCheckpoint(
  vpaf: Vpaf,
  questions: QuestionBank,
  submission: Submission,
  rules: ContradictionRule[] = CONTRADICTIONS,
): DimensionScore[] {
  const labels = new Map(vpaf.evidence_types.map((t) => [t.id, t.label]));
  return DIMENSIONS.map((d) => scoreDimension(vpaf, questions, rules, labels, d.code, submission));
}

/** The dimension holding the venture back most: the lowest stage, first in framework order on a tie. */
export function bottleneck(scores: DimensionScore[]): DimensionScore | null {
  return scores.reduce<DimensionScore | null>((low, s) => (low === null || s.stage < low.stage ? s : low), null);
}

export type StageMap = Partial<Record<DimensionCode, number>>;

/** Rule 11: reported change is Benchmark to Endline only. Midline never enters into it. */
export function reportedDelta(checkpoints: {
  benchmark?: StageMap;
  midline?: StageMap;
  endline?: StageMap;
}): Record<DimensionCode, number | null> {
  const out = {} as Record<DimensionCode, number | null>;
  for (const { code } of DIMENSIONS) {
    const from = checkpoints.benchmark?.[code];
    const to = checkpoints.endline?.[code];
    out[code] = from === undefined || to === undefined ? null : to - from;
  }
  return out;
}

export interface OverrideInput {
  managerStage: number;
  justification: string;
  author: string;
}

export interface FinalScore {
  system: DimensionScore;
  systemStage: number;
  managerStage: number | null;
  finalStage: number;
  override: OverrideInput | null;
}

export const MIN_JUSTIFICATION = 50;

/** A manager's override sits beside the system score. The system score is never altered. */
export function applyOverride(system: DimensionScore, override: OverrideInput | null): FinalScore {
  if (!override) {
    return { system, systemStage: system.stage, managerStage: null, finalStage: system.stage, override: null };
  }
  if (!Number.isInteger(override.managerStage) || override.managerStage < 1 || override.managerStage > 9) {
    throw new Error("An override stage must be a whole number from 1 to 9.");
  }
  if (override.justification.trim().length < MIN_JUSTIFICATION) {
    throw new Error(`An override needs a justification of at least ${MIN_JUSTIFICATION} characters.`);
  }
  return {
    system,
    systemStage: system.stage,
    managerStage: override.managerStage,
    finalStage: override.managerStage,
    override,
  };
}
