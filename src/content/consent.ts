/**
 * The data notice founders accept at first sign-in.
 *
 * MERSTRA TO CONFIRM every statement here before real founders are invited: these describe how
 * the product behaves today, but retention and research use are policy decisions, not code.
 * Changing the wording? Bump CONSENT_VERSION in src/auth/session.tsx so founders are asked again.
 */
export const CONSENT = {
  title: "Before you start",
  intro: "PAVE records where your venture stands and the evidence behind it. Here is what that means for your data.",
  sections: [
    {
      heading: "What is collected",
      body: "Your answers to the assessment questions, any detail you write, the files and links you attach as evidence, and your name and email address.",
    },
    {
      heading: "Who sees it",
      body: "The managers and administrators of the program you are enrolled in, your co-founders on the same startup, and Merstra staff who run the platform. Other startups and other organisations cannot see it.",
    },
    {
      heading: "How long it is kept",
      body: "Until you or your program ask for it to be deleted. You can ask your program manager for a copy of everything held about your startup, or for it to be deleted.",
    },
  ],
  research: {
    label: "Allow anonymised research use",
    body: "Merstra may study patterns across many ventures to improve the framework. If you agree, your scores are included with your startup's name, your name and your evidence removed. This is optional and does not affect your assessment.",
  },
  accept: "I understand, continue",
};
