import { describe, expect, it } from "vitest";
import {
  DIMENSIONS,
  STAGES,
  findBannedTerms,
  parseBannedTerms,
  validateQuestions,
  validateVpaf,
  vpafWarnings,
  wordCount,
  type QuestionBank,
  type Vpaf,
} from "./schema";

// Made-up terms so this file never contains the real banned list.
const BANNED = ["ZQX", "old framework name"];

function validVpaf(): Vpaf {
  return {
    framework: "VPAF",
    version: "1",
    count_tiers: [
      { id: "none", label: "None", min: 0, max: 0 },
      { id: "a_few", label: "A few", min: 1, max: null },
    ],
    evidence_types: [
      { id: "signed_document", label: "Signed document", strong_when: "Signed and dated", weak_when: "Unsigned draft" },
      { id: "founder_notes", label: "Founder notes", strong_when: null, weak_when: null },
    ],
    dimensions: DIMENSIONS.map((d) => ({
      code: d.code,
      name: d.name,
      tracks: `How far ${d.name} has progressed`,
      stages: STAGES.map((s) => ({
        stage: s.stage,
        band: s.band,
        test: `Placeholder test for ${d.name} at stage ${s.stage}`,
        descriptor: `Placeholder behaviour for ${d.name} at stage ${s.stage}`,
        evidence_required: s.stage === 1 ? [] : ["signed_document", "founder_notes"],
        evidence_groups: s.stage === 1 ? [] : [["signed_document"], ["founder_notes"]],
      })),
    })),
  };
}

function validQuestions(perDimension = 8): QuestionBank {
  return {
    framework: "VPAF",
    version: "1",
    questions: DIMENSIONS.flatMap((d) =>
      Array.from({ length: perDimension }, (_, i) => ({
        id: `${d.code.toLowerCase()}.question_${i + 1}`,
        dimension: d.code,
        text: `Question ${i + 1}`,
        evidence_types: ["signed_document"],
        options: [
          { id: "none", label: "Not yet", stage: null },
          { id: "some", label: "A few, informally", stage: 2 },
          { id: "many", label: "Several, documented", stage: 4 },
        ],
      })),
    ),
  };
}

describe("validateVpaf", () => {
  it("accepts a complete 6x9 framework", () => {
    expect(validateVpaf(validVpaf(), BANNED)).toEqual([]);
  });

  it("fails when a cell is missing", () => {
    const v = validVpaf();
    v.dimensions[2]!.stages.splice(4, 1);
    const issues = validateVpaf(v, BANNED);
    expect(issues).toContain("BIZ.5: cell missing");
  });

  it("fails when a dimension is missing", () => {
    const v = validVpaf();
    v.dimensions.pop();
    expect(validateVpaf(v, BANNED)).toContain("CAP: dimension missing");
  });

  it("fails when a descriptor exceeds 20 words", () => {
    const v = validVpaf();
    v.dimensions[0]!.stages[0]!.descriptor = Array.from({ length: 21 }, () => "word").join(" ");
    expect(validateVpaf(v, BANNED)).toContain("CUS.1: descriptor has 21 words, max 20");
  });

  it("accepts a descriptor of exactly 20 words", () => {
    const v = validVpaf();
    v.dimensions[0]!.stages[0]!.descriptor = Array.from({ length: 20 }, () => "word").join(" ");
    expect(validateVpaf(v, BANNED)).toEqual([]);
  });

  it("fails when a descriptor is more than one sentence", () => {
    const v = validVpaf();
    v.dimensions[0]!.stages[0]!.descriptor = "First sentence. Second sentence.";
    expect(validateVpaf(v, BANNED)).toContain("CUS.1: descriptor must be one sentence");
  });

  it("fails on an empty descriptor", () => {
    const v = validVpaf();
    v.dimensions[0]!.stages[0]!.descriptor = "   ";
    expect(validateVpaf(v, BANNED).length).toBeGreaterThan(0);
  });

  it("fails when a banned term appears, whatever the case", () => {
    const v = validVpaf();
    v.dimensions[1]!.stages[3]!.descriptor = "Moves on from the zqx approach";
    v.evidence_types[0]!.label = "Old Framework Name certificate";
    const issues = validateVpaf(v, BANNED);
    expect(issues.some((i) => i.includes('"ZQX"'))).toBe(true);
    expect(issues.some((i) => i.includes('"old framework name"'))).toBe(true);
  });

  it("does not flag a banned term inside a longer word", () => {
    expect(findBannedTerms("the azqxb value", BANNED)).toEqual([]);
  });

  it("fails on a wrong band", () => {
    const v = validVpaf();
    v.dimensions[0]!.stages[6]!.band = "Validate";
    expect(validateVpaf(v, BANNED)).toContain('CUS.7: band must be "Scale"');
  });

  it("rejects a stage that carries a name", () => {
    const v = validVpaf() as any;
    v.dimensions[0].stages[0].name = "Premise";
    expect(validateVpaf(v, BANNED).length).toBeGreaterThan(0);
  });

  it("fails when a stage is called a level", () => {
    const v = validVpaf();
    v.dimensions[0]!.stages[0]!.descriptor = "The team reaches the next level of sales";
    expect(validateVpaf(v, BANNED).some((i) => i.includes('"level"'))).toBe(true);
  });

  it("fails on an unknown evidence type", () => {
    const v = validVpaf();
    v.dimensions[0]!.stages[1]!.evidence_required.push("invoice");
    const issues = validateVpaf(v, BANNED);
    expect(issues).toContain('CUS.2: unknown evidence type "invoice"');
    expect(issues).toContain('CUS.2: "invoice" is required but in no evidence group');
  });

  it("allows no proof at Stage 1 only", () => {
    const v = validVpaf();
    expect(v.dimensions[0]!.stages[0]!.evidence_required).toEqual([]);
    v.dimensions[0]!.stages[4]!.evidence_required = [];
    v.dimensions[0]!.stages[4]!.evidence_groups = [];
    expect(validateVpaf(v, BANNED)).toContain("CUS.5: needs at least one proof type");
  });

  it("accepts either-or proof as one group", () => {
    const v = validVpaf();
    v.dimensions[0]!.stages[6]!.evidence_groups = [["signed_document", "founder_notes"]];
    expect(validateVpaf(v, BANNED)).toEqual([]);
  });

  it("warns, without failing, about proof types that have no strong/weak rule", () => {
    const v = validVpaf();
    expect(validateVpaf(v, BANNED)).toEqual([]);
    expect(vpafWarnings(v)).toEqual(['evidence type "founder_notes": no strong/weak rule']);
  });
});

describe("validateQuestions", () => {
  it("accepts 8 to 12 questions per dimension", () => {
    expect(validateQuestions(validQuestions(8), validVpaf(), BANNED)).toEqual([]);
    expect(validateQuestions(validQuestions(12), validVpaf(), BANNED)).toEqual([]);
  });

  it("fails outside 8 to 12 questions per dimension", () => {
    expect(validateQuestions(validQuestions(7), validVpaf(), BANNED)).toContain("CUS: has 7 questions, needs 8-12");
    expect(validateQuestions(validQuestions(13), validVpaf(), BANNED)).toContain("CAP: has 13 questions, needs 8-12");
  });

  it("fails when an option is a bare number", () => {
    const q = validQuestions();
    q.questions[0]!.options[1]!.label = "5-10";
    expect(validateQuestions(q, validVpaf(), BANNED)).toContain(
      "cus.question_1.some: option label must be qualitative, not a bare number",
    );
  });

  it("fails on unknown evidence type, banned term and stage-less question", () => {
    const q = validQuestions();
    q.questions[0]!.evidence_types = ["bank_statement"];
    q.questions[1]!.text = "Did you use ZQX?";
    q.questions[2]!.options = q.questions[2]!.options.map((o) => ({ ...o, stage: null }));
    const issues = validateQuestions(q, validVpaf(), BANNED);
    expect(issues).toContain('cus.question_1: unknown evidence type "bank_statement"');
    expect(issues.some((i) => i.includes('"ZQX"'))).toBe(true);
    expect(issues).toContain("cus.question_3: no option maps to a stage");
  });
});

describe("helpers", () => {
  it("counts words", () => {
    expect(wordCount("  one two   three ")).toBe(3);
  });

  it("parses the banned-term file, skipping blanks and comments", () => {
    expect(parseBannedTerms("# note\nABC\n\n two words \n")).toEqual(["ABC", "two words"]);
  });
});
