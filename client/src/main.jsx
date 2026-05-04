import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registrar Service Worker para PWA (corregido a la subcarpeta real)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/godeo-inventory/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registrado:', registration.scope);
      })
      .catch(error => {
        console.log('❌ Error Service Worker:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
