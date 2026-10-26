import type { Metadata } from "next";
import { SalaryBenchmarkSection } from "@/components/dashboard/features/ai-tools";
import { ApplicationShell } from "@/components/dashboard/application-shell";

export const metadata: Metadata = { title: "Salary Match — Tham khảo mức lương" };
export default function SalaryBenchmarkPage() {
  return <ApplicationShell initialSection="salary-benchmark"><SalaryBenchmarkSection /></ApplicationShell>;
}
