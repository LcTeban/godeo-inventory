import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/godeo-inventory/',  // 👈 Esta línea es la que debes agregar
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
});
