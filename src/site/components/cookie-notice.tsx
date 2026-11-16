import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pending } from "./primitives";

const KEY = "pave.cookie-consent";

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * Consent notice. No analytics are loaded yet; when they are, load them only when
 * localStorage["pave.cookie-consent"] === "accepted".
 */
export function CookieNotice() {
  const [choice, setChoice] = useState<string | null>(read);
  if (choice) return null;

  const decide = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* storage blocked: the notice closes for this page view only */
    }
    setChoice(value);
  };

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[560px] rounded-[12px] border border-line bg-canvas p-4 shadow-[var(--shadow-lifted)] sm:inset-x-6 sm:bottom-6"
    >
      <Pending note="Cookie wording with legal" block>
        <p className="text-[13.5px] leading-relaxed text-ink">
          We use essential cookies to run this site and, with your consent, analytics cookies to improve it.
        </p>
      </Pending>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => decide("accepted")}>
          Accept
        </Button>
        <Button size="sm" variant="secondary" onClick={() => decide("declined")}>
          Decline
        </Button>
      </div>
    </div>
  );
}
