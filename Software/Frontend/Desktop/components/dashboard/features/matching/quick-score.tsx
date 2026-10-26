"use client";

import { useState } from "react";
import { useSalesOps } from "@/lib/sales-ops-context";
import { ai } from "@/lib/api-endpoints";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export function QuickScoreSection() {
  const { setActiveSection } = useSalesOps();

  const [jdText, setJdText] = useState("");
  const [cvText, setCvText] = useState("");

  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    rank: string;
    model: string;
  } | null>(null);

  const handleRunQuickScore = async () => {
    if (!jdText.trim() || !cvText.trim()) {
      toast.error("Vui lòng nhập cả văn bản JD và nội dung CV");
      return;
    }
    setIsScoring(true);
    const toastId = toast.loading("Đang gọi Backend AI chấm điểm ma trận đối chiếu...");

    try {
      const res = await ai.quickScoreText({
        jd_text: jdText,
        cv_entries: [
          {
            file_name: "CV_QuickScore.txt",
            text: cvText,
          },
        ],
      });

      if (!Array.isArray(res.items) || res.items.length === 0) {
        throw new Error("API không trả về kết quả chấm điểm cho CV này.");
      }
      const item = res.items[0];
      if (!Number.isFinite(item.score)) throw new Error("API trả về điểm không hợp lệ.");
      setScoreResult({
        overallScore: Math.round(item.score),
        strengths: item.strengths || [],
        weaknesses: item.weaknesses || [],
        recommendation: item.summary || "API chưa cung cấp phần tóm tắt.",
        rank: item.rank,
        model: res.model,
      });
      toast.success("Đã nhận kết quả chấm điểm từ Backend AI API.", { id: toastId });
    } catch (error) {
      setScoreResult(null);
      toast.error(error instanceof Error ? error.message : "Không kết nối được Backend AI API.", { id: toastId });
    } finally {
      setIsScoring(false);
    }

  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">Công cụ chấm điểm nhanh 1-1 (quick score)</h2>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
            <Zap className="w-3 h-3 mr-1 text-emerald-600" />
            Chấm điểm từ Backend
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Dán nội dung 1 bản JD và 1 bản CV để đối chiếu ma trận năng lực và nhận kết quả phân tích điểm mạnh/yếu ngay lập tức.
        </p>
      </div>

      {/* Input Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JD Input */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
              1. Nội dung mô tả công việc (JD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            <Textarea
              rows={8}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Dán nội dung JD vào đây..."
              className="bg-slate-50 border-sky-100 text-xs font-mono leading-relaxed text-slate-800 focus:border-sky-500"
            />
          </CardContent>
        </Card>

        {/* CV Input */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
              2. Nội dung hồ sơ ứng viên (CV text)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            <Textarea
              rows={8}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Dán nội dung CV hoặc trích xuất từ file vào đây..."
              className="bg-slate-50 border-sky-100 text-xs font-mono leading-relaxed text-slate-800 focus:border-sky-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Trigger */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleRunQuickScore}
          disabled={isScoring}
          className="bg-sky-600 text-white hover:bg-sky-700 font-bold px-8 shadow-xs text-sm"
        >
          <Sparkles className={`w-4 h-4 mr-2 ${isScoring ? "animate-spin" : ""}`} />
          {isScoring ? "Đang Gọi Backend AI Chấm Điểm..." : "Chấm Điểm Nhanh Ngay"}
        </Button>
      </div>

      {/* Results Box */}
      {scoreResult && (
        <Card className="border-border bg-card shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="pb-3 border-b border-border bg-sky-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900">
                  Kết quả chấm điểm đối chiếu AI
                </CardTitle>
                <CardDescription className="text-xs">
                  Phân tích chi tiết mức độ tương thích của ứng viên đối với yêu cầu công việc
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Điểm do API trả về:</span>
                  <span className="text-2xl font-bold text-sky-600">
                    {scoreResult.overallScore}%
                  </span>
                  <span className="text-xs text-muted-foreground block">Hạng {scoreResult.rank} · {scoreResult.model}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-2">
                <h4 className="font-bold text-xs text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  Điểm mạnh nổi bật (strengths)
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-800">
                  {scoreResult.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-sky-600 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Điểm cần lưu ý & khai thác thêm (gap)
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-800">
                  {scoreResult.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-sky-900 uppercase tracking-wider">
                    Kết luận đề xuất tuyển dụng
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {scoreResult.recommendation}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setActiveSection("pipeline")}
                className="bg-sky-600 text-white hover:bg-sky-700 text-xs shrink-0 font-bold shadow-xs"
              >
                Mở phễu tuyển dụng
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
