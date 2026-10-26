"use client";

import React from "react";

const COMPARISON: [string, string, string][] = [
  ["Tuyển dụng", "Hồ sơ, vị trí và kết quả nằm ở nhiều nơi", "CV Match và Talent Match hỗ trợ các bước trong workspace"],
  ["Đánh giá CV", "Khó thống nhất tiêu chí giữa người đánh giá", "Tùy chỉnh rubric và xem dẫn chứng theo hồ sơ"],
  ["Phỏng vấn", "Tự chuẩn bị câu hỏi và tiêu chí từ đầu", "Interview Match hỗ trợ chuẩn bị cho từng vị trí"],
  ["Thông tin lương", "Tìm kiếm và tổng hợp thủ công", "Salary Match tra cứu qua API và nêu nguồn dữ liệu"],
  ["Định hướng nghề nghiệp", "Khó bắt đầu từ sở thích và năng lực cá nhân", "Career Match yêu cầu hoàn thành khảo sát RIASEC trước tư vấn"],
  ["Quyền quyết định", "Khó truy lại căn cứ của kết quả", "AI hỗ trợ phân tích; con người kiểm tra và quyết định"],
];

export function LandingComparison() {
  return (
    <section id="so-sanh" className="lp-section lp-section--soft">
      <div className="lp-container">
        <div className="lp-sechead lp-reveal">
          <h2>Nhiều công cụ. Một hệ sinh thái AI Match.</h2>
          <p>Tuyển dụng và phát triển nghề nghiệp có không gian riêng, cùng một lối vào rõ ràng.</p>
        </div>

        <div className="lp-tablewrap lp-reveal">
          <table className="lp-table">
            <thead>
              <tr>
                <th scope="col">Khía cạnh</th>
                <th scope="col">Sàng lọc thủ công</th>
                <th scope="col" className="lp-table__product-head">
                  Với AI Match
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([aspect, manual, product]) => (
                <tr key={aspect} className="lp-table__row">
                  <th scope="row">{aspect}</th>
                  <td>{manual}</td>
                  <td className="lp-table__ours">{product}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
