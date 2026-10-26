import type { Metadata } from "next";
import { InterviewQuestionsSection } from "@/components/dashboard/features/ai-tools";
import { ApplicationShell } from "@/components/dashboard/application-shell";

export const metadata: Metadata = { title: "Interview Match — Chuẩn bị phỏng vấn" };
export default function InterviewQuestionsPage() {
  return <ApplicationShell initialSection="interview-gen"><InterviewQuestionsSection /></ApplicationShell>;
}
