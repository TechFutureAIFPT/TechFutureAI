"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  Briefcase,
  User,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { useSalesOps } from "@/lib/sales-ops-context";

export function CommandSearch() {
  const {
    isSearchOpen,
    setIsSearchOpen,
    candidates,
    jobs,
    recruiters,
    setActiveSection,
  } = useSalesOps();

  const [query, setQuery] = useState("");

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const filteredCandidates = query.trim()
    ? candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.jobTarget.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()) ||
          c.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const filteredJobs = query.trim()
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(query.toLowerCase()) ||
          j.department.toLowerCase().includes(query.toLowerCase()) ||
          j.location.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredRecruiters = query.trim()
    ? recruiters.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.role.toLowerCase().includes(query.toLowerCase()) ||
          r.department.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelectCandidate = () => {
    setActiveSection("candidates");
    setIsSearchOpen(false);
  };

  const handleSelectJob = () => {
    setActiveSection("jobs");
    setIsSearchOpen(false);
  };

  const handleSelectRecruiter = () => {
    setActiveSection("candidates");
    setIsSearchOpen(false);
  };

  return (
    <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-card border-border">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            autoFocus
            placeholder="Tìm kiếm ứng viên, vị trí JD, kỹ năng, chuyên viên tuyển dụng..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] bg-secondary text-muted-foreground px-2 py-1 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[380px] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="text-center py-8 text-muted-foreground text-sm space-y-3">
              <p>Nhập từ khóa để tra cứu toàn diện hệ thống CV Match...</p>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-secondary rounded border border-border">
                  Hồ sơ Ứng viên
                </span>
                <span className="px-2.5 py-1 bg-secondary rounded border border-border">
                  Vị trí JD
                </span>
                <span className="px-2.5 py-1 bg-secondary rounded border border-border">
                  Đội ngũ HR
                </span>
              </div>
            </div>
          )}

          {query.trim() &&
            filteredCandidates.length === 0 &&
            filteredJobs.length === 0 &&
            filteredRecruiters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Không tìm thấy kết quả phù hợp cho từ khóa &ldquo;{query}&rdquo;.
              </div>
            )}

          {/* Candidates */}
          {filteredCandidates.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Ứng Viên & Hồ Sơ CV ({filteredCandidates.length})
              </span>
              <div className="space-y-1">
                {filteredCandidates.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={handleSelectCandidate}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sky-50/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0 font-bold text-xs">
                        {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {c.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.jobTarget} • {c.experienceYears} năm KN
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-sky-600" />
                        {c.matchScore}%
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jobs */}
          {filteredJobs.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Vị Trí Tuyển Dụng & JD ({filteredJobs.length})
              </span>
              <div className="space-y-1">
                {filteredJobs.slice(0, 4).map((j) => (
                  <div
                    key={j.id}
                    onClick={handleSelectJob}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sky-50/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {j.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {j.department} • {j.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {j.openings} chỉ tiêu
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recruiters */}
          {filteredRecruiters.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Chuyên Viên Tuyển Dụng ({filteredRecruiters.length})
              </span>
              <div className="space-y-1">
                {filteredRecruiters.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    onClick={handleSelectRecruiter}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sky-50/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {r.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {r.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.role} • {r.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs text-sky-700 font-semibold">
                      <span>{r.hiredCount}/{r.hiringTarget} tuyển</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
