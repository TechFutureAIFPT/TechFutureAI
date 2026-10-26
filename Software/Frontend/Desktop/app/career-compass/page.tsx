import type { Metadata } from "next";
import { CareerCompassSection } from "@/components/dashboard/features/ai-tools";
import { ApplicationShell } from "@/components/dashboard/application-shell";

export const metadata: Metadata = { title: "Career Match — Định hướng nghề nghiệp" };
export default function CareerCompassPage() {
  return <ApplicationShell fullBleed initialSection="career-compass"><CareerCompassSection /></ApplicationShell>;
}
