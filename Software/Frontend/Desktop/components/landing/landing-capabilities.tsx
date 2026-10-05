"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

const STANDALONE_ROUTES: Record<string, string> = {
  "match-workflow": "/dashboard/match-workflow",
  chatbot: "/chatbot",
  "salary-benchmark": "/salary-benchmark",
  "interview-gen": "/interview-questions",
};

function hrefFor(section: string) {
  return STANDALONE_ROUTES[section] ?? `/dashboard?section=${section}`;
}

const CAPABILITIES: { section: string; title: string; text: string }[] = [
  {
    section: "workspace",
    title: "Không Gian Làm Việc",
    text: "Điểm khởi đầu cho một đợt sàng lọc: chuẩn hóa JD và bắt đầu quy trình đối chiếu.",
  },
  {
    section: "match-workflow",
    title: "Quy Trình Đối Chiếu AI",
    text: "5 bước từ JD đến bảng xếp hạng: nạp CV, cấu hình trọng số, chấm điểm, xem kết quả.",
  },
  {
    section: "criteria-settings",
    title: "Cấu Hình Rubric Tiêu Chí",
    text: "Chọn tiêu chí nào nặng hơn trước khi hệ thống chấm — không phải hộp đen.",
  },
  {
    section: "candidates",
    title: "Kho Hồ Sơ Ứng Viên",
    text: "Xếp hạng có bằng chứng: điểm số, phân hạng và trích dẫn theo từng tiêu chí.",
  },
  {
    section: "interview-gen",
    title: "Bộ Câu Hỏi Phỏng Vấn",
    text: "Sinh câu hỏi chung, chuyên sâu hoặc so sánh từ khoảng trống của từng hồ sơ.",
  },
  {
    section: "contact-candidates",
    title: "Liên Hệ Ứng Viên",
    text: "Cá nhân hóa mẫu thư và gửi hàng loạt sau khi recruiter xác nhận.",
  },
  {
    section: "chatbot",
    title: "Trợ Lý AI",
    text: "Hỏi đáp tự do về tuyển dụng, nghề nghiệp, CV và JD — lưu lại lịch sử hội thoại.",
  },
  {
    section: "history",
    title: "Lịch Sử Đợt Lọc CV",
    text: "Tra lại tài liệu và kết quả của từng phiên phân tích đã chạy.",
  },
  {
    section: "salary-benchmark",
    title: "Tra Cứu Thị Trường Lương",
    text: "Đối chiếu mức lương đề xuất với dữ liệu thị trường trước khi đàm phán.",
  },
];

export function LandingCapabilities() {
  return (
    <section id="nang-luc" className="lp-section lp-section--soft lp-section--capabilities">
      <div className="lp-container lp-caps__inner">
        <div className="lp-caps__head lp-reveal">
          <h2>Chức năng chính</h2>
          <p className="lp-caps__note">
            Chín chức năng cốt lõi, từ chuẩn hóa JD đến phỏng vấn và liên hệ ứng viên.
          </p>
        </div>

        <div className="lp-caps__panels">
          <div className="lp-caps">
            <ol className="lp-caps__list">
              {CAPABILITIES.map((cap, index) => (
                <li key={cap.section} className="lp-caps__item">
                  <a href={hrefFor(cap.section)} className="lp-cap">
                    <span className="lp-cap__num" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="lp-cap__body">
                      <h3 className="lp-cap__title">{cap.title}</h3>
                      <p className="lp-cap__text">{cap.text}</p>
                    </span>
                    <span className="lp-cap__go" aria-hidden="true">
                      <ArrowRight size={16} />
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
