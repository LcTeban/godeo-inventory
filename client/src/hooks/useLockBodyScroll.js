import { useEffect } from 'react';

const useLockBodyScroll = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll'; // evitar salto de ancho
    } else {
      // Restaurar
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }

    return () => {
      // Limpieza al desmontar (por si el componente se desmonta con modal abierto)
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    };
  }, [isLocked]);
};

export default useLockBodyScroll;
