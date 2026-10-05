"use client";

import { SalesOpsProvider } from "@/lib/sales-ops-context";
import { ChatbotSection } from "@/components/dashboard/features/ai-tools";

export default function ChatbotPage() {
  return (
    <SalesOpsProvider>
      <ChatbotSection />
    </SalesOpsProvider>
  );
}
