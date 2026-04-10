import React, { useState, useRef, useEffect, memo } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallbackIcon?: string;
  onError?: () => void;
  draggable?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  className = '',
  placeholder = '',
  fallbackIcon = 'fa-solid fa-image',
  onError,
  draggable = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!isInView ? (
        // Placeholder before image loads
        <div className="w-full h-full bg-slate-700/30 animate-pulse flex items-center justify-center">
          <i className={`${fallbackIcon} text-slate-500 text-2xl`}></i>
        </div>
      ) : hasError ? (
        // Error state
        <div className="w-full h-full bg-slate-700/30 flex items-center justify-center">
          <i className={`${fallbackIcon} text-slate-500 text-2xl`}></i>
        </div>
      ) : (
        <>
          {!isLoaded && (
            // Loading state
            <div className="absolute inset-0 bg-slate-700/30 animate-pulse flex items-center justify-center">
              <i className={`${fallbackIcon} text-slate-500 text-2xl`}></i>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            draggable={draggable}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;