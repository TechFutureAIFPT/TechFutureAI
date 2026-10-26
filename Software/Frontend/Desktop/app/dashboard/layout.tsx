import { ApplicationShell } from "@/components/dashboard/application-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ApplicationShell>{children}</ApplicationShell>;
}
