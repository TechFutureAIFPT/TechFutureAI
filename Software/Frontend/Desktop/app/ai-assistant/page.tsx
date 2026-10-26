import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sectionHref } from "@/lib/navigation";

export const metadata: Metadata = { title: "Insight Match — Trợ lý AI" };
export default function AIAssistantPage() {
  redirect(sectionHref("ai-assistant"));
}
