import { describe, expect, it } from "vitest";
import { DIMENSIONS } from "../../framework/schema";
import { CONTRADICTIONS } from "./contradictions";
import {
  applyOverride,
  isPlaceholder,
  reportedDelta,
  scoreCheckpoint,
  type AnswerInput,
  type EvidenceInput,
  type Submission,
} from "./engine";
import { QUESTIONS, VPAF } from "./framework";

let seq = 0;
const ev = (
  dimension: EvidenceInput["dimension"],
  evidenceType: string,
  review: EvidenceInput["review"] = "accepted",
  questionId: string | null = null,
): EvidenceInput => ({ id: `e${++seq}`, dimension, evidenceType, review, questionId });
const ans = (questionId: string, optionId: string | null, narrative?: string): AnswerInput => ({
  questionId,
  optionId,
  narrative,
});
const score = (s: Submission) => scoreCheckpoint(VPAF, QUESTIONS, s);
const dim = (s: Submission, code: string) => score(s).find((d) => d.dimension === code)!;

describe("every score explains itself", () => {
  it("returns six dimensions, each with a rationale and evidence lists", () => {
    const result = score({ answers: [], evidence: [] });
    expect(result.map((d) => d.dimension)).toEqual(DIMENSIONS.map((d) => d.code));
    for (const d of result) {
      expect(d.rationale.length).toBeGreaterThan(0);
      expect(Array.isArray(d.evidenceUsed)).toBe(true);
      expect(Array.isArray(d.evidenceMissing)).toBe(true);
      expect(["HIGH", "MEDIUM", "LOW"]).toContain(d.confidence);
    }
  });
});

describe("rule 1: highest stage with supporting evidence", () => {
  it("awards the stage whose proof is attached and accepted", () => {
    const d = dim(
      {
        answers: [ans("cus.pattern", "pattern_logged"), ans("cus.written_offer", "written_and_shared")],
        evidence: [ev("CUS", "interview_log"), ev("CUS", "written_offer")],
      },
      "CUS",
    );
    expect(d.stage).toBe(4);
    expect(d.confidence).toBe("HIGH");
    expect(d.evidenceUsed.map((e) => e.evidenceType).sort()).toEqual(["interview_log", "written_offer"]);
  });

  it("steps down to the highest stage that is actually proven", () => {
    // Claims Stage 6 (signed commitment) but only has Stage 4 proof.
    const d = dim(
      {
        answers: [ans("cus.signed_commitment", "signed"), ans("cus.pattern", "pattern_logged")],
        evidence: [ev("CUS", "interview_log"), ev("CUS", "written_offer")],
      },
      "CUS",
    );
    expect(d.stage).toBe(4);
    expect(d.evidenceMissing.join(" ")).toMatch(/Letter of intent/);
  });

  it("requires every proof of a stage unless the test says or", () => {
    // CUS 4 needs interview log AND written offer.
    const onlyOne = dim(
      { answers: [ans("cus.pattern", "pattern_logged", "Twelve interviews, same complaint each time.")], evidence: [ev("CUS", "interview_log")] },
      "CUS",
    );
    expect(onlyOne.stage).toBeLessThan(4);
    // CUS 7 accepts invoice OR pilot agreement.
    const either = dim(
      { answers: [ans("cus.paying_customers", "a_few_same_route")], evidence: [ev("CUS", "pilot_agreement")] },
      "CUS",
    );
    expect(either.stage).toBe(7);
  });
});

describe("rule 2: weak evidence scores one stage lower", () => {
  it("drops one stage when the proof was reviewed as weak", () => {
    const d = dim(
      {
        answers: [ans("prd.testing_done", "measured")],
        evidence: [ev("PRD", "test_report", "weak")],
      },
      "PRD",
    );
    expect(d.stage).toBe(3);
    expect(d.confidence).toBe("MEDIUM");
    expect(d.rationale).toMatch(/weak/i);
  });

  it("does not drop when accepted proof exists alongside weak proof", () => {
    const d = dim(
      { answers: [ans("prd.testing_done", "measured")], evidence: [ev("PRD", "test_report", "weak"), ev("PRD", "test_report", "accepted")] },
      "PRD",
    );
    expect(d.stage).toBe(4);
    expect(d.confidence).toBe("HIGH");
  });

  it("counts unreviewed proof at full stage with medium confidence", () => {
    const d = dim({ answers: [ans("prd.testing_done", "measured")], evidence: [ev("PRD", "test_report", "pending")] }, "PRD");
    expect(d.stage).toBe(4);
    expect(d.confidence).toBe("MEDIUM");
  });

  it("ignores rejected proof", () => {
    const d = dim({ answers: [ans("prd.testing_done", "measured")], evidence: [ev("PRD", "test_report", "rejected")] }, "PRD");
    expect(d.stage).toBe(1);
  });
});

describe("rule 3: a claim with no evidence is not counted", () => {
  it("does not count an unevidenced claim above the Explore band", () => {
    const d = dim({ answers: [ans("cap.commitments", "funds_received", "The grant arrived in March.")], evidence: [] }, "CAP");
    expect(d.stage).toBeLessThanOrEqual(3);
    expect(d.confidence).toBe("LOW");
  });

  it("lets a written answer stand for lower stages, at low confidence", () => {
    const d = dim(
      { answers: [ans("cus.segment_clarity", "one_group_named", "Smallholder dairy farmers with under ten cattle.")], evidence: [] },
      "CUS",
    );
    expect(d.stage).toBe(3);
    expect(d.confidence).toBe("LOW");
    expect(d.evidenceMissing.length).toBeGreaterThan(0);
  });

  it("treats placeholder text as no narrative", () => {
    for (const text of ["", "  ", "NA", "n/a", "tbd", "-", "xxx", "test", "Lorem ipsum dolor"]) expect(isPlaceholder(text)).toBe(true);
    expect(isPlaceholder("Smallholder dairy farmers")).toBe(false);
    const d = dim({ answers: [ans("cus.segment_clarity", "one_group_named", "TBD")], evidence: [] }, "CUS");
    expect(d.stage).toBe(1);
  });
});

describe("rule 4: contradictory answers are not counted", () => {
  it("drops both sides of a contradiction", () => {
    const s: Submission = {
      answers: [ans("cus.paying_customers", "several_or_more"), ans("biz.test_sales", "none")],
      evidence: [ev("CUS", "customer_list"), ev("CUS", "pipeline_list"), ev("CUS", "onboarding_checklist")],
    };
    const cus = dim(s, "CUS");
    expect(cus.stage).toBe(1);
    expect(cus.confidence).toBe("LOW");
    expect(cus.contradictions).toHaveLength(1);
    expect(dim(s, "BIZ").contradictions).toHaveLength(1);
  });

  it("counts the same answer when nothing contradicts it", () => {
    const d = dim(
      {
        answers: [ans("cus.paying_customers", "several_or_more"), ans("biz.test_sales", "a_few")],
        evidence: [ev("CUS", "customer_list"), ev("CUS", "pipeline_list"), ev("CUS", "onboarding_checklist")],
      },
      "CUS",
    );
    expect(d.stage).toBe(8);
  });

  it("only refers to questions and options that exist", () => {
    for (const rule of CONTRADICTIONS) {
      for (const side of [rule.a, rule.b]) {
        const q = QUESTIONS.questions.find((x) => x.id === side.question);
        expect(q, `${rule.id}: ${side.question}`).toBeDefined();
        for (const o of side.options) expect(q!.options.map((x) => x.id), `${rule.id}: ${o}`).toContain(o);
      }
    }
  });
});

describe("rule 5: where two stages are arguable, take the lower", () => {
  it("awards the lower stage when the higher one is only partly proven", () => {
    // MOT 6 needs protection in place AND the infringement review. A filing alone holds at 5 or below.
    const d = dim(
      {
        answers: [ans("mot.formal_protection", "first_in_place"), ans("mot.preparation", "with_professional"), ans("mot.record_keeping", "standard")],
        evidence: [ev("MOT", "filing_receipt"), ev("MOT", "draft_applications"), ev("MOT", "record_keeping")],
      },
      "MOT",
    );
    expect(d.stage).toBe(5);
  });
});

describe("rule 9 and unanswered dimensions", () => {
  it("scores an all-unanswered dimension at Stage 1 with low confidence at Benchmark", () => {
    const d = dim({ answers: [ans("tea.core_team", null)], evidence: [] }, "TEA");
    expect(d.stage).toBe(1);
    expect(d.confidence).toBe("LOW");
    expect(d.rationale).toMatch(/not addressed|no answers/i);
  });

  it("silence holds a dimension at its anchor stage", () => {
    const d = dim({ answers: [], evidence: [], anchors: { TEA: { stage: 5, evidence: [] } } }, "TEA");
    expect(d.stage).toBe(5);
    expect(d.anchorStage).toBe(5);
    expect(d.held).toBe("silence");
  });
});

describe("rules 7, 8 and 10: anchor, ratchet, low confidence", () => {
  it("holds the stage when a founder says 'concept' at Midline but prior prototype evidence exists", () => {
    const prototype = ev("PRD", "demo_media", "accepted", "prd.what_exists");
    const d = dim(
      {
        answers: [ans("prd.what_exists", "described_only", "We are really still at concept.")],
        evidence: [],
        anchors: { PRD: { stage: 3, evidence: [prototype] } },
      },
      "PRD",
    );
    expect(d.stage).toBe(3);
    expect(d.held).toBe("anchor");
    expect(d.rationale).toMatch(/held/i);
  });

  it("carries earlier proof forward so new proof builds on it", () => {
    const d = dim(
      {
        answers: [ans("cus.pattern", "pattern_logged"), ans("cus.written_offer", "written_and_shared")],
        evidence: [ev("CUS", "written_offer")],
        anchors: { CUS: { stage: 3, evidence: [ev("CUS", "interview_log")] } },
      },
      "CUS",
    );
    expect(d.stage).toBe(4);
    expect(d.evidenceUsed.some((e) => e.carried)).toBe(true);
  });

  it("lets a stage drop only on explicit proof of loss, pivot or over-scoring", () => {
    const base: Submission = {
      answers: [ans("cus.segment_clarity", "one_group_named", "We now target clinics instead of hospitals.")],
      evidence: [ev("CUS", "segment_problem_statement"), ev("CUS", "conversation_notes")],
      anchors: { CUS: { stage: 6, evidence: [] } },
    };
    expect(dim(base, "CUS").stage).toBe(6);
    const withDecline = dim(
      { ...base, declines: { CUS: { reason: "pivot", note: "Dropped the hospital segment in June; the signed pilot was cancelled." } } },
      "CUS",
    );
    expect(withDecline.stage).toBe(3);
    expect(withDecline.rationale).toMatch(/pivot/i);
    // A decline with no real explanation is not explicit proof.
    expect(dim({ ...base, declines: { CUS: { reason: "loss", note: "n/a" } } }, "CUS").stage).toBe(6);
  });

  it("removes carried proof the founder marks as lost, without lowering the stage by itself", () => {
    const d = dim(
      {
        answers: [{ questionId: "prd.what_exists", optionId: "first_build", carry: "lost", narrative: "The prototype was destroyed in a flood." }],
        evidence: [],
        anchors: { PRD: { stage: 3, evidence: [ev("PRD", "demo_media", "accepted", "prd.what_exists")] } },
      },
      "PRD",
    );
    expect(d.evidenceUsed).toHaveLength(0);
    expect(d.stage).toBe(3);
  });

  it("returns the anchor stage when the new result has low confidence", () => {
    const d = dim(
      {
        answers: [ans("cap.commitments", "funds_received", "The grant arrived in March.")],
        evidence: [],
        anchors: { CAP: { stage: 2, evidence: [] } },
      },
      "CAP",
    );
    expect(d.confidence).toBe("LOW");
    expect(d.stage).toBe(2);
    expect(d.held).toBe("low_confidence");
  });

  it("raises the stage above the anchor when new proof supports it", () => {
    const d = dim(
      { answers: [ans("prd.testing_done", "measured")], evidence: [ev("PRD", "test_report")], anchors: { PRD: { stage: 3, evidence: [] } } },
      "PRD",
    );
    expect(d.stage).toBe(4);
    expect(d.held).toBeNull();
  });
});

describe("rule 6: what would move a dimension up", () => {
  it("names the proof needed for the next stage", () => {
    const d = dim({ answers: [ans("prd.testing_done", "measured")], evidence: [ev("PRD", "test_report")] }, "PRD");
    expect(d.nextStage).toEqual({ stage: 5, needs: [] });
    const cus = dim({ answers: [ans("cus.conversations", "a_few")], evidence: [ev("CUS", "conversation_notes")] }, "CUS");
    expect(cus.stage).toBe(2);
    expect(cus.nextStage?.stage).toBe(3);
    expect(cus.nextStage?.needs).toEqual(["Written segment and problem statement"]);
  });

  it("has no next stage at Stage 9", () => {
    const d = dim(
      { answers: [ans("prd.support", "in_place")], evidence: [ev("PRD", "volume_records"), ev("PRD", "support_maintenance_records")] },
      "PRD",
    );
    expect(d.stage).toBe(9);
    expect(d.nextStage).toBeNull();
  });
});

describe("rule 11: reported delta is Benchmark to Endline only", () => {
  it("ignores Midline", () => {
    const delta = reportedDelta({
      benchmark: { CUS: 2, PRD: 3 },
      midline: { CUS: 9, PRD: 1 },
      endline: { CUS: 5, PRD: 3 },
    });
    expect(delta.CUS).toBe(3);
    expect(delta.PRD).toBe(0);
    expect(delta.BIZ).toBeNull();
  });

  it("reports nothing until both ends exist", () => {
    expect(reportedDelta({ benchmark: { CUS: 2 }, midline: { CUS: 4 } }).CUS).toBeNull();
  });
});

describe("manager override", () => {
  it("is logged alongside the system score, which is kept", () => {
    const system = dim({ answers: [ans("prd.testing_done", "measured")], evidence: [ev("PRD", "test_report")] }, "PRD");
    const result = applyOverride(system, {
      managerStage: 5,
      justification: "Retest logs were shown on the review call and show fewer failures than before.",
      author: "manager-1",
    });
    expect(result.systemStage).toBe(4);
    expect(result.managerStage).toBe(5);
    expect(result.finalStage).toBe(5);
    expect(result.system).toBe(system);
    expect(system.stage).toBe(4);
  });

  it("is refused without a 50-character justification or with an invalid stage", () => {
    const system = dim({ answers: [], evidence: [] }, "PRD");
    expect(() => applyOverride(system, { managerStage: 5, justification: "Looks fine to me.", author: "m" })).toThrow(/50/);
    expect(() => applyOverride(system, { managerStage: 10, justification: "x".repeat(60), author: "m" })).toThrow(/1 to 9/);
  });

  it("returns the system stage as final when there is no override", () => {
    const system = dim({ answers: [], evidence: [] }, "PRD");
    expect(applyOverride(system, null).finalStage).toBe(system.stage);
  });
});
