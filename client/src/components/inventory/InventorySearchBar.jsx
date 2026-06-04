import { MagnifyingGlassIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const InventorySearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="🔍 Buscar en todo el inventario..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-card dark:shadow-card-dark pl-10 text-sm text-slate-700 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition dark:border-white/5 border border-slate-200"
      />
      <QrCodeIcon className="h-5 w-5 absolute left-3 top-3.5 text-slate-400 dark:text-gray-300" />
    </div>
  );
};

export default InventorySearchBar;
