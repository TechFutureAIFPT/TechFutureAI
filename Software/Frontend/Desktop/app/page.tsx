import type { Metadata } from "next";
import { LandingEffects } from "@/components/landing/landing-effects";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingIntro } from "@/components/landing/landing-intro";
import { LandingCapabilities } from "@/components/landing/landing-capabilities";
import { LandingProcess } from "@/components/landing/landing-process";
import { LandingComparison } from "@/components/landing/landing-comparison";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "CV Match — Đúng người. Đúng việc. Nhìn thấy lý do.",
  description:
    "CV Match đối chiếu JD với từng hồ sơ, chỉ ra mức độ phù hợp và bằng chứng để ứng viên và nhà tuyển dụng tìm đến nhau đúng chỗ.",
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
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
