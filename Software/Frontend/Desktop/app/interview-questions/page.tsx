import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sectionHref } from "@/lib/navigation";

export const metadata: Metadata = { title: "Interview Match — Chuẩn bị phỏng vấn" };
export default function InterviewQuestionsPage() {
  redirect(sectionHref("interview-gen"));
}
