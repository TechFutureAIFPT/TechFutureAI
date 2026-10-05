import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
// CSS gốc của landing page (vanilla-JS) — dùng lại nguyên vẹn để giao diện
// landing khớp 100% bản gốc thay vì diễn giải lại bằng Tailwind.
import "@/styles/legacy/tokens.css";
import "@/styles/legacy/animations.css";
import "@/styles/legacy/landing.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aimatching.com.vn"),
  title: "CV Match - Support HR | Nền Tảng Tuyển Dụng & Đối Chiếu CV Bằng AI",
  description: "Hệ thống tự động hóa phân tích CV, đối chiếu tiêu chí JD, xếp hạng ứng viên và dự báo nhân sự thông minh.",
  icons: {
    icon: "/brand/favicon-32.png",
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "CV Match - Support HR | Nền Tảng Tuyển Dụng & Đối Chiếu CV Bằng AI",
    description: "Hệ thống tự động hóa phân tích CV, đối chiếu tiêu chí JD, xếp hạng ứng viên và dự báo nhân sự thông minh.",
    url: "https://www.aimatching.com.vn",
    siteName: "AIMatching",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="font-sans antialiased bg-white text-slate-900 min-h-screen selection:bg-sky-100 selection:text-sky-800">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
