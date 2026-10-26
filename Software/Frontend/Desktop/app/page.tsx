import type { Metadata } from "next";
import { PlatformHome } from "@/components/landing/platform-home";

export const metadata: Metadata = {
  title: { absolute: "AI Match | Tuyển dụng & phát triển nghề nghiệp" },
  description: "Sàng lọc và chấm điểm CV, quản lý tuyển dụng, trợ lý AI và định hướng nghề nghiệp với AI Match.",
};

export default function LandingPage() {
  return <PlatformHome />;
}
