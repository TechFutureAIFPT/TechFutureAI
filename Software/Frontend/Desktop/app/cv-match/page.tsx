import type { Metadata } from "next";
import { MatchWorkflowSection } from "@/components/dashboard/features/matching";
import { ApplicationShell } from "@/components/dashboard/application-shell";

export const metadata: Metadata = { title: "CV Match — Đối chiếu hồ sơ tuyển dụng" };

export default function CvMatchPage() {
  return <ApplicationShell initialSection="match-workflow"><MatchWorkflowSection /></ApplicationShell>;
}
