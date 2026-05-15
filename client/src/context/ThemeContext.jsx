import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Leer de localStorage o usar 'system' por defecto
    const saved = localStorage.getItem('godeo-theme');
    return saved || 'system';
  });

  // Aplicar la clase 'dark' al <html> según el tema
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Sistema: seguir preferencia del dispositivo
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      handleChange(mediaQuery); // inicial
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Persistir en localStorage
  useEffect(() => {
    localStorage.setItem('godeo-theme', theme);
  }, [theme]);

  const isDark = () => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
