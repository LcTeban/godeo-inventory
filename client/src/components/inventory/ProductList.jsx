import { motion } from 'framer-motion';
import InventoryProductCard from './InventoryProductCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const ProductList = ({ products, isAdmin, getStockStatus, getProductImage, onEdit, onCopy, onEntrada, onSalida, onDelete }) => (
  <motion.div
    className="space-y-3"
    variants={containerVariants}
    initial="hidden"
    animate="visible"
  >
    {products.map(product => (
      <InventoryProductCard
        key={product.id}
        product={product}
        isAdmin={isAdmin}
        getStockStatus={getStockStatus}
        getProductImage={getProductImage}
        onEdit={onEdit}
        onCopy={onCopy}
        onEntrada={onEntrada}
        onSalida={onSalida}
        onDelete={onDelete}
      />
    ))}
  </motion.div>
);

export default ProductList;
