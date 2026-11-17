import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Match — Tuyển dụng & phát triển nghề nghiệp",
    short_name: "AI Match",
    description: "Sàng lọc và đánh giá CV, quản lý tuyển dụng, trợ lý AI và định hướng nghề nghiệp.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f7f9",
    theme_color: "#ffffff",
    lang: "vi",
    icons: [
      { src: "/brand/ai-match-suite/ai-match-apple-touch.png", sizes: "180x180", type: "image/png" },
      { src: "/brand/ai-match-suite/ai-match-mark.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
