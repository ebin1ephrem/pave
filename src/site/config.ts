/**
 * Every fact on the public site that Merstra still has to confirm or supply.
 *
 * The site copy marks these [CONFIRM] or [TBD]. Each value below is the safe
 * public default: it publishes nothing unconfirmed. In development builds the
 * <Pending> component outlines each one so they are easy to find on the page.
 * Resolve them here, not in the page files.
 */
export const SITE = {
  /** [TBD] Shown wherever the copy says [CONTACT EMAIL]. null hides the email. */
  contactEmail: null as string | null,
  /** [TBD] Partnerships and research inbox. null falls back to contactEmail. */
  partnershipsEmail: null as string | null,

  /** [CONFIRM] Addresses to show. */
  offices: "Kochi, India · Stockholm, Sweden",
  officesConfirmed: false,

  /** [CONFIRM] IPTIF's written permission to be named and to publish the figures. */
  iptifNamed: false,

  /** [CONFIRM] Demo length in minutes. */
  demoMinutes: 30,
  demoMinutesConfirmed: false,

  /** [CONFIRM] Reply time for demo requests. */
  responseTime: "two working days",
  responseTimeConfirmed: false,

  /** [CONFIRM] Pricing model and figures. null renders "On request". */
  pricing: {
    starter: { price: null as string | null, startups: null as string | null, seats: null as string | null, onboarding: null as string | null },
    growth: { price: null as string | null, startups: null as string | null, seats: null as string | null, onboarding: null as string | null },
  },

  /** [CONFIRM] Whether the Emerging Markets Edition launches with v1. */
  showEmergingMarkets: true,
  /** [CONFIRM] Assessment as a service offer and price. */
  showAssessmentService: true,

  /** [TBD] One-page framework overview PDF. null hides the download button. */
  frameworkPdfUrl: null as string | null,

  /** [TBD] Sign-in link validity in minutes. */
  signInLinkMinutes: null as number | null,

  /**
   * Where the demo form posts JSON. Set VITE_DEMO_ENDPOINT at build time.
   * Without it, development builds simulate success and production builds show the error message.
   */
  demoEndpoint: (import.meta.env.VITE_DEMO_ENDPOINT as string | undefined) ?? null,
} as const;

export const contactFor = (kind: "general" | "partnerships") =>
  kind === "partnerships" ? (SITE.partnershipsEmail ?? SITE.contactEmail) : SITE.contactEmail;
