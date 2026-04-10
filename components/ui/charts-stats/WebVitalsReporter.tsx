import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Component to track and log Web Vitals
const WebVitalsReporter = () => {
  useEffect(() => {
    const handleMetric = (metric: any) => {
      // Log to console for development
      if (import.meta.env.DEV) {
        console.log(`🚀 Web Vital - ${metric.name}:`, {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
        });
      }

      // You can also send metrics to your analytics service here
      // Example: analytics.track('web-vital', metric);
    };

    // Measure Core Web Vitals (using v3 API)
    onCLS(handleMetric);   // Cumulative Layout Shift
    onINP(handleMetric);   // Interaction to Next Paint (replaces FID)
    onFCP(handleMetric);   // First Contentful Paint
    onLCP(handleMetric);   // Largest Contentful Paint
    onTTFB(handleMetric);  // Time to First Byte
  }, []);

  return null; // This component doesn't render anything
};

export default WebVitalsReporter;