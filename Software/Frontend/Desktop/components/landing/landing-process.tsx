"use client";

import React from "react";
import { FileText, Sliders, UploadCloud, Target, Sparkles, Mail, type LucideIcon } from "lucide-react";

const ROUTE_PATH =
  "M 100 130 C 200 130 200 230 300 230 S 400 130 500 130 S 600 230 700 230 S 800 130 900 130 S 1000 230 1100 230";

const PROCESS: { phase: string; icon: LucideIcon; stage: string; title: string; text: string }[] = [
  { phase: "01", icon: FileText, stage: "Yêu cầu", title: "Chuẩn hóa JD", text: "Cấu trúc mô tả công việc và trích xuất điều kiện bắt buộc." },
  { phase: "02", icon: Sliders, stage: "Kiểm soát", title: "Cài đặt trọng số", text: "Chọn rubric, điều chỉnh tiêu chí về tổng 100% và xác nhận trước khi chấm." },
  { phase: "03", icon: UploadCloud, stage: "Dữ liệu", title: "Nạp và đọc CV", text: "Nhận tối đa 20 CV từ máy hoặc Google Drive và trích xuất nội dung." },
  { phase: "04", icon: Target, stage: "Đối chiếu", title: "Phân tích và xếp hạng", text: "Lọc điều kiện bắt buộc, chấm theo trọng số và trả về dẫn chứng." },
  { phase: "05", icon: Sparkles, stage: "Chuẩn bị", title: "Sinh câu hỏi phỏng vấn", text: "Tạo câu hỏi chung, chuyên sâu hoặc so sánh từ kết quả đã phân tích." },
  { phase: "06", icon: Mail, stage: "Liên hệ", title: "Gửi email ứng viên", text: "Cá nhân hóa thư, xem trước người nhận và gửi qua Gmail sau khi xác nhận." },
];

function sectionHead(title: string, note: string) {
  return (
    <div className="lp-sechead lp-reveal">
      <h2>{title}</h2>
      <p>{note}</p>
    </div>
  );
}

export function LandingProcess() {
  return (
    <section id="lo-trinh" className="lp-section lp-section--process">
      <div className="lp-container">
        {sectionHead(
          "Quy trình lọc CV",
          "Sáu bước từ JD đến liên hệ ứng viên; recruiter xác nhận trước mọi hành động gửi đi."
        )}

        <ol className="lp-road lp-road--timeline">
          <svg className="lp-road__map" viewBox="0 0 1200 360" preserveAspectRatio="none" focusable="false" aria-hidden="true">
            <path className="lp-road__track" d={ROUTE_PATH} pathLength={1000} vectorEffect="non-scaling-stroke" />
            <path className="lp-road__lane" d={ROUTE_PATH} pathLength={1000} vectorEffect="non-scaling-stroke" />
            <path className="lp-road__flow" d={ROUTE_PATH} pathLength={1000} vectorEffect="non-scaling-stroke" />
            <path className="lp-road__runner" d={ROUTE_PATH} pathLength={1000} vectorEffect="non-scaling-stroke" />
          </svg>

          {PROCESS.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={item.phase}
                className="lp-road__item lp-reveal"
                data-step={index + 1}
                style={{ ["--lp-order" as string]: index + 1 }}
              >
                <div className="lp-road__pin">
                  <Icon size={22} />
                  <span className="lp-road__pin-num">{item.phase}</span>
                </div>
                <span className="lp-road__connector" aria-hidden="true" />
                <div className="lp-road__card">
                  <div className="lp-road__head">
                    <span className="lp-road__phase">Bước {item.phase}</span>
                    <span className="lp-road__stage">{item.stage}</span>
                  </div>
                  <h3 className="lp-road__title">{item.title}</h3>
                  <p className="lp-road__text">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
