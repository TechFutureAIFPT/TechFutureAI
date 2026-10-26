"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSalesOps, type Section } from "@/lib/sales-ops-context";
import { canonicalSection, isSection, navigationItems } from "@/lib/navigation";
import { OverviewSection } from "@/components/dashboard/features/overview";
import { MatchWorkflowSection, WorkspaceSection, HistorySection } from "@/components/dashboard/features/matching";
import { CandidatesSection, PipelineSection, ContactCandidatesSection } from "@/components/dashboard/features/candidates";
import { JobsSection } from "@/components/dashboard/features/jobs";
import { InterviewHubSection, InterviewQuestionsSection, SalaryBenchmarkSection, AIAssistantSection, CareerCompassSection } from "@/components/dashboard/features/ai-tools";
import { ReportsSection } from "@/components/dashboard/features/reports";
import { SettingsSection, CriteriaSettingsSection } from "@/components/dashboard/features/settings";

function DashboardContent() {
  const { activeSection, setActiveSection, authUser, authChecked, setIsAuthModalOpen } = useSalesOps();
  const searchParams = useSearchParams();
  const currentSection = canonicalSection(activeSection);
  const session = authUser?.uid || "preview";
  const [visited, setVisited] = useState<{ session: string; sections: Section[] }>({ session, sections: [currentSection] });

  useEffect(() => {
    if (searchParams.get("auth") === "login" && authChecked && !authUser) setIsAuthModalOpen(true);
  }, [searchParams, authChecked, authUser, setIsAuthModalOpen]);

  useEffect(() => {
    const section = searchParams.get("section");
    setActiveSection(section && isSection(section) ? canonicalSection(section) : "overview");
  }, [searchParams, setActiveSection]);

  useEffect(() => {
    setVisited((previous) => {
      if (previous.session !== session) return { session, sections: [currentSection] };
      if (previous.sections.includes(currentSection)) return previous;
      return { session, sections: [...previous.sections, currentSection] };
    });
    const label = navigationItems.find((item) => item.id === currentSection)?.label || "Không gian làm việc";
    document.title = `${label} | AI Match`;
    window.scrollTo({ top: 0 });
  }, [currentSection, session]);

  const renderSection = (section: Section) => {
    switch (section) {
      case "overview":
        return <OverviewSection />;
      case "workspace":
        return <WorkspaceSection />;
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

  const sections = visited.session === session ? Array.from(new Set([...visited.sections, currentSection])) : [currentSection];
  const immersive = currentSection === "ai-assistant" || currentSection === "career-compass";

  return (
    <div key={session} className={`workspace-pages${immersive ? " workspace-pages-full" : ""}`}>
      {sections.map((section) => {
        const item = navigationItems.find((entry) => entry.id === section);
        const fullHeight = section === "ai-assistant" || section === "career-compass";
        return <section key={section} hidden={section !== currentSection} aria-label={item?.label || "Tổng quan"} data-workspace-section={section} className={fullHeight ? "workspace-page workspace-page-full" : "workspace-page"}>
          {renderSection(section)}
        </section>;
      })}
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
