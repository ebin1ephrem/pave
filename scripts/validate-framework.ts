import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseBannedTerms, validateQuestions, validateVpaf, vpafSchema } from "../framework/schema";

const dir = resolve(import.meta.dirname, "../framework");
const vpafPath = resolve(dir, "vpaf.v1.json");
const questionsPath = resolve(dir, "questions.v1.json");

function fail(issues: string[]): never {
  for (const i of issues) console.error(`  x ${i}`);
  console.error(`\nFramework validation failed: ${issues.length} problem(s).`);
  process.exit(1);
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail([`${path}: ${e instanceof Error ? e.message : String(e)}`]);
  }
}

const banned = parseBannedTerms(readFileSync(resolve(dir, "banned-terms.txt"), "utf8"));

if (!existsSync(vpafPath)) fail(["framework/vpaf.v1.json does not exist"]);
const vpafRaw = readJson(vpafPath);
const issues = validateVpaf(vpafRaw, banned);

// The question bank is written after the 6x9 table is approved; --require-questions makes it mandatory.
const requireQuestions = process.argv.includes("--require-questions");
if (existsSync(questionsPath)) {
  const vpaf = vpafSchema.safeParse(vpafRaw);
  if (vpaf.success) issues.push(...validateQuestions(readJson(questionsPath), vpaf.data, banned));
} else if (requireQuestions) {
  issues.push("framework/questions.v1.json does not exist");
}

if (issues.length > 0) fail(issues);
console.log("Framework valid: 6 dimensions x 9 stages" + (existsSync(questionsPath) ? ", question bank OK." : " (no question bank yet)."));
