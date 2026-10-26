import Link from "next/link";
import { ProductMark } from "@/components/product-logo";

export function Brand({ href = "/", inverse = false }: { href?: string; inverse?: boolean }) {
  return <Link href={href} className={`brand${inverse ? " brand-inverse" : ""}`} aria-label="AI Match — Trang chủ">
    <ProductMark product="platform" className="brand-mark" decorative />
    <span className="brand-name">AI <span>Match</span><small>Tuyển dụng & phát triển nghề nghiệp</small></span>
  </Link>;
}
