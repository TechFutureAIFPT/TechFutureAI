import React from "react";
import { ChevronDown } from "lucide-react";

const QUESTIONS = [
  {
    question: "AI Match có những công cụ nào?",
    answer:
      "AI Match gồm CV Match, Career Match, Insight Match, Interview Match, Salary Match và Talent Match. Mỗi công cụ phục vụ một nhu cầu riêng và có trang truy cập riêng.",
  },
  {
    question: "Điểm đánh giá CV được sử dụng như thế nào?",
    answer:
      "CV Match đối chiếu hồ sơ với mô tả công việc và tiêu chí đã thiết lập. Điểm số cùng dẫn chứng là thông tin tham khảo; nhà tuyển dụng kiểm tra và quyết định bước tiếp theo.",
  },
  {
    question: "Tôi cần làm khảo sát trước khi dùng cố vấn nghề nghiệp không?",
    answer:
      "Có. Career Match yêu cầu hoàn thành khảo sát Holland RIASEC trước khi đưa ra tư vấn định hướng.",
  },
  {
    question: "Làm sao để bắt đầu với AI Match?",
    answer:
      "Chọn công cụ phù hợp trong thanh điều hướng hoặc danh sách trên landing page. Với các tính năng workspace, đăng nhập rồi tiếp tục theo hướng dẫn của từng trang.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="lp-section lp-section--faq">
      <div className="lp-container lp-faq">
        <div className="lp-sechead lp-faq__intro">
          <span className="lp-faq__eyebrow">Câu hỏi thường gặp</span>
          <h2>Chọn đúng công cụ.<br />Bắt đầu đúng hành trình.</h2>
          <p>Thông tin nhanh để bạn bắt đầu với AI Match.</p>
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
