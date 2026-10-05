"use client";

/**
 * Header/nav đầy đủ của landing — cổng từ assets/js/components/landing-nav.js
 * (mega-menu 3 cụm, click ngoài đóng, Escape đóng, drawer mobile).
 *
 * Nội dung 3 cụm đổi khác bản gốc: bản cũ chia theo đối tượng (Ứng viên/Doanh
 * nghiệp) vì sản phẩm cũ có trang tự phục vụ riêng cho cả hai phía
 * (/quick-score, /for-candidates…). Dashboard mới chỉ phục vụ recruiter (không
 * còn trang tự phục vụ cho ứng viên), nên 3 cụm đổi sang chia theo nhóm việc —
 * khớp đúng 3 nhóm điều hướng thật trong `components/dashboard/sidebar.tsx`
 * (Sàng lọc & Đối chiếu / Công cụ AI & Tiện ích / Quản trị & Báo cáo) — giữ
 * nguyên cấu trúc mega-menu (2 cột + khối ngữ cảnh + dải liên kết phụ), chỉ
 * đổi nhãn và đích cho khớp sản phẩm hiện có, không trỏ tới trang không tồn tại.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ArrowRight, Menu, X } from "lucide-react";

interface MenuColumn {
  caption: string;
  items: [string, string, string][]; // [label, desc, href]
}
interface MenuFeature {
  caption: string;
  title: string;
  text: string;
  cta?: [string, string];
}
interface Menu {
  id: string;
  label: string;
  columns: [MenuColumn, MenuColumn];
  feature: MenuFeature;
  foot?: [string, string][];
}

const MENUS: Menu[] = [
  {
    id: "sang-loc",
    label: "Sàng lọc & Đối chiếu",
    columns: [
      {
        caption: "Dựng phiên sàng lọc",
        items: [
          ["Không gian làm việc", "Điểm khởi đầu cho một đợt sàng lọc", "/dashboard?section=workspace"],
          ["Quy trình đối chiếu AI", "5 bước từ JD đến bảng xếp hạng", "/dashboard/match-workflow"],
          ["Cấu hình rubric tiêu chí", "Chọn tiêu chí nào nặng hơn trước khi chấm", "/dashboard?section=criteria-settings"],
        ],
      },
      {
        caption: "Đọc kết quả",
        items: [
          ["Kho hồ sơ ứng viên", "Điểm số, phân hạng và trích dẫn từng tiêu chí", "/dashboard?section=candidates"],
          ["Vị trí tuyển dụng (JD)", "Quản lý các JD đang mở", "/dashboard?section=jobs"],
          ["Lịch sử đợt lọc CV", "Tra lại kết quả các phiên đã chạy", "/dashboard?section=history"],
        ],
      },
    ],
    feature: {
      caption: "Trọng số do bạn đặt",
      title: "Rubric không phải hộp đen",
      text: "Bạn quyết định tiêu chí nào nặng hơn trước khi hệ thống chấm, và xem được căn cứ sau mỗi điểm số.",
      cta: ["Bắt đầu đối chiếu", "/dashboard/match-workflow"],
    },
    foot: [["Tổng quan tuyển dụng", "/dashboard?section=overview"], ["So sánh cách làm", "/#so-sanh"]],
  },
  {
    id: "chuc-nang",
    label: "Chức năng",
    columns: [
      {
        caption: "Trợ lý & Cố vấn thông minh",
        items: [
          ["Trợ lý AI Tuyển dụng", "Đàm thoại phân tích JD, lọc CV & Deep Research (Port 8080)", "/ai-assistant"],
          ["Chatbot Định hướng Nghề nghiệp", "Cố vấn DeepSeek Reasoner & Khảo sát Holland RIASEC (Port 8001)", "/career-compass"],
          ["Bộ câu hỏi phỏng vấn", "Sinh câu hỏi chung, chuyên sâu hoặc so sánh", "/interview-questions"],
        ],
      },
      {
        caption: "Công cụ & Tiện ích",
        items: [
          ["Tra cứu thị trường lương", "Đối chiếu mức lương đề xuất với thị trường", "/salary-benchmark"],
          ["Lịch PV & hộp thư email", "Quản lý lịch phỏng vấn và email trao đổi", "/dashboard?section=interview-hub"],
          ["Liên hệ ứng viên", "Cá nhân hóa mẫu thư, gửi hàng loạt", "/dashboard?section=contact-candidates"],
        ],
      },
    ],
    feature: {
      caption: "Hệ thống AI chuyên biệt",
      title: "Trợ Lý AI & Cố Vấn Nghề Nghiệp",
      text: "Hai phân hệ AI độc lập: Hỗ trợ Recruiter tối ưu hóa tuyển dụng và Cố vấn ứng viên chọn đúng ngành nghề theo chuẩn RIASEC.",
      cta: ["Khám phá Cố vấn Nghề nghiệp", "/career-compass"],
    },
    foot: [
      ["Trợ lý AI Tuyển dụng (Port 8080)", "/ai-assistant"],
      ["Chatbot Định hướng Nghề nghiệp (Port 8001)", "/career-compass"],
    ],
  },
  {
    id: "quan-tri",
    label: "Quản trị & Báo cáo",
    columns: [
      {
        caption: "Tổng quan",
        items: [
          ["Tổng quan tuyển dụng", "Bức tranh chung của cả đội tuyển dụng", "/dashboard?section=overview"],
          ["Báo cáo & xuất file", "Xuất báo cáo phiên lọc ra CSV", "/dashboard?section=reports"],
        ],
      },
      {
        caption: "Cấu hình",
        items: [
          ["Cài đặt", "Hồ sơ, tài khoản và tuỳ chọn hệ thống", "/dashboard?section=settings"],
          ["Cấu hình rubric tiêu chí", "Đặt trọng số mặc định cho mọi đợt lọc", "/dashboard?section=criteria-settings"],
        ],
      },
    ],
    feature: {
      caption: "Nguyên tắc",
      title: "AI đề xuất, con người quyết định",
      text: "Mọi điểm số đều kèm dẫn chứng trích từ hồ sơ. Hệ thống không tự loại ứng viên thay bạn.",
    },
  },
];

const DIRECT_LINKS: [string, string][] = [
  ["Năng lực cốt lõi", "/#nang-luc"],
  ["Quy trình", "/#lo-trinh"],
  ["Tính hiệu quả", "/#tinh-hieu-qua"],
  ["So sánh", "/#so-sanh"],
  ["FAQ", "/#faq"],
];

function MegaColumn({ column }: { column: MenuColumn }) {
  return (
    <section className="lp-mega__col">
      <h3 className="lp-mega__caption">{column.caption}</h3>
      <ul className="lp-mega__list">
        {column.items.map(([label, desc, href]) => (
          <li key={href}>
            <a href={href} className="lp-mega__link">
              <strong>{label}</strong>
              <small>{desc}</small>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MegaFeature({ feature }: { feature: MenuFeature }) {
  return (
    <aside className="lp-mega__aside">
      <span className="lp-mega__caption">{feature.caption}</span>
      <p className="lp-mega__asidetitle">{feature.title}</p>
      <p className="lp-mega__asidetext">{feature.text}</p>
      {feature.cta && (
        <a href={feature.cta[1]} className="lp-mega__cta">
          <span>{feature.cta[0]}</span>
          <ArrowRight size={15} />
        </a>
      )}
    </aside>
  );
}

export function LandingNav() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Header trong suốt khi còn chồng lên hero (nền hero tự lo màu/ảnh nền),
  // chuyển sang nền navy đặc khi cuộn qua khỏi hero — cổng từ landing-nav.js
  // `watchHero()`. Thiếu bước này thì header luôn đặc, tạo đường ranh giới rõ
  // với phần trên cùng của hero (ảnh + gradient chưa đạt navy đặc 100%).
  const [isOverHero, setIsOverHero] = useState(true);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!openId) return;
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenId(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (openId) setOpenId(null);
      else setMobileOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [openId]);

  useEffect(() => {
    const hero = document.querySelector(".lp-hero");
    if (!hero || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => setIsOverHero(entry.isIntersecting)),
      { rootMargin: "-76px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <header className={`lp-header${isOverHero ? " is-over-hero" : ""}`}>
      <div className="lp-container lp-header__inner">
        <a href="/" className="lp-brand" aria-label="CV Match — Trang chủ">
          <img src="/brand/cvmatch-icon.png" alt="" />
          <span className="lp-brand__name">CV MATCH</span>
        </a>

        <nav
          className={`lp-nav${mobileOpen ? " is-open" : ""}`}
          id="lp-navigation"
          aria-label="Điều hướng trang giới thiệu"
          ref={navRef}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
          }}
        >
          {MENUS.map((menu) => (
            <div key={menu.id} className={`lp-nav__item${openId === menu.id ? " is-open" : ""}`}>
              <button
                type="button"
                className="lp-nav__trigger"
                aria-expanded={openId === menu.id}
                aria-controls={`lp-mega-${menu.id}`}
                onClick={() => setOpenId((prev) => (prev === menu.id ? null : menu.id))}
              >
                <span>{menu.label}</span>
                <ChevronDown size={15} className="lp-nav__chev" />
              </button>
            </div>
          ))}
          {DIRECT_LINKS.map(([label, href]) => (
            <a key={href} href={href} className="lp-nav__plain">
              {label}
            </a>
          ))}
          <a href="/dashboard" className="lp-nav__auth">
            Vào workspace
          </a>

          {MENUS.map((menu) => (
            <div key={menu.id} id={`lp-mega-${menu.id}`} className={`lp-mega${openId === menu.id ? " is-open" : ""}`}>
              <div className="lp-container lp-mega__wrap">
                <div className="lp-mega__inner">
                  <div className="lp-mega__cols">
                    <MegaColumn column={menu.columns[0]} />
                    <MegaColumn column={menu.columns[1]} />
                  </div>
                  <MegaFeature feature={menu.feature} />
                </div>
                {menu.foot && (
                  <div className="lp-mega__foot">
                    {menu.foot.map(([label, href]) => (
                      <a key={href} href={href} className="lp-mega__footlink">
                        {label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </nav>

        <div className="lp-header__actions">
          <a href="/dashboard" className="lp-btn lp-btn--primary">
            Vào workspace
          </a>
        </div>

        <button
          type="button"
          className="lp-menu"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-controls="lp-navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
