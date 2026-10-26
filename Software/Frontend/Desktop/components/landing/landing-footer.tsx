"use client";

import React from "react";

export function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer__inner">
        <div className="lp-footer__main">
          <a href="/" className="lp-brand" aria-label="AI Match — Trang chủ">
            <img src="/brand/ai-match-suite/ai-match-mark.svg" alt="" />
            <span className="lp-brand__name">AI MATCH</span>
          </a>
          <p className="lp-footer__desc">
            Hệ sinh thái công cụ AI cho tuyển dụng và phát triển nghề nghiệp. Mỗi dịch vụ có trang riêng, giúp bạn bắt đầu đúng nhu cầu.
          </p>
          <div className="lp-footer__notice">
            <p>
              <strong>Lưu ý:</strong> Điểm số và gợi ý AI chỉ để tham khảo. Nhà tuyển dụng và người dùng tự xem xét, lựa chọn bước tiếp theo.
            </p>
          </div>
        </div>

        <div className="lp-footer__nav">
          <div className="lp-footer__col">
            <h4 className="lp-footer__coltitle">Giải pháp</h4>
            <ul className="lp-footer__links">
              <li><a href="/cv-match">CV Match</a></li>
              <li><a href="/career-compass">Career Match</a></li>
              <li><a href="/dashboard">Talent Match</a></li>
            </ul>
          </div>

          <div className="lp-footer__col">
            <h4 className="lp-footer__coltitle">AI & Tiện ích</h4>
            <ul className="lp-footer__links">
              <li><a href="/ai-assistant">Insight Match</a></li>
              <li><a href="/interview-questions">Interview Match</a></li>
              <li><a href="/salary-benchmark">Salary Match</a></li>
            </ul>
          </div>

          <div className="lp-footer__col">
            <h4 className="lp-footer__coltitle">AI Match</h4>
            <ul className="lp-footer__links">
              <li><a href="#gioi-thieu">Giới thiệu</a></li>
              <li><a href="#lo-trinh">Quy trình CV Match</a></li>
              <li><a href="#so-sanh">Tổng quan hệ sinh thái</a></li>
              <li><a href="/dashboard">Vào không gian làm việc</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="lp-footer__bottom">
        <div className="lp-container lp-footer__bottominner">
          <p>© {new Date().getFullYear()} AI Match. Tuyển dụng có cơ sở. Phát triển có định hướng.</p>
          <div className="lp-footer__bottomlinks">
            <a href="#gioi-thieu">Giới thiệu</a>
            <a href="#nang-luc">Công cụ</a>
            <a href="#lo-trinh">Quy trình CV</a>
            <a href="#so-sanh">So sánh</a>
            <a href="/dashboard">Vào workspace</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
