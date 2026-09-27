import { MotionProvider } from "@/components/motion/MotionProvider";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { DailySection } from "@/components/sections/DailySection";
import { DiscoverySection } from "@/components/sections/DiscoverySection";
import { EditionSelectorSection } from "@/components/sections/EditionSelectorSection";
import { EditionsSection } from "@/components/sections/EditionsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { SubscriptionTimelineSection } from "@/components/sections/SubscriptionTimelineSection";
import { TimeSection } from "@/components/sections/TimeSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { SkipLink } from "@/components/ui/SkipLink";
import { copy } from "@/lib/content/copy";
import { sectionIds } from "@/lib/content/links";
import { SelectionProvider } from "@/lib/selection/SelectionContext";

export default function Home() {
  return (
    <>
      <JsonLd />
      <SmoothScrollProvider>
        <MotionProvider>
          <SelectionProvider>
            <SkipLink targetId={sectionIds.content}>
              {copy.a11y.skipToContent}
            </SkipLink>
            <ScrollProgress />
            <Header />
            <main id={sectionIds.content} tabIndex={-1}>
              <HeroSection />
              <DailySection />
              <EditionsSection />
              <SubscriptionTimelineSection />
              <TimeSection />
              <EditionSelectorSection />
              <DiscoverySection />
              <PricingSection />
              <FinalCTASection />
              <FAQSection />
            </main>
            <Footer />
          </SelectionProvider>
        </MotionProvider>
      </SmoothScrollProvider>
    </>
  );
}
