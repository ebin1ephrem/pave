// Every email PAVE sends. One function per template; plain wording, no marketing.

export type TemplateName =
  | "invitation"
  | "checkpoint_opened"
  | "reminder"
  | "evidence_requested"
  | "checkpoint_reopened";

export interface Rendered {
  subject: string;
  text: string;
}

type Payload = Record<string, string | null | undefined>;

const CHECKPOINT: Record<string, string> = { benchmark: "Benchmark", midline: "Midline", endline: "Endline" };
const ROLE: Record<string, string> = {
  founder: "a founder",
  manager: "a program manager",
  customer_admin: "an administrator",
};

const cp = (p: Payload) => CHECKPOINT[p.checkpoint ?? ""] ?? "assessment";
const due = (p: Payload) => (p.due_date ? ` It is due on ${p.due_date}.` : "");
const footer = "\n\nPAVE, the Venture Progression Assessment tool by Merstra.";

const TEMPLATES: Record<TemplateName, (p: Payload) => Rendered> = {
  invitation: (p) => ({
    subject: `You have been invited to PAVE${p.context ? `: ${p.context}` : ""}`,
    text:
      `Hello${p.name ? ` ${p.name}` : ""},\n\n` +
      `${p.inviter ?? "Your program"} has added you to PAVE as ${ROLE[p.role ?? ""] ?? "a member"}` +
      `${p.context ? ` for ${p.context}` : ""}.\n\n` +
      `Open this link to sign in. It works once and expires after a short time:\n${p.link}\n\n` +
      `After that, sign in any time at ${p.site}/sign-in with this email address.` +
      footer,
  }),
  checkpoint_opened: (p) => ({
    subject: `${cp(p)} is open for ${p.startup}`,
    text:
      `The ${cp(p)} assessment for ${p.startup} in ${p.program} is now open.${due(p)}\n\n` +
      `It has six steps and saves as you go, so you can fill it in over several sittings. ` +
      `Have your evidence ready: an answer with proof attached counts for more.\n\n` +
      `Start here: ${p.site}/founder/assessment` +
      footer,
  }),
  reminder: (p) => ({
    subject: `${cp(p)} for ${p.startup} is due on ${p.due_date}`,
    text:
      `The ${cp(p)} assessment for ${p.startup} in ${p.program} has not been submitted yet.${due(p)}\n\n` +
      `Continue here: ${p.site}/founder/assessment` +
      footer,
  }),
  evidence_requested: (p) => ({
    subject: `Evidence requested for ${p.startup}`,
    text:
      `Your program manager has asked for evidence for ${p.startup}` +
      `${p.dimension ? ` under ${p.dimension}` : ""}.\n\n` +
      `${p.note ? `Their note: ${p.note}\n\n` : ""}` +
      `Add it here: ${p.site}/founder/assessment` +
      footer,
  }),
  checkpoint_reopened: (p) => ({
    subject: `${cp(p)} for ${p.startup} has been reopened`,
    text:
      `Your program manager has reopened the ${cp(p)} assessment for ${p.startup}, so you can change your answers ` +
      `and evidence.${p.note ? `\n\nTheir note: ${p.note}` : ""}\n\n` +
      `Submit it again when you are done: ${p.site}/founder/assessment` +
      footer,
  }),
};

export function render(template: string, payload: Payload): Rendered | null {
  const make = TEMPLATES[template as TemplateName];
  return make ? make(payload) : null;
}
