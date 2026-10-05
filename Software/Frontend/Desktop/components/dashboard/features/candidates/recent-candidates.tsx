"use client";

import { useState } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { type Candidate } from "@/lib/mock-data";
import { CandidateDetailModal } from "@/components/dashboard/modals/candidate-detail-modal";
import { CandidateModal } from "@/components/dashboard/modals/candidate-modal";
import { InterviewModal } from "@/components/dashboard/modals/interview-modal";
import { EmailModal } from "@/components/dashboard/modals/email-modal";
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stageBadges: Record<Candidate["stage"], { label: string; className: string }> = {
  screening: { label: "Sơ loại", className: "bg-sky-50 text-sky-700 border-sky-200" },
  qualified: { label: "Đạt chuẩn", className: "bg-blue-50 text-blue-700 border-blue-200" },
  interview: { label: "Phỏng vấn", className: "bg-amber-50 text-amber-700 border-amber-200" },
  offer: { label: "Offer", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
};

export function RecentCandidates() {
  const { candidates, setActiveSection } = useSalesOps();

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Top candidates sorted by match score
  const topCandidates = [...candidates]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Ứng Viên Điểm Match AI Cao Gần Đây
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hồ sơ ứng viên có độ tương thích cao nhất với yêu cầu JD
            </p>
          </div>
          <button
            onClick={() => setActiveSection("candidates")}
            className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            Xem tất cả &rarr;
          </button>
        </div>

        <div className="space-y-2.5">
          {topCandidates.map((c, idx) => {
            const badge = stageBadges[c.stage];

            return (
              <div
                key={`${c.id}-${idx}`}
                onClick={() => setSelectedCandidate(c)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 hover:bg-sky-50/50 border border-slate-200/80 hover:border-sky-300 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                    {c.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-sky-600 transition-colors">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3 text-sky-600" />
                      {c.jobTarget}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-900">
                      {(c.expectedSalary / 1000000).toFixed(0)} Triệu ₫
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {c.experienceYears} năm kinh nghiệm
                    </span>
                  </div>

                  <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
                    {badge.label}
                  </Badge>

                  <div className="flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-1 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    {c.matchScore}%
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-600 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onOpenChange={(open) => !open && setSelectedCandidate(null)}
        onEdit={(cand) => {
          setCandidateToEdit(cand);
          setEditModalOpen(true);
        }}
        onScheduleInterview={(cand) => {
          setInterviewCandidate(cand);
          setInterviewModalOpen(true);
        }}
        onSendEmail={(cand) => {
          setEmailCandidate(cand);
          setEmailModalOpen(true);
        }}
      />

      {/* Candidate Edit Modal */}
      <CandidateModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        candidateToEdit={candidateToEdit}
      />

      {/* Interview Modal */}
      <InterviewModal
        open={interviewModalOpen}
        onOpenChange={setInterviewModalOpen}
        candidateName={interviewCandidate?.name}
        candidateEmail={interviewCandidate?.email}
        jobTitle={interviewCandidate?.jobTarget}
      />

      {/* Email Modal */}
      <EmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        recipientName={emailCandidate?.name}
        recipientEmail={emailCandidate?.email}
        jobTitle={emailCandidate?.jobTarget}
      />
    </>
  );
}

export const RecentDeals = RecentCandidates;
