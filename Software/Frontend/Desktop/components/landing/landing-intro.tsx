"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

const INTRO_TEXT =
  "AI Match gom các công cụ tuyển dụng và định hướng nghề nghiệp vào một hệ sinh thái, " +
  "để bạn chọn đúng công cụ cho từng hành trình.";

const INTRO_HIGHLIGHTS = [
  {
    num: "Cho nhà tuyển dụng",
    title: "Công cụ riêng cho từng nhu cầu",
    text: "Sàng lọc CV, chuẩn bị phỏng vấn, tra cứu lương và khám phá nghề nghiệp có trang riêng.",
  },
  {
    num: "Cho người học và người đi làm",
    title: "Tuyển dụng có căn cứ",
    text: "Nhà tuyển dụng kiểm soát tiêu chí, xem phân tích hồ sơ và tự quyết định.",
  },
  {
    num: "Cùng một hệ sinh thái",
    title: "Định hướng có cơ sở",
    text: "Người dùng bắt đầu từ khảo sát RIASEC rồi tham khảo hướng nghề phù hợp.",
  },
];

export function LandingIntro() {
  const words = INTRO_TEXT.trim().split(/\s+/);

  return (
    <section id="gioi-thieu" className="lp-intro">
      <div className="lp-container lp-intro__inner">
        <div className="lp-intro__main">
          <p className="lp-intro__eyebrow">Tuyển dụng · Phỏng vấn · Phát triển nghề nghiệp</p>
          <p className="lp-intro__text">
            {words.map((word, index) => (
              <span key={index}>
                <span className="lp-intro__word">{word}</span>
                {index < words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
          <a href="#nang-luc" className="lp-btn lp-btn--primary lp-btn--lg">
            <span>Khám phá các công cụ</span>
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
