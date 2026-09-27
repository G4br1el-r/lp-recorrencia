import { Reveal } from "@/components/motion/Reveal";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { copy } from "@/lib/content/copy";
import { faq } from "@/lib/content/faq";
import { sectionIds } from "@/lib/content/links";

export function FAQSection() {
  return (
    <section
      aria-label={copy.faq.title}
      className="section-y relative bg-stage px-[var(--gutter)]"
      id={sectionIds.faq}
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <span className="label">{copy.faq.label}</span>
          <h2 className="font-display mt-4 text-[clamp(2rem,4vw,3.8rem)] text-ink">
            {copy.faq.title}
          </h2>
        </Reveal>
        <Reveal>
          <FaqAccordion items={faq} />
        </Reveal>
      </div>
    </section>
  );
}
