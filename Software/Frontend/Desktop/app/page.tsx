import type { Metadata } from "next";
import { LandingCapabilities } from "@/components/landing/landing-capabilities";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingEffects } from "@/components/landing/landing-effects";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingIntro } from "@/components/landing/landing-intro";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingProcess } from "@/components/landing/landing-process";
import { LandingComparison } from "@/components/landing/landing-comparison";

export const metadata: Metadata = {
  title: { absolute: "AI Match | Tuyển dụng & phát triển nghề nghiệp" },
  description:
    "AI Match kết nối các công cụ tuyển dụng, sàng lọc CV và định hướng nghề nghiệp trong một hệ sinh thái với từng công cụ dành cho một nhu cầu riêng.",
};

export default function LandingPage() {
  return (
    <div className="lp">
      <LandingEffects />
      <LandingNav />
      <LandingHero />
      <LandingIntro />
      <LandingCapabilities />
      <LandingProcess />
      <LandingComparison />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
