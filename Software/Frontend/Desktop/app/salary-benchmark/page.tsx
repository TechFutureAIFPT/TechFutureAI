import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sectionHref } from "@/lib/navigation";

export const metadata: Metadata = { title: "Salary Match — Tham khảo mức lương" };
export default function SalaryBenchmarkPage() {
  redirect(sectionHref("salary-benchmark"));
}
