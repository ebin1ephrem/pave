import { SITE } from "./config";

export interface DemoRequest {
  fullName: string;
  workEmail: string;
  organisation: string;
  role: string;
  orgType: string;
  country: string;
  volume: string;
  message: string;
  consent: boolean;
}

export type DemoErrors = Partial<Record<keyof DemoRequest, string>>;

const REQUIRED = "This field is required.";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field errors, in form order, using the wording from the site copy. */
export function validateDemoRequest(r: DemoRequest): DemoErrors {
  const e: DemoErrors = {};
  if (!r.fullName.trim()) e.fullName = REQUIRED;
  if (!EMAIL.test(r.workEmail.trim())) e.workEmail = "Please enter your work email.";
  if (!r.organisation.trim()) e.organisation = REQUIRED;
  if (!r.role.trim()) e.role = REQUIRED;
  if (!r.orgType) e.orgType = "Please choose an organisation type.";
  if (!r.country.trim()) e.country = REQUIRED;
  if (!r.consent) e.consent = REQUIRED;
  return e;
}

/**
 * Sends the request to VITE_DEMO_ENDPOINT as JSON. Returns true on a 2xx response.
 * With no endpoint configured, development builds simulate success; production builds fail
 * so the visitor sees the error message rather than a false confirmation.
 */
export async function submitDemoRequest(r: DemoRequest): Promise<boolean> {
  if (!SITE.demoEndpoint) {
    if (import.meta.env.DEV) {
      console.info("[demo request] No VITE_DEMO_ENDPOINT set; simulating success.", r);
      await new Promise((res) => setTimeout(res, 400));
      return true;
    }
    return false;
  }
  try {
    const res = await fetch(SITE.demoEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...r, submittedAt: new Date().toISOString() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
