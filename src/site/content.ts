import { DIMENSIONS, type DimensionCode } from "../../framework/schema";

/** Copy shared by more than one public page. Source: site copy v0.1. */

export const DIMENSION_QUESTIONS: Record<DimensionCode, string> = {
  CUS: "Has anyone agreed to buy, and can you win customers repeatedly?",
  PRD: "Does it work, where, and how reliably?",
  BIZ: "Who pays, at what price, and does the model hold as you grow?",
  MOT: "What do you own that others cannot easily copy?",
  TEA: "Can the organisation deliver without depending on one person?",
  CAP: "Do you know what money you need and can you raise it?",
};

export interface DimensionDetail {
  code: DimensionCode;
  name: string;
  summary: string;
  examples: { stage: 1 | 5 | 9; text: string }[];
  evidence: string;
}

export const DIMENSION_DETAILS: DimensionDetail[] = [
  {
    code: "CUS",
    name: "Customer",
    summary: "From believing there is a customer to winning and keeping customers repeatedly.",
    examples: [
      { stage: 1, text: "The customer and problem are the founders' own belief." },
      { stage: 5, text: "Target users have tried the concept or prototype, and their feedback changed something." },
      { stage: 9, text: "Customers arrive without founders selling each deal, stay, and buy more." },
    ],
    evidence: "Interview notes, signed letters of intent, invoices, pipeline.",
  },
  {
    code: "PRD",
    name: "Product",
    summary: "From an idea to something that runs reliably at commercial volume.",
    examples: [
      { stage: 1, text: "Described, nothing built." },
      { stage: 5, text: "Changed because of test results, and failing less often." },
      { stage: 9, text: "Running at commercial volume with support in place." },
    ],
    evidence: "Demos, test reports, trial logs.",
  },
  {
    code: "BIZ",
    name: "Business Model",
    summary: "From not knowing who pays to a model that keeps working as the venture grows.",
    examples: [
      { stage: 1, text: "The team cannot say who pays or why." },
      { stage: 5, text: "Unit cost and margin come from real figures, and routes to market are chosen." },
      { stage: 9, text: "The model sustains growth and its figures are reviewed on a schedule." },
    ],
    evidence: "Price discussions with buyers, cost sheets, sales records.",
  },
  {
    code: "MOT",
    name: "Moat",
    summary:
      "What the venture owns that others cannot easily copy: patents, designs, brand, trade secrets, data, licences, exclusive agreements.",
    examples: [
      { stage: 1, text: "Unclear what is hard to copy or who owns it." },
      { stage: 5, text: "Protection is being prepared with professional help." },
      { stage: 9, text: "The position is maintained, monitored, and earns business value." },
    ],
    evidence: "Ownership agreements, filing receipts, protection plan.",
  },
  {
    code: "TEA",
    name: "Team",
    summary: "From one person to an organisation that does not depend on its founders for every task.",
    examples: [
      { stage: 1, text: "One founder with key skills missing." },
      { stage: 5, text: "Independent advisers are active and a hiring plan covers the most pressing gap." },
      { stage: 9, text: "A leadership team runs the company and governance holds as it grows." },
    ],
    evidence: "Role map, weekly tracker, adviser activity.",
  },
  {
    code: "CAP",
    name: "Capital",
    summary: "From no view of the money to a choice between sources of capital.",
    examples: [
      { stage: 1, text: "No view of what is needed or how long cash lasts." },
      { stage: 5, text: "Conversations with funders are live and each milestone has an amount." },
      { stage: 9, text: "Several sources to choose from, with reliable forecasting." },
    ],
    evidence: "Runway sheet, pitch deck, funder correspondence, commitment letters.",
  },
];

// Keep the page copy in step with the framework's fixed vocabulary.
if (DIMENSION_DETAILS.map((d) => d.name).join() !== DIMENSIONS.map((d) => d.name).join()) {
  throw new Error("Site dimension copy is out of step with framework/schema.ts");
}

export const BANDS = [
  { name: "Explore", range: "Stages 1–3", text: "The venture is forming its beliefs and making first contact with reality." },
  { name: "Validate", range: "Stages 4–6", text: "Those beliefs are being tested with customers, users and funders." },
  { name: "Scale", range: "Stages 7–9", text: "What works is being repeated and grown." },
] as const;

export const CHECKPOINT_RULES = [
  { name: "Anchor", text: "Each review starts from the last stage and the evidence behind it." },
  { name: "Ratchet", text: "A stage drops only when there is proof of loss, a pivot, or an earlier over-score." },
  { name: "Silence", text: "A dimension nobody mentioned stays where it was." },
] as const;

export const SCORING_RULES = [
  "The highest stage with proof.",
  "One stage lower if the proof is weak.",
  "The lower stage where two are arguable.",
  "No proof, no credit.",
  "Contradictions are not counted.",
  "Missing uploads lower confidence; they do not cancel a written answer.",
] as const;

export interface FaqItem {
  q: string;
  a: string;
  /** Unresolved [CONFIRM]/[TBD] note. Items with `hidden` are left off the public page until resolved. */
  pending?: string;
  hidden?: boolean;
}

export const FAQ: FaqItem[] = [
  {
    q: "What is PAVE?",
    a: "A tool for assessing how far a startup has progressed across six dimensions, with evidence, at the start, middle and end of a support program.",
  },
  { q: "Who fills in the assessment?", a: "Founders. A program manager can also complete it with them during a call." },
  {
    q: "How long does it take a founder?",
    a: "We will publish a typical time after testing with the first cohort.",
    pending: "Founder completion time, after testing with the first cohort",
    hidden: true,
  },
  {
    q: "What counts as evidence?",
    a: "Documents that show the claim is true: interview notes, signed letters of intent, invoices, test reports, filing receipts, budgets, pitch decks. Each question says what fits.",
  },
  {
    q: "What if a founder has no evidence?",
    a: "The claim is not counted towards the stage, and the gap appears on the manager's list. Nothing is hidden and nobody is disqualified.",
  },
  { q: "Can a manager change a score?", a: "Yes, with a written reason. The original score and the override are both kept." },
  {
    q: "Can a score go down?",
    a: "Only with proof that something was lost, the venture pivoted, or an earlier score was too high.",
  },
  {
    q: "Is PAVE an investment rating?",
    a: "No. It describes progress. It does not value a company or recommend an investment.",
  },
  { q: "Do founders pay?", a: "No." },
  {
    q: "Who can see a startup's data?",
    a: "The founders, the managers of the program they are enrolled in, and that organisation's admins.",
    pending: "Final access rules, including Merstra's own access and anonymised research use",
  },
  {
    q: "Where is data stored?",
    a: "We will publish the hosting region and provider here once decided.",
    pending: "Hosting region and provider",
    hidden: true,
  },
  {
    q: "Can we use our own framework instead?",
    a: "Not in the first version.",
    pending: "Confirm: not in v1",
  },
  {
    q: "Can Merstra run the assessments for us?",
    a: "Yes, as a service. Our team can conduct the Benchmark, Midline and Endline assessments and deliver the profiles.",
    pending: "Confirm assessment-as-a-service offer",
  },
];

/** In production, unresolved answers are left out; in development they show, outlined. */
export const visibleFaq = () => FAQ.filter((f) => !f.hidden || import.meta.env.DEV);
