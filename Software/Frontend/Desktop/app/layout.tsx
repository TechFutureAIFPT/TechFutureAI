import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import "@/styles/legacy/tokens.css";
import "@/styles/platform.css";
import "@/styles/legacy/landing.css";
import "@/styles/platform-home.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aimatching.com.vn"),
  title: { default: "AI Match | Tuyển dụng & phát triển nghề nghiệp", template: "%s | AI Match" },
  description: "Nền tảng sàng lọc và đánh giá CV, quản lý tuyển dụng, trợ lý AI và tư vấn định hướng nghề nghiệp.",
  icons: {
    icon: "/brand/ai-match-suite/ai-match-favicon-32.png",
    apple: "/brand/ai-match-suite/ai-match-apple-touch.png",
  },
  openGraph: {
    title: "AI Match | Tuyển dụng & phát triển nghề nghiệp",
    description: "Kết nối sàng lọc hồ sơ, quản lý tuyển dụng và định hướng nghề nghiệp trong một nền tảng.",
    url: "https://www.aimatching.com.vn",
    siteName: "AI Match",
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
