import { useState, useEffect, useRef } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';

const LazyImage = ({ productId, fetchImage }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !imageSrc && !loading && !error) {
            setLoading(true);
            fetchImage(productId)
              .then(src => {
                if (src) {
                  setImageSrc(src);
                }
              })
              .catch(() => setError(true))
              .finally(() => setLoading(false));
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [productId, imageSrc, loading, error, fetchImage]);

  return (
    <div ref={containerRef} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
      {imageSrc ? (
        <img src={imageSrc} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <CameraIcon className="h-6 w-6 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default LazyImage;
