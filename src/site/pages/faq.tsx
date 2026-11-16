import { Plus } from "lucide-react";
import { type FaqItem, visibleFaq } from "@/site/content";
import { PageHero, Pending, Section, usePageMeta } from "@/site/components/primitives";

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => {
        const answer = <p className="max-w-[64ch] pb-6 text-[15px] leading-relaxed text-muted">{item.a}</p>;
        return (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[16.5px] font-medium tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus
                className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-45"
                aria-hidden="true"
              />
            </summary>
            {item.pending ? (
              <Pending note={item.pending} block>
                {answer}
              </Pending>
            ) : (
              answer
            )}
          </details>
        );
      })}
    </div>
  );
}

export default function Faq() {
  usePageMeta(
    "PAVE FAQ — questions from startup programs",
    "Answers to common questions about PAVE: who fills in the assessment, what counts as evidence, how scores change and who can see the data.",
  );
  return (
    <>
      <PageHero eyebrow="FAQ" title="Questions programs ask." />
      <Section>
        <div className="max-w-[860px]">
          <FaqList items={visibleFaq()} />
        </div>
      </Section>
    </>
  );
}
