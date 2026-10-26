import React from "react";
import { ChevronDown } from "lucide-react";

const QUESTIONS = [
  {
    question: "CV Match đánh giá hồ sơ dựa trên những gì?",
    answer:
      "Hệ thống đối chiếu nội dung CV với mô tả công việc và bộ tiêu chí recruiter đã thiết lập. Mỗi điểm số đi kèm phần giải thích hoặc dẫn chứng để bạn tự kiểm tra.",
  },
  {
    question: "AI có tự quyết định loại ứng viên không?",
    answer:
      "Không. Kết quả là thông tin tham khảo để hỗ trợ sàng lọc. Recruiter xem hồ sơ, điều chỉnh tiêu chí và quyết định bước tiếp theo.",
  },
  {
    question: "Tôi có thể quản lý ứng viên và vị trí tuyển dụng ở đâu?",
    answer:
      "Sau khi vào workspace, bạn có thể quản lý hồ sơ, vị trí tuyển dụng, tiến trình, lịch phỏng vấn và báo cáo trong thanh điều hướng.",
  },
  {
    question: "Làm sao để bắt đầu?",
    answer:
      "Chọn “Vào workspace”, đăng nhập, rồi mở quy trình CV Match để chọn hoặc tạo mô tả công việc và tải hồ sơ cần đối chiếu.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="lp-section lp-section--faq">
      <div className="lp-container lp-faq">
        <div className="lp-sechead lp-faq__intro">
          <span className="lp-faq__eyebrow">Câu hỏi thường gặp</span>
          <h2>Rõ cách dùng.<br />Chủ động quyết định.</h2>
          <p>Thông tin nhanh để bạn bắt đầu với CV Match.</p>
        </div>
        <div className="lp-faq__list">
          {QUESTIONS.map(({ question, answer }) => (
            <details key={question} className="lp-faq__item">
              <summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
