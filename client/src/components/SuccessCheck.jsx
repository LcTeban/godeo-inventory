import { motion } from 'framer-motion';

const SuccessCheck = ({ show }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={show ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-full p-4 shadow-2xl dark:shadow-black/50"
        initial={{ scale: 0 }}
        animate={show ? { scale: 1 } : { scale: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-emerald-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={show ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.path d="M5 13l4 4L19 7" />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
};

export default SuccessCheck;
