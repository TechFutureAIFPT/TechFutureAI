"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSalesOps, type Section } from "@/lib/sales-ops-context";
import { OverviewSection } from "@/components/dashboard/features/overview";
import { WorkspaceSection, HistorySection } from "@/components/dashboard/features/matching";
import { CandidatesSection, PipelineSection, ContactCandidatesSection } from "@/components/dashboard/features/candidates";
import { JobsSection } from "@/components/dashboard/features/jobs";
import { InterviewHubSection, AIAssistantSection, CareerCompassSection } from "@/components/dashboard/features/ai-tools";
import { ReportsSection } from "@/components/dashboard/features/reports";
import { SettingsSection, CriteriaSettingsSection } from "@/components/dashboard/features/settings";

/**
 * match-workflow giờ là route riêng trong khung dashboard (/dashboard/match-workflow).
 * chatbot, salary-benchmark và interview-gen đã tách hẳn khỏi khung dashboard,
 * là route gốc riêng (/chatbot, /salary-benchmark, /interview-questions — xem
 * app/chatbot, app/salary-benchmark, app/interview-questions) — không còn xử
 * lý ở đây. quick-score trỏ chung component với match-workflow nên cũng điều
 * hướng thẳng sang route đó.
 */
function DashboardContent() {
  const { activeSection, setActiveSection } = useSalesOps();
  const searchParams = useSearchParams();

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) setActiveSection(section as Section);
  }, [searchParams, setActiveSection]);

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection />;
      case "workspace":
        return <WorkspaceSection />;
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

  return (
    <div key={activeSection} className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
      {renderSection()}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
