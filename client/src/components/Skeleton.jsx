const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200 dark:bg-gray-800 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
    </div>
  );
};

export default Skeleton;
