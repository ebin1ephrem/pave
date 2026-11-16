import type { DimensionCode } from "../../framework/schema";
import { supabase } from "@/lib/supabase";
import {
  scoreCheckpoint,
  type CarryStatus,
  type DimensionScore,
  type EvidenceInput,
  type ReviewStatus,
  type Submission,
} from "@/scoring/engine";
import { FRAMEWORK_VERSION, QUESTIONS, VPAF } from "@/scoring/framework";

export type CheckpointType = "benchmark" | "midline" | "endline";
export type CheckpointStatus = "not_started" | "in_progress" | "submitted" | "reviewed";
export const CHECKPOINT_ORDER: CheckpointType[] = ["benchmark", "midline", "endline"];
export const CHECKPOINT_LABEL: Record<CheckpointType, string> = {
  benchmark: "Benchmark",
  midline: "Midline",
  endline: "Endline",
};

export interface Checkpoint {
  id: string;
  type: CheckpointType;
  status: CheckpointStatus;
  submitted_at: string | null;
}

export interface Enrollment {
  id: string;
  tenant_id: string;
  startupName: string;
  checkpoints: Checkpoint[];
}

export interface ResponseRow {
  question_id: string;
  option_id: string | null;
  narrative: string | null;
  carry_status: CarryStatus | null;
}

export interface EvidenceRow {
  id: string;
  checkpoint_id: string;
  kind: "file" | "link";
  url: string | null;
  storage_path: string | null;
  file_name: string | null;
  evidence_type: string;
  dimension: DimensionCode;
  question_id: string | null;
  review_status: ReviewStatus;
  review_note: string | null;
}

export interface CheckpointData {
  responses: ResponseRow[];
  evidence: EvidenceRow[];
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
];

function db() {
  if (!supabase) throw new Error("PAVE is not connected to its database.");
  return supabase;
}

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** The signed-in founder's enrollment in a program, with its three checkpoints. Null if there is none. */
export async function loadEnrollment(programId: string): Promise<Enrollment | null> {
  const { data, error } = await db()
    .from("enrollments")
    .select("id, tenant_id, startups(name), checkpoints(id, type, status, submitted_at)")
    .eq("program_id", programId)
    .limit(1)
    .maybeSingle();
  fail(error);
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    tenant_id: string;
    startups: { name: string } | null;
    checkpoints: Checkpoint[];
  };
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    startupName: row.startups?.name ?? "Your startup",
    checkpoints: [...row.checkpoints].sort((a, b) => CHECKPOINT_ORDER.indexOf(a.type) - CHECKPOINT_ORDER.indexOf(b.type)),
  };
}

export async function loadCheckpointData(checkpointId: string): Promise<CheckpointData> {
  const [responses, evidence] = await Promise.all([
    db().from("responses").select("question_id, option_id, narrative, carry_status").eq("checkpoint_id", checkpointId),
    db()
      .from("evidence")
      .select("id, checkpoint_id, kind, url, storage_path, file_name, evidence_type, dimension, question_id, review_status, review_note")
      .eq("checkpoint_id", checkpointId)
      .order("created_at"),
  ]);
  fail(responses.error);
  fail(evidence.error);
  return { responses: (responses.data ?? []) as ResponseRow[], evidence: (evidence.data ?? []) as EvidenceRow[] };
}

/** Saves one answer. A question with nothing chosen, written or carried is stored as no row at all. */
export async function saveResponse(checkpointId: string, row: ResponseRow): Promise<void> {
  const empty = !row.option_id && !row.narrative?.trim() && !row.carry_status;
  if (empty) {
    const { error } = await db().from("responses").delete().eq("checkpoint_id", checkpointId).eq("question_id", row.question_id);
    fail(error);
    return;
  }
  const { error } = await db()
    .from("responses")
    .upsert(
      {
        checkpoint_id: checkpointId,
        question_id: row.question_id,
        option_id: row.option_id,
        narrative: row.narrative?.trim() ? row.narrative : null,
        carry_status: row.carry_status,
      },
      { onConflict: "checkpoint_id,question_id" },
    );
  fail(error);
}

interface NewEvidence {
  checkpointId: string;
  questionId: string;
  dimension: DimensionCode;
  evidenceType: string;
}

export async function addLinkEvidence(target: NewEvidence, url: string): Promise<EvidenceRow> {
  const { data, error } = await db()
    .from("evidence")
    .insert({
      checkpoint_id: target.checkpointId,
      kind: "link",
      url,
      evidence_type: target.evidenceType,
      dimension: target.dimension,
      question_id: target.questionId,
    })
    .select()
    .single();
  fail(error);
  return data as EvidenceRow;
}

export function checkFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return "That file is over 10 MB. Compress it, or paste a link to it instead.";
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return "That file type is not accepted. Use PDF, an image, Word, Excel, PowerPoint, CSV or plain text.";
  }
  return null;
}

export async function addFileEvidence(target: NewEvidence, enrollment: Enrollment, file: File): Promise<EvidenceRow> {
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
  const path = `${enrollment.tenant_id}/${enrollment.id}/${target.checkpointId}/${crypto.randomUUID()}-${safeName}`;
  const upload = await db().storage.from("evidence").upload(path, file, { contentType: file.type });
  fail(upload.error);
  const { data, error } = await db()
    .from("evidence")
    .insert({
      checkpoint_id: target.checkpointId,
      kind: "file",
      storage_path: path,
      file_name: file.name,
      evidence_type: target.evidenceType,
      dimension: target.dimension,
      question_id: target.questionId,
    })
    .select()
    .single();
  if (error) {
    await db().storage.from("evidence").remove([path]);
    fail(error);
  }
  return data as EvidenceRow;
}

export async function removeEvidence(item: EvidenceRow): Promise<void> {
  const { error } = await db().from("evidence").delete().eq("id", item.id);
  fail(error);
  if (item.storage_path) await db().storage.from("evidence").remove([item.storage_path]);
}

/** A short-lived link to open a private evidence file. */
export async function evidenceHref(item: EvidenceRow): Promise<string | null> {
  if (item.kind === "link") return item.url;
  if (!item.storage_path) return null;
  const { data } = await db().storage.from("evidence").createSignedUrl(item.storage_path, 300);
  return data?.signedUrl ?? null;
}

export async function submitCheckpoint(checkpointId: string): Promise<void> {
  const { error } = await db().rpc("submit_checkpoint", { _checkpoint: checkpointId, _framework_version: FRAMEWORK_VERSION });
  fail(error);
}

const toEvidenceInput = (e: EvidenceRow): EvidenceInput => ({
  id: e.id,
  dimension: e.dimension,
  evidenceType: e.evidence_type,
  questionId: e.question_id,
  review: e.review_status,
  label: e.file_name ?? undefined,
});

/**
 * Scores a chain of checkpoints in order. Each one is anchored on the one before it, and proof
 * from earlier checkpoints is carried forward. Returns the scores of the last checkpoint given.
 */
export function scoreChain(chain: CheckpointData[]): DimensionScore[] {
  let previous: DimensionScore[] | null = null;
  let carried: EvidenceInput[] = [];
  let scores: DimensionScore[] = [];
  for (const data of chain) {
    const submission: Submission = {
      answers: data.responses.map((r) => ({
        questionId: r.question_id,
        optionId: r.option_id,
        narrative: r.narrative,
        carry: r.carry_status,
      })),
      evidence: data.evidence.map(toEvidenceInput),
    };
    if (previous) {
      submission.anchors = {};
      submission.declines = {};
      for (const p of previous) {
        submission.anchors[p.dimension] = { stage: p.stage, evidence: carried.filter((e) => e.dimension === p.dimension) };
      }
      // A founder marking an earlier answer as lost, with an explanation, is an explicit decline.
      for (const r of data.responses) {
        if (r.carry_status !== "lost" || !r.narrative) continue;
        const dimension = QUESTIONS.questions.find((q) => q.id === r.question_id)?.dimension;
        if (dimension && !submission.declines[dimension]) submission.declines[dimension] = { reason: "loss", note: r.narrative };
      }
    }
    scores = scoreCheckpoint(VPAF, QUESTIONS, submission);
    const lost = new Set(data.responses.filter((r) => r.carry_status === "lost").map((r) => r.question_id));
    carried = [...carried.filter((e) => !(e.questionId && lost.has(e.questionId))), ...submission.evidence];
    previous = scores;
  }
  return scores;
}
