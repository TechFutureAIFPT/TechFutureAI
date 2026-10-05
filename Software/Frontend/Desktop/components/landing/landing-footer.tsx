"use client";

import React from "react";

export function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer__inner">
        <div className="lp-footer__main">
          <a href="/" className="lp-brand" aria-label="CV Match — Trang chủ">
            <img src="/brand/cvmatch-icon.png" alt="" />
            <span className="lp-brand__name">CV MATCH</span>
          </a>
          <p className="lp-footer__desc">
            Nền tảng tuyển dụng & đối chiếu hồ sơ ứng viên bằng AI. Chuẩn hóa JD, trích xuất dẫn chứng từng dòng CV, sinh câu hỏi phỏng vấn và tra cứu thị trường lương minh bạch.
          </p>
          <div className="lp-footer__notice">
            <p>
              <strong>Lưu ý:</strong> Mọi điểm số và đánh giá của hệ thống là đề xuất có căn cứ, quyết định tuyển dụng thuộc về nhà tuyển dụng.
            </p>
          </div>
        </div>

        <div className="lp-footer__nav">
          <div className="lp-footer__col">
            <h4 className="lp-footer__coltitle">Sàng lọc & Đối chiếu</h4>
            <ul className="lp-footer__links">
              <li><a href="/dashboard/match-workflow">Quy trình đối chiếu AI</a></li>
              <li><a href="/dashboard?section=workspace">Không gian làm việc</a></li>
              <li><a href="/dashboard?section=criteria-settings">Cấu hình rubric tiêu chí</a></li>
              <li><a href="/dashboard?section=candidates">Kho hồ sơ ứng viên</a></li>
            </ul>
          </div>

          <div className="lp-footer__col">
            <h4 className="lp-footer__coltitle">Công cụ AI & Tiện ích</h4>
            <ul className="lp-footer__links">
              <li><a href="/interview-questions">Bộ câu hỏi phỏng vấn</a></li>
              <li><a href="/salary-benchmark">Tra cứu thị trường lương</a></li>
              <li><a href="/chatbot">Trợ lý AI</a></li>
              <li><a href="/dashboard?section=contact-candidates">Liên hệ ứng viên</a></li>
            </ul>
          </div>

          <div className="lp-footer__col">
            <h4 className="lp-footer__coltitle">Quản trị & Báo cáo</h4>
            <ul className="lp-footer__links">
              <li><a href="/dashboard?section=overview">Tổng quan tuyển dụng</a></li>
              <li><a href="/dashboard?section=history">Lịch sử đợt lọc CV</a></li>
              <li><a href="/dashboard?section=reports">Báo cáo & xuất file</a></li>
              <li><a href="/dashboard?section=settings">Cài đặt hệ thống</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="lp-footer__bottom">
        <div className="lp-container lp-footer__bottominner">
          <p>© {new Date().getFullYear()} CV Match. Dự án AI Tuyển Dụng Thông Minh.</p>
          <div className="lp-footer__bottomlinks">
            <a href="#gioi-thieu">Giới thiệu</a>
            <a href="#nang-luc">Chức năng</a>
            <a href="#lo-trinh">Quy trình</a>
            <a href="#so-sanh">So sánh</a>
            <a href="/dashboard">Vào workspace</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
