import React, { useState, useEffect, memo } from 'react';

interface BundleAnalyzer {
  totalSize: number;
  gzipSize: number;
  chunkSizes: Record<string, number>;
  loadTime: number;
}

const BundleAnalyzer: React.FC = memo(() => {
  const [bundleInfo, setBundleInfo] = useState<BundleAnalyzer | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simulate bundle analysis (in real app, this would come from build tools)
    const analyzeBundle = () => {
      const startTime = performance.now();
      
      // Estimate bundle sizes based on performance entries
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let totalSize = 0;
      const chunkSizes: Record<string, number> = {};
      
      resources.forEach(resource => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          const size = resource.transferSize || 0;
          totalSize += size;
          
          const fileName = resource.name.split('/').pop() || 'unknown';
          chunkSizes[fileName] = size;
        }
      });

      const loadTime = performance.now() - startTime;
      
      setBundleInfo({
        totalSize,
        gzipSize: totalSize * 0.3, // Estimate gzip compression
        chunkSizes,
        loadTime
      });
    };

    // Analyze after page load
    if (document.readyState === 'complete') {
      analyzeBundle();
    } else {
      window.addEventListener('load', analyzeBundle);
      return () => window.removeEventListener('load', analyzeBundle);
    }
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getOptimizationTips = () => {
    const tips = [];
    
    if (bundleInfo) {
      if (bundleInfo.totalSize > 1024 * 1024) { // > 1MB
        tips.push('Sử dụng code splitting để giảm bundle size');
      }
      if (bundleInfo.loadTime > 1000) {
        tips.push('Tối ưu lazy loading và preloading');
      }
      if (Object.keys(bundleInfo.chunkSizes).length > 20) {
        tips.push('Hợp nhất các chunk nhỏ để giảm HTTP requests');
      }
    }
    
    return tips;
  };

  if (!bundleInfo) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-slate-800/80 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors z-50 backdrop-blur-sm"
        title="Bundle Analyzer"
      >
        <i className="fa-solid fa-chart-pie text-lg"></i>
      </button>

      {/* Bundle Info Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 w-80 bg-slate-800/95 border border-slate-600 rounded-xl backdrop-blur-sm shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-chart-pie text-blue-400"></i>
              <h3 className="text-white font-semibold">Bundle Analysis</h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Bundle Stats */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="text-slate-400 text-xs mb-1">Total Size</div>
                <div className="text-white font-semibold">{formatBytes(bundleInfo.totalSize)}</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="text-slate-400 text-xs mb-1">Gzipped</div>
                <div className="text-white font-semibold">{formatBytes(bundleInfo.gzipSize)}</div>
              </div>
            </div>

            {/* Load Time */}
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <div className="text-slate-400 text-xs mb-1">Analysis Time</div>
              <div className="text-white font-semibold">{bundleInfo.loadTime.toFixed(2)}ms</div>
            </div>

            {/* Top Chunks */}
            <div>
              <div className="text-slate-400 text-xs mb-2">Largest Chunks</div>
              <div className="space-y-1">
                {Object.entries(bundleInfo.chunkSizes)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([name, size]) => (
                    <div key={name} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 truncate" title={name}>
                        {name.length > 20 ? name.substring(0, 20) + '...' : name}
                      </span>
                      <span className="text-slate-400">{formatBytes(size as number)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Optimization Tips */}
            {getOptimizationTips().length > 0 && (
              <div>
                <div className="text-slate-400 text-xs mb-2">Optimization Tips</div>
                <div className="space-y-1">
                  {getOptimizationTips().map((tip, index) => (
                    <div key={index} className="text-xs text-yellow-400 flex items-start gap-1">
                      <i className="fa-solid fa-lightbulb mt-0.5"></i>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Performance Score */}
          <div className="p-4 bg-slate-700/30 rounded-b-xl">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Performance Score</span>
              <div className="flex items-center gap-1">
                {bundleInfo.totalSize < 500 * 1024 ? (
                  <i className="fa-solid fa-check-circle text-green-400"></i>
                ) : bundleInfo.totalSize < 1024 * 1024 ? (
                  <i className="fa-solid fa-exclamation-triangle text-yellow-400"></i>
                ) : (
                  <i className="fa-solid fa-times-circle text-red-400"></i>
                )}
                <span className="text-white font-semibold">
                  {bundleInfo.totalSize < 500 * 1024 ? 'Good' : 
                   bundleInfo.totalSize < 1024 * 1024 ? 'Fair' : 'Poor'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

BundleAnalyzer.displayName = 'BundleAnalyzer';

export default BundleAnalyzer;