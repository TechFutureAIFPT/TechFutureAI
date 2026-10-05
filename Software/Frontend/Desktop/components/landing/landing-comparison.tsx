"use client";

import React from "react";

const COMPARISON: [string, string, string][] = [
  ["Tiêu chí đánh giá", "Mỗi người một cách hiểu", "Một bộ trọng số áp dụng cho mọi hồ sơ"],
  ["Bằng chứng", "Ghi chú rời rạc", "Dẫn chứng trích thẳng từ CV, gắn với từng tiêu chí"],
  ["So sánh ứng viên", "Mở lần lượt từng tệp", "Bảng xếp hạng kèm điểm và phân hạng A/B/C"],
  ["Điều kiện bắt buộc", "Dễ bỏ sót khi đọc nhanh", "Lọc trước khi chấm và nêu rõ lý do loại"],
  ["Chuẩn bị phỏng vấn", "Tự soạn câu hỏi cho từng hồ sơ", "Sinh câu hỏi chung, chuyên sâu hoặc so sánh từ kết quả"],
  ["Lưu vết", "Email, Excel, ổ đĩa rời", "Lịch sử tập trung, tra lại được mọi lúc"],
];

export function LandingComparison() {
  return (
    <section id="so-sanh" className="lp-section lp-section--soft">
      <div className="lp-container">
        <div className="lp-sechead lp-reveal">
          <h2>Sàng lọc thủ công và CV Match khác nhau ở đâu</h2>
          <p>Khác biệt nằm ở chỗ kết luận có kèm căn cứ hay không, chứ không phải ở tốc độ.</p>
        </div>

        <div className="lp-tablewrap lp-reveal">
          <table className="lp-table">
            <thead>
              <tr>
                <th scope="col">Khía cạnh</th>
                <th scope="col">Sàng lọc thủ công</th>
                <th scope="col" className="lp-table__product-head">
                  Với CV Match
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
