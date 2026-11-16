/**
 * Pairs of answers that cannot both be true. When both are given, neither is counted.
 * Each side names a question and the options that trigger the rule.
 */
export interface ContradictionRule {
  id: string;
  a: { question: string; options: string[] };
  b: { question: string; options: string[] };
  message: string;
}

export const CONTRADICTIONS: ContradictionRule[] = [
  {
    id: "paying_without_sales",
    a: { question: "cus.paying_customers", options: ["first_one", "a_few_same_route", "several_or_more"] },
    b: { question: "biz.test_sales", options: ["none"] },
    message: "Paying customers are reported under Customer, but no paid or committed sales under Business Model.",
  },
  {
    id: "price_paid_without_sales",
    a: { question: "biz.price_tested", options: ["paid_or_committed"] },
    b: { question: "biz.test_sales", options: ["none"] },
    message: "Customers are said to have paid at the stated price, but no pilot or test sale is reported.",
  },
  {
    id: "signed_without_agreement",
    a: { question: "cus.signed_commitment", options: ["signed"] },
    b: { question: "cus.success_measures", options: ["no_agreement"] },
    message: "A signed customer commitment is reported, and also that no signed agreement exists.",
  },
  {
    id: "pattern_without_conversations",
    a: { question: "cus.conversations", options: ["none"] },
    b: { question: "cus.pattern", options: ["answers_vary", "pattern_emerging", "pattern_logged"] },
    message: "No customer conversations are reported, but interview findings are described.",
  },
  {
    id: "tests_without_build",
    a: { question: "prd.what_exists", options: ["described_only", "written_plan"] },
    b: { question: "prd.testing_done", options: ["measured", "retested"] },
    message: "Nothing is reported as built, but measured tests of a build are described.",
  },
  {
    id: "customer_use_without_leaving_lab",
    a: { question: "prd.what_exists", options: ["works_at_customer", "commercial_volume"] },
    b: { question: "prd.environment", options: ["desk_only", "own_lab"] },
    message: "The product is said to work at the customer, but to have been shown only in the team's own setting.",
  },
  {
    id: "protection_without_preparation",
    a: { question: "mot.formal_protection", options: ["first_in_place", "extended", "issued"] },
    b: { question: "mot.preparation", options: ["not_started"] },
    message: "Formal protection is reported as in place, and also that preparing protection has not started.",
  },
  {
    id: "leadership_with_one_founder",
    a: { question: "tea.core_team", options: ["one_founder", "in_talks"] },
    b: { question: "tea.leadership", options: ["some_areas", "leadership_team"] },
    message: "The venture is described as one founder, and also as run by people beyond the founder.",
  },
  {
    id: "funds_without_runway_view",
    a: { question: "cap.commitments", options: ["funds_received", "several_sources"] },
    b: { question: "cap.runway_view", options: ["no_view"] },
    message: "Funds are reported as received, but with no view of how much money is needed or how long it lasts.",
  },
];
