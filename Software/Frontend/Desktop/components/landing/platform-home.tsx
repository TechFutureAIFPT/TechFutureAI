"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bot, BriefcaseBusiness, Check, CheckCheck, ChevronDown, Compass, FileCheck2, Files, GitBranch, Globe2, ListFilter, Menu, Search, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { Brand } from "@/components/brand";
import { ProductMark } from "@/components/product-logo";
import { productBrands, serviceProducts } from "@/lib/brand";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const solutions = [
  { product: "cv" as const, ...productBrands.cv, icon: Files, audience: "Dành cho doanh nghiệp" },
  { product: "career" as const, ...productBrands.career, icon: Compass, audience: "Dành cho người phát triển sự nghiệp" },
];
const tools = (["insight", "interview", "salary", "talent"] as const).map((id) => productBrands[id]);
const faqs = [
  { question: "AI Match hỗ trợ những công việc nào?", answer: "Nền tảng kết hợp sàng lọc và chấm điểm CV, quản lý hồ sơ và vị trí tuyển dụng, theo dõi tiến trình, chuẩn bị phỏng vấn, tra cứu mức lương và báo cáo. Bạn cũng có thể sử dụng trợ lý AI nghiên cứu và cố vấn định hướng nghề nghiệp." },
  { question: "Điểm đánh giá CV được sử dụng như thế nào?", answer: "Điểm số giúp bạn tham khảo mức độ phù hợp của hồ sơ với mô tả công việc và bộ tiêu chí đã thiết lập. Hãy xem các phân tích chi tiết và xác minh thông tin với ứng viên trước khi quyết định tuyển dụng." },
  { question: "Công cụ hướng nghiệp dành cho ai?", answer: "Công cụ dành cho người đang chọn ngành học, tìm hiểu nghề nghiệp hoặc xem xét định hướng phát triển. Cố vấn AI và khảo sát sở thích Holland RIASEC cung cấp thông tin tham khảo để bạn cân nhắc lựa chọn phù hợp với hoàn cảnh thực tế." },
  { question: "Tôi bắt đầu sử dụng nền tảng như thế nào?", answer: "Mở không gian làm việc và đăng nhập bằng tài khoản Google hoặc email. Với tuyển dụng, hãy tạo hoặc chọn mô tả công việc, thiết lập tiêu chí và tải CV lên để bắt đầu đánh giá. Các công cụ khác có thể được truy cập trực tiếp từ thanh điều hướng." },
];

function ProductPreview() {
  const [active, setActive] = useState<"matching" | "career" | "assistant">("matching");
  return <div className="product-preview">
    <div className="preview-window-bar"><div className="preview-window-dots"><i /><i /><i /></div><span>Không gian AI Match</span><span className="preview-demo-label">Giao diện minh họa</span></div>
    <div className="preview-tabs" role="tablist" aria-label="Xem trước giải pháp">
      {([{ id: "matching", label: "CV Match", icon: Files }, { id: "career", label: "Career Match", icon: Compass }, { id: "assistant", label: "Insight Match", icon: Bot }] as const).map((tab, index, tabs) => <button key={tab.id} id={`preview-tab-${tab.id}`} role="tab" tabIndex={active === tab.id ? 0 : -1} aria-selected={active === tab.id} aria-controls="product-preview-panel" onClick={() => setActive(tab.id)} onKeyDown={(event) => {
        const nextIndex = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
        if (nextIndex < 0) return;
        event.preventDefault(); setActive(tabs[nextIndex].id); document.getElementById(`preview-tab-${tabs[nextIndex].id}`)?.focus();
      }}><tab.icon size={15} />{tab.label}</button>)}
    </div>
    <div id="product-preview-panel" role="tabpanel" aria-labelledby={`preview-tab-${active}`} className="preview-body">
      {active === "matching" ? <>
        <div className="preview-section-heading"><div><p>Đợt đánh giá hồ sơ</p><h3>Chuyên viên phân tích dữ liệu</h3></div><span className="preview-status"><CheckCheck size={12} />Đã phân tích</span></div>
        <div className="preview-summary"><div><span>Hồ sơ đánh giá</span><strong>12 <small>hồ sơ</small></strong></div><div><span>Đáp ứng tiêu chí</span><strong>05 <small>ứng viên</small></strong></div><div><span>Tiêu chí</span><strong>06 <small>nhóm</small></strong></div></div>
        <div className="preview-table-heading"><span>Ứng viên</span><span>Mức độ phù hợp</span></div>
        {[{ name: "Ứng viên A", detail: "Phân tích dữ liệu · 4 năm kinh nghiệm", score: 92, initials: "A" }, { name: "Ứng viên B", detail: "Business Intelligence · 3 năm kinh nghiệm", score: 86, initials: "B" }, { name: "Ứng viên C", detail: "Phân tích kinh doanh · 2 năm kinh nghiệm", score: 78, initials: "C" }].map((person) => <div className="preview-person" key={person.name}><span className="preview-avatar">{person.initials}</span><div><strong>{person.name}</strong><small>{person.detail}</small></div><span className="preview-score">{person.score}<small>/100</small></span></div>)}
        <div className="preview-evidence"><span><ShieldCheck size={18} /></span><div><strong>Hiểu căn cứ phía sau điểm số</strong><p>Đối chiếu kỹ năng, kinh nghiệm và yêu cầu vị trí.</p></div><Check size={16} /></div>
      </> : active === "career" ? <>
        <div className="preview-section-heading"><div><p>Khám phá tiềm năng của bạn</p><h3>Chọn hướng đi có cơ sở</h3></div><Compass size={25} /></div>
        <div className="preview-chat-message">Tôi thích phân tích số liệu và giải quyết vấn đề. Tôi nên tìm hiểu những nhóm nghề nào?</div>
        <div className="preview-advisor"><span className="preview-avatar"><Compass size={17} /></span><div><strong>Cố vấn nghề nghiệp</strong><p>Bạn có thể bắt đầu từ nhóm nghề phân tích và nghiên cứu. Khảo sát sở thích nghề nghiệp sẽ giúp làm rõ hơn những môi trường làm việc phù hợp.</p></div></div>
        <div className="preview-interest"><span>Nghiên cứu</span><span>Nghiệp vụ</span><span>Quản lý</span></div><Link className="preview-action" href="/career-compass">Khám phá định hướng của bạn<ArrowUpRight size={15} /></Link>
      </> : <>
        <div className="preview-section-heading"><div><p>Trợ lý dành cho đội ngũ nhân sự</p><h3>Thông tin cho quyết định tốt hơn</h3></div><Bot size={25} /></div>
        <div className="preview-chat-message">Giúp tôi xây dựng bộ tiêu chí đánh giá cho vị trí trưởng nhóm kinh doanh.</div><div className="preview-advisor"><span className="preview-avatar"><Bot size={17} /></span><div><strong>Insight Match</strong><p>Hãy bắt đầu với năng lực quản lý đội nhóm, kinh nghiệm bán hàng và kết quả kinh doanh. Bạn có thể điều chỉnh mức ưu tiên theo yêu cầu vị trí.</p></div></div>
        <div className="preview-interest"><span><Globe2 size={13} />Nghiên cứu thông tin</span><span><SlidersHorizontal size={13} />Tiêu chí đánh giá</span></div><Link className="preview-action" href="/ai-assistant">Trao đổi với trợ lý AI<ArrowUpRight size={15} /></Link>
      </>}
    </div>
    <div className="preview-window-footer"><span><span className="preview-dot" />AI hỗ trợ phân tích. Bạn chủ động quyết định.</span><span>AI Match</span></div>
  </div>;
}

export function PlatformHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="platform-home">
    <a className="skip-link" href="#main-content">Chuyển đến nội dung</a>
    <header className="home-header"><div className="home-container home-header-inner"><Brand />
      <nav className="home-nav" aria-label="Điều hướng trang chủ"><a href="#giai-phap">Giải pháp</a><a href="#cong-cu">Công cụ</a><a href="#quy-trinh">Quy trình</a><a href="#cau-hoi">Câu hỏi thường gặp</a></nav>
      <div className="home-header-actions"><Link className="home-login" href="/dashboard?auth=login">Đăng nhập</Link><Link href="/dashboard" className="platform-button platform-button-small">Vào không gian làm việc<ArrowUpRight size={15} /></Link>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}><SheetTrigger asChild><button className="icon-button mobile-only" aria-label="Mở menu"><Menu size={22} /></button></SheetTrigger><SheetContent side="right" className="p-6"><SheetHeader><SheetTitle className="text-left">Khám phá AI Match</SheetTitle></SheetHeader><nav className="home-mobile-nav" aria-label="Điều hướng di động">{[["Giải pháp", "#giai-phap"], ["Công cụ", "#cong-cu"], ["Quy trình", "#quy-trinh"], ["Câu hỏi thường gặp", "#cau-hoi"], ["Không gian làm việc", "/dashboard"]].map(([label, href]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight size={16} /></Link>)}</nav></SheetContent></Sheet>
      </div></div></header>
    <main id="main-content">
      <section className="home-hero"><div className="home-container home-hero-grid"><div className="home-hero-copy">
        <div className="home-product-label"><span />Nền tảng tuyển dụng & phát triển nghề nghiệp</div>
        <h1>Kết nối tuyển dụng.<br />Mở lối nghề nghiệp.</h1>
        <p>Từ đánh giá hồ sơ đến định hướng tương lai. AI Match giúp doanh nghiệp quản lý tuyển dụng và giúp mỗi người hiểu rõ hơn hướng phát triển của mình.</p>
        <div className="home-hero-actions"><Link className="platform-button" href="/dashboard/match-workflow">Bắt đầu sàng lọc CV<ArrowRight size={16} /></Link><Link className="platform-button platform-button-secondary" href="/career-compass">Khám phá hướng nghiệp</Link></div>
        <div className="home-hero-note"><Check size={14} />Tiêu chí rõ ràng<Check size={14} />Quyết định có cơ sở<Check size={14} />Chủ động với AI</div>
      </div><ProductPreview /></div>
      <div className="home-container home-capability-strip"><span>Hệ sinh thái<br />AI Match</span>{serviceProducts.map((product) => <Link href={product.href} key={product.id} className="home-product-link"><ProductMark product={product.id} decorative /><span>{product.name}</span></Link>)}</div></section>
      <section id="giai-phap" className="home-section"><div className="home-container"><div className="home-section-heading"><div><h2>Đúng công cụ.<br />Đúng bước phát triển.</h2></div><p>Một không gian kết nối nhu cầu tuyển dụng của doanh nghiệp với hành trình phát triển nghề nghiệp của mỗi người.</p></div>
        <div className="home-solutions">{solutions.map((solution, index) => <article className={`home-solution home-solution-${index}`} key={solution.href}><span className="home-solution-audience"><solution.icon size={17} />{solution.audience}</span><ProductMark product={solution.product} className="solution-product-mark" decorative /><h3>{solution.name}</h3><span className="home-service-purpose">{solution.purpose}</span><p>{solution.description}</p><ul>{(index === 0 ? ["Tùy chỉnh tiêu chí và trọng số đánh giá", "Phân tích mức độ phù hợp theo từng hồ sơ", "Theo dõi kết quả và xuất báo cáo"] : ["Trao đổi với cố vấn nghề nghiệp AI", "Khám phá sở thích Holland RIASEC", "Tham khảo ngành học và lộ trình phát triển"]).map((text) => <li key={text}><Check size={15} />{text}</li>)}</ul><Link href={solution.href}>{index === 0 ? "Mở công cụ sàng lọc" : "Khám phá hướng nghiệp"}<ArrowUpRight size={18} /></Link><solution.icon className="home-solution-watermark" strokeWidth={.8} aria-hidden="true" /></article>)}</div>
      </div></section>
      <section id="cong-cu" className="home-section home-tools-section"><div className="home-container"><div className="home-section-heading"><div><span className="home-section-kicker">Bộ công cụ AI Match</span><h2>Thêm thông tin.<br />Vững quyết định.</h2></div><p>Chuẩn bị, phân tích và phối hợp công việc trong cùng một nền tảng, từ lúc tiếp nhận hồ sơ đến buổi phỏng vấn.</p></div><div className="home-tools">{tools.map((tool) => <Link href={tool.href} key={tool.href} className="home-tool"><ProductMark product={tool.id} decorative /><h3>{tool.name}</h3><strong className="home-tool-purpose">{tool.purpose}</strong><p>{tool.description}</p><span>Mở công cụ<ArrowUpRight size={15} /></span></Link>)}</div></div></section>
      <section id="quy-trinh" className="home-section"><div className="home-container"><div className="home-section-heading"><div><span className="home-section-kicker">Quy trình đánh giá hồ sơ</span><h2>Từ yêu cầu tuyển dụng<br />đến danh sách phù hợp.</h2></div><Link className="platform-button platform-button-secondary" href="/dashboard/match-workflow">Bắt đầu đánh giá<ArrowRight size={16} /></Link></div><div className="home-process">{[{ icon: BriefcaseBusiness, title: "Xác định yêu cầu", description: "Chọn mô tả công việc, thiết lập tiêu chí và mức độ ưu tiên phù hợp với vị trí." }, { icon: ListFilter, title: "Phân tích hồ sơ", description: "Tải CV và để hệ thống đối chiếu kỹ năng, kinh nghiệm với các yêu cầu đã chọn." }, { icon: FileCheck2, title: "Đánh giá & quyết định", description: "Xem bảng điểm, so sánh hồ sơ và lựa chọn bước tiếp theo cho từng ứng viên." }].map((step, index) => <article key={step.title}><div className="home-process-top"><span>Bước {index + 1}</span><step.icon size={22} strokeWidth={1.5} /></div><h3>{step.title}</h3><p>{step.description}</p></article>)}</div></div></section>
      <section className="home-principles"><div className="home-container home-principles-grid"><ShieldCheck size={42} strokeWidth={1.3} /><div><h2>Công nghệ hỗ trợ.<br />Con người giữ quyền quyết định.</h2><p>Điểm số và gợi ý AI là dữ liệu tham khảo. AI Match giúp bạn hiểu rõ căn cứ đánh giá để đưa ra lựa chọn phù hợp với từng con người và từng vị trí.</p></div><div className="home-principle-list"><span><SlidersHorizontal size={19} />Tiêu chí do bạn kiểm soát</span><span><Search size={19} />Kết quả có phân tích chi tiết</span><span><GitBranch size={19} />Lịch sử đánh giá để đối chiếu</span></div></div></section>
      <section id="cau-hoi" className="home-section"><div className="home-container home-faq-grid"><div><span className="home-section-kicker">Tìm hiểu nền tảng</span><h2>Thông tin bạn<br />có thể cần.</h2><p>Bắt đầu với những điều cần biết về AI Match.</p></div><div>{faqs.map((faq) => <details key={faq.question} className="home-faq"><summary>{faq.question}<ChevronDown size={18} /></summary><p>{faq.answer}</p></details>)}</div></div></section>
      <section className="home-start"><div className="home-container"><div><h2>Sẵn sàng cho bước tiếp theo?</h2><p>Bắt đầu với nhu cầu của bạn. Các công cụ đã ở cùng một nơi.</p></div><Link className="platform-button" href="/dashboard">Mở không gian làm việc<ArrowUpRight size={17} /></Link></div></section>
    </main>
    <footer className="home-footer"><div className="home-container"><div className="home-footer-top"><div><Brand /><p>Nền tảng kết nối tuyển dụng<br />và phát triển nghề nghiệp.</p></div><nav aria-label="Giải pháp"><strong>Giải pháp</strong><Link href="/dashboard/match-workflow">CV Match</Link><Link href="/career-compass">Career Match</Link><Link href="/ai-assistant">Insight Match</Link></nav><nav aria-label="Công cụ hỗ trợ"><strong>Công cụ hỗ trợ</strong><Link href="/interview-questions">Interview Match</Link><Link href="/salary-benchmark">Salary Match</Link><Link href="/dashboard?section=reports">Báo cáo tuyển dụng</Link></nav><nav aria-label="Không gian làm việc"><strong>Không gian làm việc</strong><Link href="/dashboard">Talent Match</Link><Link href="/dashboard?section=candidates">Hồ sơ ứng viên</Link><Link href="/dashboard?section=jobs">Vị trí tuyển dụng</Link></nav></div><div className="home-footer-bottom"><span>© {new Date().getFullYear()} AI Match</span><span>Tuyển dụng có cơ sở. Phát triển có định hướng.</span><Link href="/brand-kit">Bộ nhận diện</Link><a href="#main-content">Về đầu trang<ArrowUpRight size={13} /></a></div></div></footer>
  </div>;
}
