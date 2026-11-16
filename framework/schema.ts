import { z } from "zod";

/** Fixed VPAF vocabulary. Changing any of this is a framework version change. */
export const DIMENSIONS = [
  { code: "CUS", name: "Customer" },
  { code: "PRD", name: "Product" },
  { code: "BIZ", name: "Business Model" },
  { code: "MOT", name: "Moat" },
  { code: "TEA", name: "Team" },
  { code: "CAP", name: "Capital" },
] as const;

/** Stages are numbers only ("Stage 1" to "Stage 9"). They have no names. */
export const STAGES = [
  { stage: 1, band: "Explore" },
  { stage: 2, band: "Explore" },
  { stage: 3, band: "Explore" },
  { stage: 4, band: "Validate" },
  { stage: 5, band: "Validate" },
  { stage: 6, band: "Validate" },
  { stage: 7, band: "Scale" },
  { stage: 8, band: "Scale" },
  { stage: 9, band: "Scale" },
] as const;

/** Words that must not appear in framework content: stages are never called these. */
export const FRAMEWORK_FORBIDDEN_WORDS = ["level", "levels"];

export const MAX_DESCRIPTOR_WORDS = 20;
export const MIN_QUESTIONS_PER_DIMENSION = 8;
export const MAX_QUESTIONS_PER_DIMENSION = 12;

export type DimensionCode = (typeof DIMENSIONS)[number]["code"];

const dimensionCode = z.enum(["CUS", "PRD", "BIZ", "MOT", "TEA", "CAP"]);
const stageNumber = z.number().int().min(1).max(9);
const slug = z.string().regex(/^[a-z][a-z0-9_]*$/, "use lower_snake_case");
const text = z.string().trim().min(1);

const evidenceTypeSchema = z.object({ id: slug, label: text }).strict();

const stageSchema = z
  .object({
    stage: stageNumber,
    band: z.enum(["Explore", "Validate", "Scale"]),
    descriptor: text,
    evidence_required: z.array(slug).min(1),
    evidence_strength: z.object({ strong: z.array(slug).min(1), weak: z.array(slug) }).strict(),
  })
  .strict();

export const vpafSchema = z
  .object({
    framework: z.literal("VPAF"),
    version: text,
    evidence_types: z.array(evidenceTypeSchema).min(1),
    dimensions: z.array(z.object({ code: dimensionCode, name: text, stages: z.array(stageSchema) }).strict()),
  })
  .strict();

const optionSchema = z
  .object({
    id: slug,
    label: text,
    /** Stage this answer signals. null = "not yet / does not apply": signals nothing. */
    stage: stageNumber.nullable(),
  })
  .strict();

export const questionsSchema = z
  .object({
    framework: z.literal("VPAF"),
    version: text,
    questions: z.array(
      z
        .object({
          id: z.string().regex(/^(cus|prd|biz|mot|tea|cap)\.[a-z][a-z0-9_]*$/, "use <dimension>.<snake_case>"),
          dimension: dimensionCode,
          text: text,
          evidence_types: z.array(slug).min(1),
          options: z.array(optionSchema).min(2),
        })
        .strict(),
    ),
  })
  .strict();

export type Vpaf = z.infer<typeof vpafSchema>;
export type QuestionBank = z.infer<typeof questionsSchema>;

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function parseBannedTerms(fileContents: string): string[] {
  return fileContents
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Walk any JSON value and report every string that contains a banned term as a whole word. */
export function findBannedTerms(value: unknown, banned: string[], path = "$"): string[] {
  if (typeof value === "string") {
    return banned
      .filter((term) => new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(term)}([^A-Za-z0-9]|$)`, "i").test(value))
      .map((term) => `${path}: contains banned term "${term}"`);
  }
  if (Array.isArray(value)) return value.flatMap((v, i) => findBannedTerms(v, banned, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => [
      ...findBannedTerms(k, banned, `${path}.${k}(key)`),
      ...findBannedTerms(v, banned, `${path}.${k}`),
    ]);
  }
  return [];
}

function zodIssues(error: z.ZodError, label: string): string[] {
  return error.issues.map((i) => `${label} ${i.path.join(".") || "(root)"}: ${i.message}`);
}

function duplicates(values: string[]): string[] {
  return [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
}

/** Returns a list of problems. Empty list = valid. */
export function validateVpaf(input: unknown, banned: string[]): string[] {
  const parsed = vpafSchema.safeParse(input);
  if (!parsed.success) return zodIssues(parsed.error, "vpaf");
  const vpaf = parsed.data;
  const issues: string[] = [];

  const typeIds = vpaf.evidence_types.map((t) => t.id);
  for (const d of duplicates(typeIds)) issues.push(`evidence_types: duplicate id "${d}"`);
  const knownTypes = new Set(typeIds);

  for (const d of duplicates(vpaf.dimensions.map((x) => x.code))) issues.push(`dimensions: duplicate "${d}"`);

  for (const expected of DIMENSIONS) {
    const dim = vpaf.dimensions.find((d) => d.code === expected.code);
    if (!dim) {
      issues.push(`${expected.code}: dimension missing`);
      continue;
    }
    if (dim.name !== expected.name) issues.push(`${dim.code}: name must be "${expected.name}"`);
    if (dim.stages.length !== STAGES.length) issues.push(`${dim.code}: must have exactly 9 stages, has ${dim.stages.length}`);

    for (const s of STAGES) {
      const cell = dim.stages.find((x) => x.stage === s.stage);
      const at = `${dim.code}.${s.stage}`;
      if (!cell) {
        issues.push(`${at}: cell missing`);
        continue;
      }
      if (cell.band !== s.band) issues.push(`${at}: band must be "${s.band}"`);

      const words = wordCount(cell.descriptor);
      if (words > MAX_DESCRIPTOR_WORDS) issues.push(`${at}: descriptor has ${words} words, max ${MAX_DESCRIPTOR_WORDS}`);
      if (/[.!?]\s+\S/.test(cell.descriptor)) issues.push(`${at}: descriptor must be one sentence`);

      const { strong, weak } = cell.evidence_strength;
      for (const id of [...cell.evidence_required, ...strong, ...weak]) {
        if (!knownTypes.has(id)) issues.push(`${at}: unknown evidence type "${id}"`);
      }
      for (const id of strong) if (weak.includes(id)) issues.push(`${at}: "${id}" is both strong and weak`);
      for (const id of cell.evidence_required) {
        if (!strong.includes(id) && !weak.includes(id)) issues.push(`${at}: "${id}" is required but not rated strong or weak`);
      }
      for (const id of [...strong, ...weak]) {
        if (!cell.evidence_required.includes(id)) issues.push(`${at}: "${id}" is rated but not in evidence_required`);
      }
    }
  }

  return [...issues, ...findBannedTerms(vpaf, [...banned, ...FRAMEWORK_FORBIDDEN_WORDS], "vpaf")];
}

/** Returns a list of problems. Empty list = valid. Needs a valid VPAF for evidence-type lookups. */
export function validateQuestions(input: unknown, vpaf: Vpaf, banned: string[]): string[] {
  const parsed = questionsSchema.safeParse(input);
  if (!parsed.success) return zodIssues(parsed.error, "questions");
  const bank = parsed.data;
  const issues: string[] = [];
  const knownTypes = new Set(vpaf.evidence_types.map((t) => t.id));

  if (bank.version !== vpaf.version) issues.push(`questions: version "${bank.version}" does not match framework "${vpaf.version}"`);
  for (const d of duplicates(bank.questions.map((q) => q.id))) issues.push(`questions: duplicate id "${d}"`);

  for (const { code } of DIMENSIONS) {
    const n = bank.questions.filter((q) => q.dimension === code).length;
    if (n < MIN_QUESTIONS_PER_DIMENSION || n > MAX_QUESTIONS_PER_DIMENSION) {
      issues.push(`${code}: has ${n} questions, needs ${MIN_QUESTIONS_PER_DIMENSION}-${MAX_QUESTIONS_PER_DIMENSION}`);
    }
  }

  for (const q of bank.questions) {
    if (!q.id.startsWith(`${q.dimension.toLowerCase()}.`)) issues.push(`${q.id}: id prefix does not match dimension ${q.dimension}`);
    for (const id of q.evidence_types) if (!knownTypes.has(id)) issues.push(`${q.id}: unknown evidence type "${id}"`);
    for (const d of duplicates(q.options.map((o) => o.id))) issues.push(`${q.id}: duplicate option id "${d}"`);
    if (!q.options.some((o) => o.stage !== null)) issues.push(`${q.id}: no option maps to a stage`);
    for (const o of q.options) {
      // Options are qualitative descriptors (tier + count pattern), never a bare number.
      if (/^[\d\s.,+\-–<>=%]+$/.test(o.label)) issues.push(`${q.id}.${o.id}: option label must be qualitative, not a bare number`);
    }
  }

  return [...issues, ...findBannedTerms(bank, [...banned, ...FRAMEWORK_FORBIDDEN_WORDS], "questions")];
}
