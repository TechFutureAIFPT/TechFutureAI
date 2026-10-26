import { redirect } from "next/navigation";
import { sectionHref } from "@/lib/navigation";

export default function MatchWorkflowPage() {
  redirect(sectionHref("match-workflow"));
}
