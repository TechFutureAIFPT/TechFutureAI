"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BarChart3, Bot, BriefcaseBusiness, Files, History, Plus, Users } from "lucide-react";
import { useSalesOps } from "@/lib/sales-ops-context";

const stageLabels = { screening: "Sàng lọc", qualified: "Đạt tiêu chí", interview: "Phỏng vấn", offer: "Đề nghị nhận việc" } as const;

export function OverviewSection() {
  const { candidates, jobs, historyBatches, userProfile } = useSalesOps();
  const threshold = userProfile.minMatchScoreThreshold;
  const qualified = candidates.filter((candidate) => candidate.matchScore >= threshold).length;
  const average = candidates.length ? Math.round(candidates.reduce((sum, candidate) => sum + candidate.matchScore, 0) / candidates.length) : 0;
  const activeJobs = jobs.filter((job) => job.status === "active");
  const stats = [
    { label: "Hồ sơ ứng viên", value: candidates.length.toLocaleString("vi-VN"), detail: `${qualified} hồ sơ có điểm từ ${threshold}`, href: "/dashboard?section=candidates", icon: Users },
    { label: "Điểm phù hợp trung bình", value: candidates.length ? `${average}/100` : "—", detail: "Tính trên hồ sơ trong không gian làm việc", href: "/dashboard?section=candidates", icon: BarChart3 },
    { label: "Vị trí đang tuyển", value: activeJobs.length.toLocaleString("vi-VN"), detail: `${activeJobs.reduce((sum, job) => sum + Math.max(0, job.openings - job.hiredCount), 0)} chỉ tiêu còn mở`, href: "/dashboard?section=jobs", icon: BriefcaseBusiness },
    { label: "Phiên đánh giá đã lưu", value: historyBatches.length.toLocaleString("vi-VN"), detail: "Tra cứu và xuất báo cáo theo từng phiên", href: "/dashboard?section=history", icon: History },
  ];
  return <div>
    <div className="page-intro"><div><h2>Tổng quan tuyển dụng</h2><p>Theo dõi hồ sơ, nắm bắt tiến độ và tiếp tục những công việc quan trọng.</p></div><Link href="/dashboard/match-workflow" className="platform-button"><Plus size={17} />Tạo phiên đánh giá</Link></div>
    <div className="overview-stats">{stats.map((stat) => <Link href={stat.href} className="overview-stat" key={stat.label}><div><span>{stat.label}</span><stat.icon size={17} strokeWidth={1.5} /></div><strong>{stat.value}</strong><small>{stat.detail}</small></Link>)}</div>
    <div className="overview-grid">
      <section className="enterprise-panel"><div className="panel-heading"><div><h3>Ứng viên có mức độ phù hợp cao</h3><p>Thứ tự theo điểm đánh giá hiện có</p></div><Link href="/dashboard?section=candidates">Xem hồ sơ<ArrowUpRight size={14} /></Link></div>
        {candidates.length ? <div className="enterprise-table-wrap"><table className="enterprise-table"><thead><tr><th>Ứng viên</th><th>Điểm phù hợp</th><th>Giai đoạn</th></tr></thead><tbody>{[...candidates].sort((a, b) => b.matchScore - a.matchScore).slice(0, 5).map((candidate) => <tr key={candidate.id}><td><Link href="/dashboard?section=candidates" className="person-cell"><span className="person-avatar">{candidate.name.split(" ").map((part) => part[0]).slice(-2).join("")}</span><span><strong>{candidate.name}</strong><small>{candidate.jobTarget}</small></span></Link></td><td><span className="score-value">{candidate.matchScore}<span className="font-normal opacity-60">/100</span></span></td><td>{stageLabels[candidate.stage]}</td></tr>)}</tbody></table></div> : <div className="empty-state"><Users size={28} /><p>Chưa có hồ sơ ứng viên.<br />Tạo phiên đánh giá để bắt đầu sàng lọc.</p><Link href="/dashboard/match-workflow">Tạo phiên đánh giá</Link></div>}
      </section>
      <section className="enterprise-panel"><div className="panel-heading"><div><h3>Tiến trình tuyển dụng</h3><p>Phân bố ứng viên theo giai đoạn</p></div><Link href="/dashboard?section=pipeline">Chi tiết<ArrowUpRight size={14} /></Link></div><div className="stage-list">{Object.entries(stageLabels).map(([stage, label], index) => {
        const count = candidates.filter((candidate) => candidate.stage === stage).length;
        const percentage = candidates.length ? Math.round(count / candidates.length * 100) : 0;
        return <div className="stage-row" key={stage}><div><span>{label}</span><strong>{count} <span className="font-normal text-muted-foreground">ứng viên</span></strong></div><div className="stage-track" role="meter" aria-label={label} aria-valuenow={count} aria-valuemin={0} aria-valuemax={Math.max(candidates.length, 1)}><span style={{ width: `${percentage}%`, opacity: 1 - index * .17 }} /></div></div>;
      })}</div><div className="panel-note">Mở tiến trình tuyển dụng để cập nhật giai đoạn và theo dõi từng hồ sơ.</div></section>
    </div>
    <section className="overview-assistant"><Bot size={27} strokeWidth={1.5} /><div><h3>Thêm góc nhìn cho quyết định tuyển dụng</h3><p>Trao đổi về yêu cầu công việc, tiêu chí đánh giá hoặc nghiên cứu thị trường cùng trợ lý AI.</p></div><Link href="/ai-assistant">Mở trợ lý AI<ArrowUpRight size={17} /></Link></section>
    <div className="overview-grid overview-bottom">
      <section className="enterprise-panel"><div className="panel-heading"><div><h3>Phiên đánh giá gần đây</h3><p>Kết quả và lịch sử sàng lọc hồ sơ</p></div><Link href="/dashboard?section=history">Xem lịch sử<ArrowUpRight size={14} /></Link></div>{historyBatches.length ? <div className="enterprise-table-wrap"><table className="enterprise-table"><thead><tr><th>Phiên đánh giá</th><th>Hồ sơ</th><th>Trạng thái</th></tr></thead><tbody>{historyBatches.slice(0, 3).map((batch) => <tr key={batch.id}><td><Link href="/dashboard?section=reports"><strong>{batch.batchName}</strong><small>{batch.jobTitle}</small></Link></td><td>{batch.totalCVs}</td><td><span className="status-chip">{batch.status === "completed" ? "Hoàn thành" : "Đang xử lý"}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><Files size={26} />Các phiên đánh giá đã lưu sẽ xuất hiện tại đây.</div>}</section>
      <section className="enterprise-panel"><div className="panel-heading"><div><h3>Vị trí đang tuyển</h3><p>Những nhu cầu tuyển dụng hiện tại</p></div><Link href="/dashboard?section=jobs">Quản lý<ArrowUpRight size={14} /></Link></div>{activeJobs.length ? <div className="divide-y">{activeJobs.slice(0, 3).map((job) => <Link href="/dashboard?section=jobs" key={job.id} className="flex items-center justify-between gap-4 px-[22px] py-4 hover:bg-slate-50"><div className="min-w-0"><strong className="block text-[11px] font-semibold text-slate-700 truncate">{job.title}</strong><p className="text-[10px] text-muted-foreground mt-1.5">{job.department} · {job.location}</p></div><ArrowRight size={15} className="shrink-0 text-slate-400" /></Link>)}</div> : <div className="empty-state"><BriefcaseBusiness size={26} /><p>Chưa có vị trí đang tuyển.</p><Link href="/dashboard?section=jobs">Quản lý vị trí tuyển dụng</Link></div>}</section>
    </div>
  </div>;
}
