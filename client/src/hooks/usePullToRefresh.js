import { useState, useEffect, useRef, useCallback } from 'react';

const usePullToRefresh = (onRefresh, threshold = 80) => {
  const [pullState, setPullState] = useState('idle'); // idle | pulling | refreshing
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pullingRef = useRef(false);
  const refreshTimeout = useRef(null);

  const handleTouchStart = useCallback((e) => {
    // Solo activar si estamos al inicio de la página
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      pullingRef.current = true;
      setPullState('idle');
      setPullDistance(0);
    } else {
      pullingRef.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pullingRef.current || pullState === 'refreshing') return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    // Aplicar resistencia para que no sea brusco
    const dampedDistance = distance * 0.4;
    setPullDistance(dampedDistance);
    if (dampedDistance > 10) {
      setPullState('pulling');
      // Prevenir el comportamiento nativo de recarga del navegador
      e.preventDefault();
    }
  }, [pullState]);

  const handleTouchEnd = useCallback(() => {
    if (pullState === 'refreshing') return;
    if (pullDistance >= threshold) {
      setPullState('refreshing');
      setPullDistance(threshold * 0.5); // mantener indicador visible
      onRefresh().finally(() => {
        if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
        refreshTimeout.current = setTimeout(() => {
          setPullState('idle');
          setPullDistance(0);
          pullingRef.current = false;
        }, 600);
      });
    } else {
      setPullState('idle');
      setPullDistance(0);
      pullingRef.current = false;
    }
  }, [pullState, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullState,
    pullDistance,
    isRefreshing: pullState === 'refreshing',
    isPulling: pullState === 'pulling' || pullState === 'refreshing',
  };
};

export default usePullToRefresh;
