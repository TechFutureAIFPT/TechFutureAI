import React, { useState, useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  unit: string;
  description: string;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMetric = (metric: any) => {
      const newMetric: PerformanceMetric = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        unit: getUnit(metric.name),
        description: getDescription(metric.name),
      };

      setMetrics(prev => {
        const existing = prev.findIndex(m => m.name === metric.name);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newMetric;
          return updated;
        } else {
          return [...prev, newMetric];
        }
      });
    };

    // Collect Web Vitals
    onCLS(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  }, []);

  const getUnit = (name: string): string => {
    switch (name) {
      case 'CLS': return '';
      case 'INP':
      case 'FCP':
      case 'LCP':
      case 'TTFB': return 'ms';
      default: return '';
    }
  };

  const getDescription = (name: string): string => {
    switch (name) {
      case 'CLS': return 'Cumulative Layout Shift';
      case 'INP': return 'Interaction to Next Paint';
      case 'FCP': return 'First Contentful Paint';
      case 'LCP': return 'Largest Contentful Paint';
      case 'TTFB': return 'Time to First Byte';
      default: return name;
    }
  };

  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'good': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'needs-improvement': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'poor': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'ms') {
      return value < 1000 ? `${Math.round(value)}ms` : `${(value/1000).toFixed(2)}s`;
    }
    return value.toFixed(3);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors z-40"
        title="Show Performance Metrics"
      >
        <i className="fa-solid fa-tachometer-alt text-sm"></i>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800/95 backdrop-blur border border-slate-600 rounded-xl p-4 min-w-[320px] max-w-[400px] z-40 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <i className="fa-solid fa-tachometer-alt text-blue-400"></i>
          Performance Metrics
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="w-6 h-6 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
        >
          <i className="fa-solid fa-times text-xs"></i>
        </button>
      </div>

      {metrics.length === 0 ? (
        <div className="text-center py-4 text-slate-400 text-sm">
          <i className="fa-solid fa-spinner fa-spin mb-2"></i>
          <div>Collecting metrics...</div>
        </div>
      ) : (
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className={`p-3 rounded-lg border ${getRatingColor(metric.rating)}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-semibold text-sm">{metric.name}</div>
                <div className="font-mono text-sm">
                  {formatValue(metric.value, metric.unit)}
                </div>
              </div>
              <div className="text-xs opacity-80 mb-1">{metric.description}</div>
              <div className="flex items-center justify-between">
                <div className={`text-xs px-2 py-1 rounded-full ${getRatingColor(metric.rating)}`}>
                  {metric.rating.replace('-', ' ')}
                </div>
                <div className="text-xs opacity-60">
                  {metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <i className="fa-solid fa-info-circle"></i>
          Core Web Vitals tracking
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;