import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, message, actionLabel, onAction }) => {
  return (
    <motion.div
      className="text-center py-16 px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {Icon && (
        <div className="w-20 h-20 mx-auto mb-5 bg-slate-100 rounded-full flex items-center justify-center">
          <Icon className="h-10 w-10 text-slate-400" />
        </div>
      )}
      <p className="text-slate-500 font-medium text-lg">{title}</p>
      {message && <p className="text-slate-400 text-sm mt-1">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition shadow-sm shadow-orange-200"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
