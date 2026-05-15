import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', confirmColor = 'red' }) => {
  const colorMap = {
    red: 'bg-red-600 hover:bg-red-700 shadow-red-200',
    orange: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
  };

  const iconColorMap = {
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
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
            className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${iconColorMap[confirmColor] || iconColorMap.red}`}>
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">{message}</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-2.5 text-white rounded-xl text-sm font-medium transition shadow-sm ${colorMap[confirmColor] || colorMap.red}`}
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
