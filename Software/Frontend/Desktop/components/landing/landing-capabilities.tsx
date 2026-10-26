"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { ProductMark } from "@/components/product-logo";
import { productBrands, type ProductId } from "@/lib/brand";

const CAPABILITIES: { product: ProductId; detail: string }[] = [
  { product: "cv", detail: "Đối chiếu CV với JD, tùy chỉnh tiêu chí và xem căn cứ cho từng đánh giá." },
  { product: "career", detail: "Làm khảo sát Holland RIASEC trước khi khám phá nhóm nghề và lộ trình học tập." },
  { product: "insight", detail: "Trao đổi với trợ lý AI về tuyển dụng, mô tả công việc và thông tin tham khảo." },
  { product: "interview", detail: "Chuẩn bị câu hỏi phỏng vấn và tiêu chí đánh giá cho từng vị trí." },
  { product: "salary", detail: "Tra cứu mức lương theo chức danh, khu vực và kinh nghiệm khi dữ liệu có sẵn." },
  { product: "talent", detail: "Quản lý hồ sơ, vị trí tuyển dụng, tiến trình và báo cáo trong workspace." },
];

export function LandingCapabilities() {
  return (
    <section id="nang-luc" className="lp-section lp-section--soft lp-section--capabilities">
      <div className="lp-container lp-caps__inner">
        <div className="lp-caps__head lp-reveal">
          <h2>Một hệ sinh thái. Sáu công cụ riêng.</h2>
          <p className="lp-caps__note">
            Mỗi công cụ giải quyết một nhu cầu cụ thể và mở trên trang riêng. Bạn có thể bắt đầu
            từ đúng hành trình mình cần.
          </p>
        </div>

        <div className="lp-caps__panels">
          <div className="lp-caps">
            <ul className="lp-caps__list">
              {CAPABILITIES.map(({ product, detail }) => {
                const brand = productBrands[product];
                return (
                  <li key={product} className="lp-caps__item">
                    <a href={brand.href} className="lp-cap">
                      <span className="lp-cap__num" aria-hidden="true">
                        <ProductMark product={product} decorative />
                      </span>
                      <span className="lp-cap__body">
                        <h3 className="lp-cap__title">{brand.name}</h3>
                        <p className="lp-cap__text"><strong>{brand.purpose}.</strong> {detail}</p>
                      </span>
                      <span className="lp-cap__go" aria-hidden="true">
                        <ArrowRight size={16} />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
