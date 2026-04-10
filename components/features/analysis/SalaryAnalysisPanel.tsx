import React, { useState } from 'react';
import { TrendingUp, DollarSign, AlertCircle, CheckCircle, Info, Target, Lightbulb } from 'lucide-react';
import { analyzeSalary } from '../../../services/salary-analysis/salaryAnalysisService';
import type { Candidate } from '../../../assets/types';

interface SalaryAnalysisPanelProps {
  candidate?: Candidate;
  jdText?: string;
  onAnalysisComplete?: (result: any) => void;
}

interface SalaryAnalysisResult {
  summary: string;
  marketSalary: {
    p25: number;
    median: number;
    p75: number;
    currency: string;
    period: string;
  } | null;
  comparison?: {
    currentSalary: number;
    marketPosition: 'below' | 'reasonable' | 'above';
    difference: number;
    differencePercent: number;
  };
  recommendation: string;
  negotiationTips: string[];
  source: string;
  error?: string;
}

const formatVND = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  } else if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} tr`;
  }
  return `${amount.toLocaleString('vi-VN')}`;
};

const SalaryAnalysisPanel: React.FC<SalaryAnalysisPanelProps> = ({
  candidate,
  jdText,
  onAnalysisComplete,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SalaryAnalysisResult | null>(null);
  const [manualInput, setManualInput] = useState({
    jobTitle: '',
    location: '',
    yearsOfExperience: '',
    currentSalary: '',
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const analysisResult = await analyzeSalary({
        jobTitle: manualInput.jobTitle || candidate?.jobTitle || '',
        location: manualInput.location || candidate?.detectedLocation || '',
        yearsOfExperience: manualInput.yearsOfExperience 
          ? parseInt(manualInput.yearsOfExperience) 
          : undefined,
        currentSalary: manualInput.currentSalary 
          ? parseFloat(manualInput.currentSalary) * 1_000_000 
          : undefined,
        cvText: candidate ? 
          `${candidate.candidateName}\n${candidate.jobTitle}\n${candidate.experienceLevel}\n${candidate.detectedLocation}` 
          : undefined,
        jdText: jdText || '',
      });

      setResult(analysisResult);
      onAnalysisComplete?.(analysisResult);
    } catch (error) {
      console.error('Salary analysis error:', error);
      setResult({
        summary: 'Có lỗi xảy ra khi phân tích mức lương.',
        marketSalary: null,
        recommendation: 'Vui lòng thử lại sau.',
        negotiationTips: [],
        source: 'N/A',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMarketPositionColor = (position?: 'below' | 'reasonable' | 'above') => {
    switch (position) {
      case 'below':
        return 'text-orange-600 bg-orange-50';
      case 'reasonable':
        return 'text-green-600 bg-green-50';
      case 'above':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getMarketPositionIcon = (position?: 'below' | 'reasonable' | 'above') => {
    switch (position) {
      case 'below':
        return <AlertCircle className="w-5 h-5" />;
      case 'reasonable':
        return <CheckCircle className="w-5 h-5" />;
      case 'above':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getMarketPositionText = (position?: 'below' | 'reasonable' | 'above') => {
    switch (position) {
      case 'below':
        return 'Dưới thị trường';
      case 'reasonable':
        return 'Hợp lý';
      case 'above':
        return 'Trên thị trường';
      default:
        return 'Chưa xác định';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <DollarSign className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Phân Tích Mức Lương</h2>
          <p className="text-sm text-gray-600">So sánh với thị trường Việt Nam</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chức danh
            </label>
            <input
              type="text"
              value={manualInput.jobTitle}
              onChange={(e) => setManualInput({ ...manualInput, jobTitle: e.target.value })}
              placeholder={candidate?.jobTitle || 'VD: Senior Backend Developer'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa điểm
            </label>
            <input
              type="text"
              value={manualInput.location}
              onChange={(e) => setManualInput({ ...manualInput, location: e.target.value })}
              placeholder={candidate?.detectedLocation || 'VD: Hà Nội'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số năm kinh nghiệm
            </label>
            <input
              type="number"
              value={manualInput.yearsOfExperience}
              onChange={(e) => setManualInput({ ...manualInput, yearsOfExperience: e.target.value })}
              placeholder="VD: 5"
              min="0"
              max="30"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mức lương hiện tại (triệu VNĐ/tháng)
            </label>
            <input
              type="number"
              value={manualInput.currentSalary}
              onChange={(e) => setManualInput({ ...manualInput, currentSalary: e.target.value })}
              placeholder="VD: 25"
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Đang phân tích...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              Phân tích mức lương
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Error Display */}
          {result.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Lỗi phân tích</p>
                <p className="text-sm text-red-700 mt-1">{result.error}</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Tóm tắt</p>
                <p className="text-sm text-blue-800 mt-1">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Market Salary Range */}
          {result.marketSalary && (
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Khoảng lương thị trường
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">P25 (Thấp)</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatVND(result.marketSalary.p25)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-300">
                  <p className="text-xs text-green-700 mb-1">Median (Trung vị)</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatVND(result.marketSalary.median)}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">P75 (Cao)</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatVND(result.marketSalary.p75)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                {result.marketSalary.currency} / {result.marketSalary.period === 'MONTHLY' ? 'Tháng' : 'Năm'}
              </p>
            </div>
          )}

          {/* Comparison (if current salary provided) */}
          {result.comparison && (
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-4">So sánh với thị trường</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Lương hiện tại</span>
                  <span className="font-bold text-gray-900">
                    {formatVND(result.comparison.currentSalary)} VNĐ/tháng
                  </span>
                </div>
                
                <div className={`flex items-center justify-between p-3 rounded-lg ${getMarketPositionColor(result.comparison.marketPosition)}`}>
                  <div className="flex items-center gap-2">
                    {getMarketPositionIcon(result.comparison.marketPosition)}
                    <span className="text-sm font-medium">
                      {getMarketPositionText(result.comparison.marketPosition)}
                    </span>
                  </div>
                  <span className="font-bold">
                    {result.comparison.differencePercent > 0 ? '+' : ''}
                    {result.comparison.differencePercent}%
                  </span>
                </div>

                {result.comparison.difference !== 0 && (
                  <p className="text-sm text-gray-600 text-center">
                    {result.comparison.difference > 0 ? 'Cao hơn' : 'Thấp hơn'} median{' '}
                    <span className="font-semibold">{formatVND(Math.abs(result.comparison.difference))}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Đề xuất</p>
                <p className="text-sm text-green-800 mt-1">{result.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Negotiation Tips */}
          {result.negotiationTips.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Gợi ý thương lượng
              </h3>
              <ul className="space-y-2">
                {result.negotiationTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-yellow-600 flex-shrink-0 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source */}
          <div className="text-xs text-gray-500 text-center border-t border-gray-200 pt-4">
            <p>📊 {result.source}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryAnalysisPanel;
