import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Download } from "lucide-react";
import { Brand } from "@/components/brand";
import { ProductIdentity } from "@/components/product-logo";
import { productAsset, productBrands, productLogoConcepts, serviceProducts } from "@/lib/brand";

export const metadata: Metadata = { title: "Bộ nhận diện thương hiệu" };

export default function BrandKitPage() {
  return <div className="brand-kit">
    <header className="home-header"><div className="home-container home-header-inner"><Brand /><Link href="/" className="brand-back"><ArrowLeft size={15} />Trang chủ</Link></div></header>
    <main className="home-container brand-kit-content">
      <div className="brand-kit-heading"><div><p>Nhận diện hệ sinh thái</p><h1>AI Match & các dịch vụ</h1><span>Năm dịch vụ, năm biểu tượng riêng. Cùng kế thừa ngôn ngữ hình học và các mặt gấp xanh–indigo của CV Match.</span></div><a className="platform-button" href="/brand/ai-match-suite/services-v2/ai-match-services-v2.zip" download><Download size={16} />Tải bộ logo SVG & PNG</a></div>
      <figure className="brand-overview"><img src="/brand/ai-match-suite/services-v2/service-brand-board.svg" alt="CV Match gốc và năm logo riêng: la bàn Career Match, lăng kính Insight Match, hội thoại Interview Match, tăng trưởng Salary Match, đội ngũ Talent Match" width={1600} height={1240} /><figcaption>Giữ nguyên logo CV Match. Năm dịch vụ còn lại có hình dáng đặc trưng theo chức năng, liên kết bằng các mặt gấp và bảng màu chung.</figcaption></figure>
      <section className="master-brand-panel" aria-labelledby="master-brand-title"><div><h2 id="master-brand-title">Thương hiệu nền tảng</h2><p>AI Match dùng cho website, tài khoản và toàn bộ hệ sinh thái. CV Match dùng riêng cho dịch vụ sàng lọc và chấm điểm hồ sơ.</p><div className="brand-asset-links"><a href={productAsset("platform", "logo")} download>SVG logo<Download size={14} /></a><a href={productAsset("platform", "logo", "png")} download>PNG trong suốt<Download size={14} /></a><a href={productAsset("platform", "mark")} download>Biểu tượng<Download size={14} /></a></div></div><div className="master-brand-samples"><div><img src={productAsset("platform", "logo")} alt="Logo AI Match trên nền sáng" width={440} height={112} /></div><div className="inverse-sample"><img src={productAsset("platform", "logo-dark")} alt="Logo AI Match dành cho nền tối" width={440} height={112} /></div></div></section>
      <section aria-labelledby="service-brand-title"><h2 id="service-brand-title" className="brand-section-title">Nhận diện từng dịch vụ</h2><div className="brand-service-grid">{serviceProducts.map((product) => <article className="brand-service-card" key={product.id}><ProductIdentity product={product.id} /><div className="brand-logo-concept">{productLogoConcepts[product.id]}</div><p>{product.description}</p><div className="brand-asset-links"><a href={productAsset(product.id, "logo")} download>SVG<Download size={13} /></a><a href={productAsset(product.id, "logo", "png")} download>PNG<Download size={13} /></a><a href={productAsset(product.id, "mark")} download>Biểu tượng<Download size={13} /></a><a href={productAsset(product.id, "logo-dark")} download>Nền tối<Download size={13} /></a></div><Link className="brand-service-open" href={product.href}>Mở {product.name}<ArrowUpRight size={14} /></Link></article>)}</div></section>
      <section className="brand-usage"><h2>Quy tắc sử dụng</h2><div><p><strong>Giữ nguyên tỷ lệ.</strong> Dùng bản SVG cho website và bản PNG trong suốt khi cần ảnh. Giữ khoảng trống quanh biểu tượng bằng ít nhất ¼ chiều cao của logo.</p><p><strong>Chọn đúng nền.</strong> Bản logo thông thường dành cho nền sáng; bản có hậu tố “logo-dark” dùng trên nền tối. Không thêm viền, hiệu ứng hoặc đổi màu các mặt khối.</p><p><strong>Phân biệt nền tảng và dịch vụ.</strong> Viết đúng “{productBrands.platform.name}”, “CV Match”, “Career Match”, “Insight Match”, “Interview Match”, “Salary Match” và “Talent Match”.</p></div></section>
    </main>
    <footer className="brand-kit-footer">AI Match · Tuyển dụng có cơ sở. Phát triển có định hướng.</footer>
  </div>;
}
