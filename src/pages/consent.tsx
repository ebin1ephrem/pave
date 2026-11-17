import { useState } from "react";
import { useSession } from "@/auth/session";
import { Brand } from "@/components/shell/brand";
import { Button } from "@/components/ui/button";
import { CONSENT } from "@/content/consent";

/** Shown to a founder once, before anything else, until they accept the data notice. */
export default function Consent() {
  const { acceptConsent, signOut } = useSession();
  const [research, setResearch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAccept = async () => {
    setBusy(true);
    setError(await acceptConsent(research));
    setBusy(false);
  };

  return (
    <main className="min-h-dvh bg-subtle px-5 py-10">
      <div className="mx-auto max-w-[620px]">
        <Brand className="mb-8" />
        <div className="rounded-[12px] border border-line bg-canvas p-6 sm:p-8">
          <h1 className="display-md">{CONSENT.title}</h1>
          <p className="mt-3 text-[15px] text-muted">{CONSENT.intro}</p>
          <dl className="mt-6 grid gap-5">
            {CONSENT.sections.map((s) => (
              <div key={s.heading}>
                <dt className="eyebrow">{s.heading}</dt>
                <dd className="mt-1.5 text-[14.5px] leading-relaxed">{s.body}</dd>
              </div>
            ))}
          </dl>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-[8px] border border-line p-4">
            <input type="checkbox" className="mt-[3px] size-4 shrink-0 accent-[#151515]" checked={research} onChange={(e) => setResearch(e.target.checked)} />
            <span>
              <span className="block text-[14.5px] font-medium">{CONSENT.research.label}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-muted">{CONSENT.research.body}</span>
            </span>
          </label>
          {error ? <p role="alert" className="mt-4 text-[13px] text-danger">{error}</p> : null}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="cursor-pointer text-[13px] text-muted underline-offset-2 hover:text-ink hover:underline" onClick={() => void signOut()}>
              Not now, sign out
            </button>
            <Button onClick={() => void onAccept()} disabled={busy}>{busy ? "Saving…" : CONSENT.accept}</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
