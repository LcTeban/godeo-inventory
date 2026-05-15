import { useState, useEffect, useRef, useCallback } from 'react';

const usePullToRefresh = (onRefresh, threshold = 80) => {
  const [pullState, setPullState] = useState('idle'); // idle | pulling | refreshing
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef(null);
  const refreshTimeout = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (pullState === 'refreshing') return;
    const scrollTop = containerRef.current?.scrollTop || window.scrollY;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setPullState('idle');
      setPullDistance(0);
    }
  }, [pullState]);

  const handleTouchMove = useCallback((e) => {
    if (pullState === 'refreshing') return;
    const scrollTop = containerRef.current?.scrollTop || window.scrollY;
    if (scrollTop <= 0) {
      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);
      // Resistencia: reduce la distancia a medida que tiras más
      const dampedDistance = distance * 0.4;
      setPullDistance(dampedDistance);
      if (dampedDistance > 10) {
        setPullState('pulling');
      }
    }
  }, [pullState]);

  const handleTouchEnd = useCallback(() => {
    if (pullState === 'refreshing') return;
    if (pullDistance >= threshold) {
      setPullState('refreshing');
      setPullDistance(threshold * 0.6); // para mantener el indicador visible
      onRefresh().finally(() => {
        if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
        refreshTimeout.current = setTimeout(() => {
          setPullState('idle');
          setPullDistance(0);
        }, 600); // pequeña espera para animación de salida
      });
    } else {
      setPullState('idle');
      setPullDistance(0);
    }
  }, [pullState, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    pullState,
    pullDistance,
    isRefreshing: pullState === 'refreshing',
    isPulling: pullState === 'pulling' || pullState === 'refreshing',
  };
};

export default usePullToRefresh;
