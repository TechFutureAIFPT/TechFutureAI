"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useSalesOps, type Section } from "@/lib/sales-ops-context";
import { canonicalSection, isSection, navigationItems, standaloneSectionRoutes } from "@/lib/navigation";

function SectionLoading() {
  return <div role="status" className="p-8 text-sm text-muted-foreground">Đang mở khu vực làm việc…</div>;
}

const OverviewSection = dynamic(() => import("@/components/dashboard/features/overview").then((module) => module.OverviewSection), { loading: SectionLoading });
const MatchWorkflowSection = dynamic(() => import("@/components/dashboard/features/matching").then((module) => module.MatchWorkflowSection), { loading: SectionLoading });
const HistorySection = dynamic(() => import("@/components/dashboard/features/matching").then((module) => module.HistorySection), { loading: SectionLoading });
const CandidatesSection = dynamic(() => import("@/components/dashboard/features/candidates").then((module) => module.CandidatesSection), { loading: SectionLoading });
const PipelineSection = dynamic(() => import("@/components/dashboard/features/candidates").then((module) => module.PipelineSection), { loading: SectionLoading });
const ContactCandidatesSection = dynamic(() => import("@/components/dashboard/features/candidates").then((module) => module.ContactCandidatesSection), { loading: SectionLoading });
const JobsSection = dynamic(() => import("@/components/dashboard/features/jobs").then((module) => module.JobsSection), { loading: SectionLoading });
const InterviewHubSection = dynamic(() => import("@/components/dashboard/features/ai-tools").then((module) => module.InterviewHubSection), { loading: SectionLoading });
const InterviewQuestionsSection = dynamic(() => import("@/components/dashboard/features/ai-tools").then((module) => module.InterviewQuestionsSection), { loading: SectionLoading });
const SalaryBenchmarkSection = dynamic(() => import("@/components/dashboard/features/ai-tools").then((module) => module.SalaryBenchmarkSection), { loading: SectionLoading });
const AIAssistantSection = dynamic(() => import("@/components/dashboard/features/ai-tools").then((module) => module.AIAssistantSection), { loading: SectionLoading });
const CareerCompassSection = dynamic(() => import("@/components/dashboard/features/ai-tools").then((module) => module.CareerCompassSection), { loading: SectionLoading });
const ReportsSection = dynamic(() => import("@/components/dashboard/features/reports").then((module) => module.ReportsSection), { loading: SectionLoading });
const SettingsSection = dynamic(() => import("@/components/dashboard/features/settings").then((module) => module.SettingsSection), { loading: SectionLoading });
const CriteriaSettingsSection = dynamic(() => import("@/components/dashboard/features/settings").then((module) => module.CriteriaSettingsSection), { loading: SectionLoading });

function DashboardContent() {
  const { activeSection, syncActiveSection, authUser, authChecked, setIsAuthModalOpen } = useSalesOps();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSection = canonicalSection(activeSection);

  useEffect(() => {
    if (searchParams.get("auth") === "login" && authChecked && !authUser) setIsAuthModalOpen(true);
  }, [searchParams, authChecked, authUser, setIsAuthModalOpen]);

  useEffect(() => {
    const section = searchParams.get("section");
    const canonical = section && isSection(section) ? canonicalSection(section) : "overview";
    const standalonePath = section ? standaloneSectionRoutes[canonical] : undefined;
    if (standalonePath) {
      router.replace(standalonePath);
      return;
    }
    syncActiveSection(canonical);
  }, [searchParams, syncActiveSection, router]);

  useEffect(() => {
    const label = navigationItems.find((item) => item.id === currentSection)?.label || "Tổng quan";
    document.title = `${label} | AI Match`;
    window.scrollTo({ top: 0 });
  }, [currentSection]);

  const renderSection = (section: Section) => {
    switch (section) {
      case "overview":
        return <OverviewSection />;
      case "match-workflow":
        return <MatchWorkflowSection />;
      case "pipeline":
        return <PipelineSection />;
      case "candidates":
        return <CandidatesSection />;
      case "jobs":
        return <JobsSection />;
      case "contact-candidates":
        return <ContactCandidatesSection />;
      case "ai-assistant":
      case "chatbot":
        return <AIAssistantSection />;
      case "career-compass":
        return <CareerCompassSection />;
      case "interview-hub":
        return <InterviewHubSection />;
      case "interview-gen":
        return <InterviewQuestionsSection />;
      case "salary-benchmark":
        return <><div className="service-note">Dải lương được tổng hợp từ bộ dữ liệu có sẵn và hệ số ước tính theo khu vực, hình thức làm việc. Đây là thông tin tham khảo; bạn nên đối chiếu với dữ liệu tuyển dụng thực tế trước khi lập ngân sách.</div><SalaryBenchmarkSection /></>;
      case "history":
        return <HistorySection />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      case "criteria-settings":
        return <CriteriaSettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  const immersive = currentSection === "ai-assistant" || currentSection === "career-compass";

  return (
    <div className={`workspace-pages${immersive ? " workspace-pages-full" : ""}`}>
      <section key={currentSection} aria-label={navigationItems.find((item) => item.id === currentSection)?.label || "Tổng quan"} data-workspace-section={currentSection} className={immersive ? "workspace-page workspace-page-full" : "workspace-page"}>
        {renderSection(currentSection)}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div role="status" className="p-8 text-sm text-muted-foreground">Đang tải không gian làm việc…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
