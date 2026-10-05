"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

const INTRO_TEXT =
  "CV Match đối chiếu JD với từng hồ sơ, chỉ rõ ứng viên khớp ở đâu, " +
  "thiếu ở đâu, kèm bằng chứng.";

const INTRO_HIGHLIGHTS = [
  {
    num: "01",
    title: "Cấu hình trọng số",
    text: "Recruiter tùy chỉnh tiêu chí và xác nhận điều kiện loại trước khi chấm.",
  },
  {
    num: "02",
    title: "Dẫn chứng minh bạch",
    text: "Trích xuất bằng chứng trực tiếp từ CV cho từng điểm số phù hợp.",
  },
  {
    num: "03",
    title: "Quyết định có căn cứ",
    text: "Sinh bộ câu hỏi phỏng vấn và chủ động duyệt email trước khi gửi.",
  },
];

export function LandingIntro() {
  const words = INTRO_TEXT.trim().split(/\s+/);

  return (
    <section id="gioi-thieu" className="lp-intro">
      <div className="lp-container lp-intro__inner">
        <div className="lp-intro__main">
          <p className="lp-intro__eyebrow">Đối chiếu JD · Chấm điểm CV · Bằng chứng</p>
          <p className="lp-intro__text">
            {words.map((word, index) => (
              <span key={index}>
                <span className="lp-intro__word">{word}</span>
                {index < words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
          <a href="/dashboard/match-workflow" className="lp-btn lp-btn--primary lp-btn--lg">
            <span>Thử một lượt đối chiếu</span>
            <ArrowRight size={18} />
          </a>
        </div>

        <div className="lp-intro__features">
          {INTRO_HIGHLIGHTS.map((item) => (
            <div key={item.title} className="lp-intro__card">
              <div className="lp-intro__card-body">
                <span className="font-mono text-xs font-bold text-sky-600 block mb-1">
                  {item.num}
                </span>
                <h3 className="lp-intro__card-title">{item.title}</h3>
                <p className="lp-intro__card-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
