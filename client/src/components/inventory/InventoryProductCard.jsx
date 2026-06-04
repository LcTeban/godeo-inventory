import { motion } from 'framer-motion';
import {
  PlusIcon, MinusIcon, TrashIcon, PencilIcon, DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import LazyImage from '../LazyImage';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

const InventoryProductCard = ({
  product,
  isAdmin,
  getStockStatus,
  getProductImage,
  onEdit,
  onCopy,
  onEntrada,
  onSalida,
  onDelete,
}) => {
  const status = getStockStatus(product);
  const isExpiring = product.expiry_date && (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) <= 7;

  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-card dark:shadow-card-dark"
      variants={itemVariants}
      layout
    >
      <div className="flex items-start gap-3">
        <LazyImage productId={product.id} fetchImage={getProductImage} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{product.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.text}</span>
              {isExpiring && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">⏰ Próximo</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-gray-300">
            {product.categories?.name && <span>📁 {product.categories.name}</span>}
            {product.suppliers?.name && <span>🏢 {product.suppliers.name}</span>}
            {product.barcode && <span>🏷️ {product.barcode}</span>}
            {isAdmin && product.price > 0 && <span>💰 €{product.price}</span>}
            {product.expiry_date && <span>📅 Caduca: {new Date(product.expiry_date).toLocaleDateString('es')}</span>}
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{product.stock}</span>
              <span className="text-sm text-slate-500 dark:text-gray-300 ml-1">{product.unit}</span>
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <>
                  <button onClick={() => onEdit(product)} className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg" title="Editar">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => onCopy(product)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Copiar a otro restaurante">
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                </>
              )}
              <button onClick={() => onEntrada(product)} className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg" title="Entrada">
                <PlusIcon className="h-4 w-4" />
              </button>
              <button onClick={() => onSalida(product)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" disabled={product.stock === 0} title="Salida">
                <MinusIcon className="h-4 w-4" />
              </button>
              {isAdmin && (
                <button onClick={() => onDelete(product.id)} className="p-1.5 text-slate-400 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg" title="Eliminar">
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryProductCard;
