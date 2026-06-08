import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// BUG CORREGIDO: el useEffect estaba FUERA del componente, lo que viola las
// reglas de React Hooks y causaba un error de runtime en cualquier página
// que usara ConfirmDialog. Ahora está correctamente DENTRO de la función.
// ─────────────────────────────────────────────────────────────────────────────

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  confirmColor = 'red',
}) => {
  // ✅ useEffect DENTRO del componente
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const colorMap = {
    red:     'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900/50',
    orange:  'bg-orange-500 hover:bg-orange-600 shadow-orange-200 dark:shadow-orange-900/50',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-emerald-900/50',
    blue:    'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-900/50',
  };

  const iconColorMap = {
    red:     'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    orange:  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    blue:    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-modal dark:shadow-modal-dark overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${iconColorMap[confirmColor] ?? iconColorMap.red}`}>
                  <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
              </div>

              <p className="text-sm text-slate-500 dark:text-gray-300 mb-6">{message}</p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-800 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-2.5 text-white rounded-xl text-sm font-medium transition shadow-sm ${
                    colorMap[confirmColor] ?? colorMap.red
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
