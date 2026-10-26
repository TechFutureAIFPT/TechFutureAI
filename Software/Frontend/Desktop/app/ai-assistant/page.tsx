import type { Metadata } from "next";
import { AIAssistantSection } from "@/components/dashboard/features/ai-tools";
import { ApplicationShell } from "@/components/dashboard/application-shell";

export const metadata: Metadata = { title: "Insight Match — Trợ lý AI" };
export default function AIAssistantPage() {
  return <ApplicationShell fullBleed initialSection="ai-assistant"><AIAssistantSection /></ApplicationShell>;
}
