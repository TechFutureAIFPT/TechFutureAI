import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sectionHref } from "@/lib/navigation";

export const metadata: Metadata = { title: "Career Match — Định hướng nghề nghiệp" };
export default function CareerCompassPage() {
  redirect(sectionHref("career-compass"));
}
