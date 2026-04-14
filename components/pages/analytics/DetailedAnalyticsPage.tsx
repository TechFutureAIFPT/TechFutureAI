import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, Users, Award, Target, Save, Star, Crown,
  Clock, Zap, BarChart3, Activity, PieChart as LucidePieChart,
  LineChart as LucideLineChart, ChevronLeft,
} from 'lucide-react';
import type { Candidate } from '../../../assets/types';
import { saveHistorySession } from '../../../services/history-cache/historyService';
import { auth } from '../../../services/firebase';

interface DetailedAnalyticsPageProps {
  candidates: Candidate[];
  jobPosition: string;
  onReset: () => void;
}

const DetailedAnalyticsPage: React.FC<DetailedAnalyticsPageProps> = ({ candidates, jobPosition, onReset }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [activeChart, setActiveChart] = useState<'grade' | 'score' | 'radar' | 'trend'>('grade');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const navigate = useNavigate();

  const handleCompleteProcess = async () => {
    try {
      setIsSaving(true);
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        alert('Vui lòng đăng nhập để lưu lịch sử');
        return;
      }
      const jdText = localStorage.getItem('currentJD') || '';
      const locationRequirement = localStorage.getItem('currentLocation') || '';
      const weights = JSON.parse(localStorage.getItem('analysisWeights') || '{}');
      const hardFilters = JSON.parse(localStorage.getItem('hardFilters') || '{}');
      await saveHistorySession({
        jdText, jobPosition, locationRequirement, candidates,
        userEmail: currentUser.email, weights, hardFilters
      });
      alert('Đã lưu lịch sử phân tích thành công!');
      onReset();
      window.location.hash = '#/';
    } catch (error) {
      console.error('Lỗi khi lưu lịch sử:', error);
      alert('Có lỗi xảy ra khi lưu lịch sử. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const analyticsData = useMemo(() => {
    const successfulCandidates = candidates.filter(c => c.status === 'SUCCESS' && c.analysis);
    if (successfulCandidates.length === 0) return null;

    const gradeStats = {
      A: successfulCandidates.filter(c => c.analysis?.['Hạng'] === 'A').length,
      B: successfulCandidates.filter(c => c.analysis?.['Hạng'] === 'B').length,
      C: successfulCandidates.filter(c => c.analysis?.['Hạng'] === 'C').length,
    };

    const criteriaStats: Record<string, { total: number; count: number; scores: number[] }> = {};
    successfulCandidates.forEach(candidate => {
      if (candidate.analysis?.['Chi tiết']) {
        candidate.analysis['Chi tiết'].forEach(detail => {
          const criterion = detail['Tiêu chí'];
          const scoreText = detail['Điểm'];
          let score = 0;
          if (scoreText.includes('/')) score = parseInt(scoreText.split('/')[0]) || 0;
          else if (scoreText.includes('%')) score = parseInt(scoreText.replace('%', '')) || 0;
          else score = parseInt(scoreText) || 0;
          if (!criteriaStats[criterion]) criteriaStats[criterion] = { total: 0, count: 0, scores: [] };
          criteriaStats[criterion].total += score;
          criteriaStats[criterion].count += 1;
          criteriaStats[criterion].scores.push(score);
        });
      }
    });

    const criteriaAverages = Object.entries(criteriaStats).map(([criterion, stats]) => ({
      criterion: criterion.length > 22 ? criterion.substring(0, 22) + '...' : criterion,
      fullCriterion: criterion,
      average: Math.round(stats.total / stats.count),
      count: stats.count,
      min: Math.min(...stats.scores),
      max: Math.max(...stats.scores),
      stdDev: Math.sqrt(stats.scores.reduce((sq, n) => sq + Math.pow(n - stats.total / stats.count, 2), 0) / stats.count),
    }));

    const scoreDistribution = Array.from({ length: 10 }, (_, i) => {
      const range = `${i * 10}-${(i + 1) * 10}`;
      const count = successfulCandidates.filter(c => {
        const score = c.analysis?.['Tổng điểm'] || 0;
        return score >= i * 10 && score < (i + 1) * 10;
      }).length;
      return { range, count, fill: i >= 8 ? '#10b981' : i >= 6 ? '#3b82f6' : i >= 4 ? '#f59e0b' : '#ef4444' };
    }).filter(item => item.count > 0);

    const topCriteria = criteriaAverages
      .sort((a, b) => b.average - a.average)
      .slice(0, 6)
      .map(c => ({ subject: c.criterion, fullName: c.fullCriterion, score: c.average, fullMark: 100 }));

    const timeStats = successfulCandidates.map((c, index) => ({
      order: index + 1,
      score: c.analysis?.['Tổng điểm'] || 0,
      jdFit: parseInt(c.analysis?.['Chi tiết']?.find(d => d['Tiêu chí'].includes('Phù hợp JD'))?.['Điểm'].split('/')[0] || '0'),
      name: c.candidateName?.split(' ').slice(-1)[0] || `CV${index + 1}`,
    }));

    // Top performers
    const topPerformers = [...successfulCandidates]
      .sort((a, b) => (b.analysis?.['Tổng điểm'] || 0) - (a.analysis?.['Tổng điểm'] || 0))
      .slice(0, 5);

    const avgScore = successfulCandidates.reduce((sum, c) => sum + (c.analysis?.['Tổng điểm'] || 0), 0) / successfulCandidates.length;

    return {
      gradeStats,
      criteriaAverages,
      scoreDistribution,
      topCriteria,
      timeStats,
      totalCandidates: successfulCandidates.length,
      topPerformers,
      avgScore: Math.round(avgScore),
      successRate: Math.round((successfulCandidates.length / candidates.length) * 100),
    };
  }, [candidates]);

  if (!analyticsData) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#0d1220] to-[#0a0e1a] px-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-800/60 bg-[#0B1628] shadow-2xl shadow-black/30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" className="text-slate-600">
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 17V9" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 17V5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 17v-3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">Chưa có dữ liệu phân tích</h2>
        <p className="max-w-sm text-sm text-slate-400 leading-relaxed">Vui lòng chạy phân tích CV trước để xem báo cáo chi tiết và biểu đồ thống kê.</p>
        <button
          onClick={() => navigate('/jd')}
          className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
        >
          <i className="fa-solid fa-arrow-right text-xs"></i>
          Bắt đầu phân tích
        </button>
      </div>
    );
  }

  const GRADE_COLORS = ['#10B981', '#3B82F6', '#EF4444'];
  const gradeData = [
    { name: 'Hạng A', value: analyticsData.gradeStats.A, color: '#10B981', icon: Crown, label: 'Xuất sắc' },
    { name: 'Hạng B', value: analyticsData.gradeStats.B, color: '#3B82F6', icon: Star, label: 'Khá' },
    { name: 'Hạng C', value: analyticsData.gradeStats.C, color: '#EF4444', icon: Target, label: 'Trung bình' },
  ].filter(item => item.value > 0);

  const sharedTooltipStyle = {
    backgroundColor: 'rgba(10,14,26,0.95)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '16px',
    color: '#e2e8f0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(12px)',
    fontSize: '12px',
    padding: '12px 16px',
  };

  const sharedGridStyle = { strokeDasharray: '3 3', stroke: 'rgba(71,85,105,0.3)' };

  const CHART_TABS = [
    { key: 'grade' as const, label: 'Phân bố hạng', icon: LucidePieChart },
    { key: 'score' as const, label: 'Phân bố điểm', icon: BarChart3 },
    { key: 'radar' as const, label: 'Tiêu chí đánh giá', icon: Activity },
    { key: 'trend' as const, label: 'Xu hướng điểm', icon: LucideLineChart },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#0d1220] to-[#0a0e1a]">

      {/* ── Header Bar (đồng bộ) ─────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-800/60 bg-[#0a0e1a]/90 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/jd')}
              className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">
                Phân tích chi tiết
                <span className="ml-2 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-500/15 border border-indigo-500/20 text-indigo-300">
                  {jobPosition}
                </span>
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date().toLocaleDateString('vi-VN')}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {analyticsData.totalCandidates} ứng viên
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/chatbot')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/20"
            >
              <Zap className="w-3.5 h-3.5" />
              Gợi ý ứng viên
            </button>
            <button
              onClick={handleCompleteProcess}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-emerald-400/20"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Đang lưu...' : 'Lưu & Hoàn tất'}
            </button>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[400px] bg-gradient-to-bl from-indigo-500/5 via-violet-500/3 to-transparent rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[300px] bg-gradient-to-tr from-emerald-500/5 via-cyan-500/3 to-transparent rounded-full blur-3xl" />

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3 md:px-6 md:pt-5">
        <div className="mx-auto max-w-[1400px] space-y-5">

          {/* ── Summary Stats Cards ───────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/60 p-5 hover:border-indigo-500/30 transition-all duration-300 shadow-xl shadow-black/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 transition-all duration-500 group-hover:bg-indigo-500/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Tổng ứng viên</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <p className="text-4xl font-black text-white tracking-tighter">{analyticsData.totalCandidates}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[10px] text-emerald-400 font-semibold">{analyticsData.successRate}% thành công</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-emerald-500/20 p-5 hover:border-emerald-500/40 transition-all duration-300 shadow-xl shadow-emerald-500/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 transition-all duration-500 group-hover:bg-emerald-500/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">Hạng A</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                  <Crown className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-4xl font-black text-emerald-400 tracking-tighter">{analyticsData.gradeStats.A}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-semibold">ứng viên xuất sắc</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-blue-500/20 p-5 hover:border-blue-500/40 transition-all duration-300 shadow-xl shadow-blue-500/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 transition-all duration-500 group-hover:bg-blue-500/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Hạng B</span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/5">
                  <Star className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <p className="text-4xl font-black text-blue-400 tracking-tighter">{analyticsData.gradeStats.B}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Target className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-blue-400 font-semibold">ứng viên khá</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-amber-500/20 p-5 hover:border-amber-500/40 transition-all duration-300 shadow-xl shadow-amber-500/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 transition-all duration-500 group-hover:bg-amber-500/10" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">Trung bình</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <p className="text-4xl font-black text-amber-400 tracking-tighter">{analyticsData.avgScore}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[10px] text-amber-400 font-semibold">điểm trung bình</span>
              </div>
            </div>
          </div>

          {/* ── Top Performers ─────────────────────────────────── */}
          {analyticsData.topPerformers.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/60 p-5 shadow-xl shadow-black/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-500/5 to-transparent rounded-full blur-3xl" />
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Top ứng viên</h3>
                  <p className="text-[10px] text-slate-500">Danh sách ứng viên xuất sắc nhất</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {analyticsData.topPerformers.map((c, idx) => (
                  <div key={c.id} className={`relative overflow-hidden rounded-xl border p-3.5 transition-all duration-300 hover:-translate-y-1 ${
                    idx === 0 ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5' :
                    'bg-slate-800/30 border-slate-700/40 hover:border-slate-600'
                  }`}>
                    {idx === 0 && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/20 rounded-bl-xl flex items-center justify-center">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                        idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                        idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{c.candidateName}</p>
                        <p className="text-[9px] text-slate-500 truncate">{c.jobTitle || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                        c.analysis?.['Hạng'] === 'A' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                        c.analysis?.['Hạng'] === 'B' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      }`}>
                        {c.analysis?.['Hạng'] || 'C'}
                      </span>
                      <span className="text-sm font-black text-white">{c.analysis?.['Tổng điểm']}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Charts Section ──────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/60 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                    <path d="M3 3v18h18M7 16v-4M11 16v-8M15 16v-6M19 16v-3"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Biểu đồ phân tích</h3>
                  <p className="text-[10px] text-slate-500">Trực quan hóa dữ liệu ứng viên</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/40">
                {CHART_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveChart(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      activeChart === tab.key
                        ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 shadow-sm'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              {activeChart === 'grade' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={gradeData} cx="50%" cy="50%" labelLine={false}
                          label={({ name, percent, value }) => `${value} người`}
                          outerRadius={95} innerRadius={55} paddingAngle={6} dataKey="value">
                          {gradeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={sharedTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      {gradeData.map(item => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}60` }} />
                          <span className="text-[11px] text-slate-400 font-medium">{item.name}</span>
                          <span className="text-[11px] text-slate-500">({item.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-3">
                    {gradeData.map(item => {
                      const Icon = item.icon;
                      const pct = Math.round((item.value / analyticsData.totalCandidates) * 100);
                      return (
                        <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/40 hover:border-slate-600 transition-all">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                            <Icon className="w-5 h-5" style={{ color: item.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-white">{item.name}</span>
                              <span className="text-sm font-black" style={{ color: item.color }}>{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}80)` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeChart === 'score' && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analyticsData.scoreDistribution}>
                    <CartesianGrid {...sharedGridStyle} vertical={false} />
                    <XAxis dataKey="range" stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={8} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-6} />
                    <Tooltip cursor={{ fill: 'rgba(99,102,241,0.05)' }} contentStyle={sharedTooltipStyle } />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {analyticsData.scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeChart === 'radar' && (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={analyticsData.topCriteria} outerRadius={90}>
                    <PolarGrid stroke="rgba(71,85,105,0.4)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} />
                    <Radar name="Điểm TB" dataKey="score" stroke="#818cf8" fill="#818cf8" fillOpacity={0.12} strokeWidth={2.5} />
                    <Tooltip contentStyle={sharedTooltipStyle} labelFormatter={(label, payload) => {
                      const item = analyticsData.topCriteria.find(c => c.subject === label);
                      return item ? item.fullName : label;
                    }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}

              {activeChart === 'trend' && (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analyticsData.timeStats}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...sharedGridStyle} vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={8} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-6} />
                    <Tooltip cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={sharedTooltipStyle} />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#colorScore)" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} name="Tổng điểm" />
                    <Area type="monotone" dataKey="jdFit" stroke="#06b6d4" fill="url(#colorFit)" strokeWidth={2.5} dot={{ fill: '#06b6d4', r: 4, strokeWidth: 0 }} name="Phù hợp JD" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Detailed Criteria Table ────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1420] to-[#0a1020] border border-slate-800/60 shadow-xl shadow-black/20">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                  <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Chi tiết điểm theo tiêu chí</h3>
                <p className="text-[10px] text-slate-500">Phân tích chi tiết từng tiêu chí đánh giá</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-900/40">
                    {['Tiêu chí', 'Điểm TB', 'Độ lệch', 'Thấp nhất', 'Cao nhất', 'Số CV', 'Đánh giá'].map((h, i) => (
                      <th key={h} className={`text-left py-3.5 px-4 text-[10px] ${i === 0 ? 'pl-5' : ''} text-slate-500 uppercase tracking-wider font-bold`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {analyticsData.criteriaAverages
                    .sort((a, b) => b.average - a.average)
                    .map((criteria, idx) => (
                      <tr key={criteria.fullCriterion} className="hover:bg-slate-800/20 transition-colors group">
                        <td className="py-3.5 px-4 pl-5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-slate-800/80 text-[9px] font-black text-slate-500 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
                              {idx + 1}
                            </span>
                            <span className="text-sm text-slate-200 font-medium">{criteria.fullCriterion}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              criteria.average >= 80 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.1)]' :
                              criteria.average >= 60 ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.1)]' :
                              'bg-red-500/15 text-red-400 border border-red-500/25 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                            }`}>{criteria.average}</span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{
                                width: `${criteria.average}%`,
                                background: criteria.average >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : criteria.average >= 60 ? 'linear-gradient(90deg,#3b82f6,#60a5fa)' : 'linear-gradient(90deg,#ef4444,#f87171)'
                              }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-mono text-slate-400">{criteria.stdDev.toFixed(1)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-mono text-slate-500">{criteria.min}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-mono text-slate-500">{criteria.max}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-500">{criteria.count}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {criteria.average >= 80 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
                              <i className="fa-solid fa-thumbs-up text-[9px]"></i> Tốt
                            </span>
                          ) : criteria.average >= 60 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 font-bold">
                              <i className="fa-solid fa-minus text-[9px]"></i> Khá
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 font-bold">
                              <i className="fa-solid fa-triangle-exclamation text-[9px]"></i> Cần cải thiện
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Bottom CTA ──────────────────────────────────────── */}
          <div className="flex justify-center pt-1 pb-2">
            <button
              onClick={handleCompleteProcess}
              disabled={isSaving}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-4 text-sm font-bold text-white shadow-2xl shadow-emerald-500/20 transition-all hover:-translate-y-1 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 border border-emerald-400/20"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Đang lưu...' : 'Lưu & Hoàn tất phân tích'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalyticsPage;
