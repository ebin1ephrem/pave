import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHero, Section, usePageMeta } from "@/site/components/primitives";

/**
 * Privacy Policy and Terms of Service are not drafted here: they must be written by a lawyer
 * against the actual data handling (India's DPDP Act and, for European customers, GDPR).
 * This page holds the route until the text is supplied.
 */
export default function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const title = kind === "privacy" ? "Privacy Policy" : "Terms of Service";
  usePageMeta(`${title} — PAVE`, `The ${title} for PAVE, the Venture Progression Assessment tool from Merstra.`);

  return (
    <>
      <PageHero eyebrow="Legal" title={title} />
      <Section>
        <div className="max-w-[62ch]">
          <p className="lede">The {title} for PAVE is being prepared and will be published here before launch.</p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            If you have a question about how PAVE handles data in the meantime, contact the Merstra team.
          </p>
          <Button asChild variant="secondary" className="mt-8">
            <Link to="/demo">Contact us</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
