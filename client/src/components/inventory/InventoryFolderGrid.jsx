import { FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';

const InventoryFolderGrid = ({ categories, products, currentFolderId, onNavigateToFolder }) => {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {categories.map(cat => {
        const hasChildren = categories.some(c => c.parent_id === cat.id);
        const productCount = products.filter(p => p.category_id === cat.id).length;
        return (
          <button
            key={cat.id}
            onClick={() => onNavigateToFolder(cat.id)}
            className="flex flex-col items-center p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover transition-shadow dark:border-white/5 border border-transparent"
          >
            {hasChildren ? (
              <FolderIcon className="h-12 w-12 text-amber-500 dark:text-amber-400 mb-1" />
            ) : (
              <FolderOpenIcon className="h-12 w-12 text-blue-500 dark:text-blue-400 mb-1" />
            )}
            <span className="text-xs font-medium text-slate-800 dark:text-gray-200 text-center leading-tight break-words">
              {cat.name}
            </span>
            {!hasChildren && (
              <span className="text-xs text-slate-500 dark:text-gray-300 mt-0.5">
                {productCount} prod.
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default InventoryFolderGrid;
