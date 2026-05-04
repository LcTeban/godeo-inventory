import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  PlusIcon, MinusIcon, TrashIcon, CameraIcon, QrCodeIcon,
  DocumentArrowDownIcon, TableCellsIcon, PencilIcon 
} from '@heroicons/react/24/outline';
import BarcodeScanner from '../components/BarcodeScanner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import LazyImage from '../components/LazyImage';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '', category: '', stock: '', unit: 'unidad', min_stock: '10', 
    expiry_date: '', image: '', barcode: '', supplier_id: '', price: ''
  });
  const [movementData, setMovementData] = useState({
    type: 'entrada', quantity: '', reason: ''
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { currentRestaurant, isAdmin, getProducts, addProduct, updateProduct, deleteProduct, addMovement, getSuppliers, getProductById } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [currentRestaurant]);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await getProducts({ forceRefresh: true });
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error getting suppliers:', error);
    }
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({
      name: '', category: '', stock: '', unit: 'unidad', min_stock: '10',
      expiry_date: '', image: '', barcode: '', supplier_id: '', price: ''
    });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '', category: '', stock: '', unit: 'unidad', min_stock: '10',
      expiry_date: '', image: '', barcode: '', supplier_id: '', price: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    // Rellenar campos menos imagen (se cargará en breve)
    setFormData({
      name: product.name || '',
      category: product.category || '',
      stock: product.stock?.toString() || '',
      unit: product.unit || 'unidad',
      min_stock: product.min_stock?.toString() || '10',
      expiry_date: product.expiry_date || '',
      barcode: product.barcode || '',
      supplier_id: product.supplier_id ? product.supplier_id.toString() : '',
      price: product.price?.toString() || '',
      image: ''
    });
    setShowAddModal(true);

    // Cargar imagen real del producto en segundo plano
    if (product.id) {
      getProductById(product.id)
        .then(full => {
          if (full && full.image) {
            setFormData(prev => ({ ...prev, image: full.image }));
          }
        })
        .catch(() => {});
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await addProduct(formData);
      }
      resetModal();
      await fetchProducts();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addMovement({
        ...movementData,
        productId: selectedProduct.id
      });
      setShowMovementModal(false);
      setMovementData({ type: 'entrada', quantity: '', reason: '' });
      fetchProducts();
    } catch (error) {
      alert(error.message || 'Error al registrar movimiento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      try {
        await deleteProduct(id);
        fetchProducts();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return { color: 'bg-red-100 text-red-800', text: 'Agotado' };
    if (product.stock <= product.min_stock) return { color: 'bg-orange-100 text-orange-800', text: 'Bajo' };
    return { color: 'bg-green-100 text-green-800', text: 'OK' };
  };

  const exportToExcel = () => {
    const data = filteredProducts.map(p => ({
      'Nombre': p.name,
      'Categoría': p.category,
      'Stock': p.stock,
      'Unidad': p.unit,
      'Stock Mínimo': p.min_stock,
      'Caducidad': p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('es') : 'N/A',
      'Código': p.barcode || 'N/A',
      'Proveedor': p.suppliers?.name || '',
      'Precio': p.price || 0
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `inventario_${currentRestaurant}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Inventario - Godeo ${currentRestaurant}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es')}`, 14, 28);
    const tableData = filteredProducts.map(p => [
      p.name, p.category, `${p.stock} ${p.unit}`, p.min_stock,
      p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('es') : 'N/A',
      p.barcode || 'N/A', p.suppliers?.name || '', `€${p.price || 0}`
    ]);
    doc.autoTable({
      head: [['Producto', 'Categoría', 'Stock', 'Mínimo', 'Caducidad', 'Código', 'Proveedor', 'Precio']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    doc.save(`inventario_${currentRestaurant}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode?.includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const openCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => setFormData({ ...formData, image: event.target.result });
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const openGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => setFormData({ ...formData, image: event.target.result });
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };
  const { currentRestaurant, isAdmin, getProducts, addProduct, updateProduct, deleteProduct, addMovement, getSuppliers, getProductById, getProductImage } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Inventario</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportToExcel} className="p-2 bg-green-100 text-green-700 rounded-lg" title="Excel">
            <TableCellsIcon className="h-5 w-5" />
          </button>
          <button onClick={exportToPDF} className="p-2 bg-red-100 text-red-700 rounded-lg" title="PDF">
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
          {isAdmin && (
            <button onClick={openAddModal} className="bg-blue-600 text-white p-3 rounded-full shadow-lg">
              <PlusIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input type="text" placeholder="🔍 Buscar por nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border rounded-xl pl-10" />
          <QrCodeIcon className="h-5 w-5 absolute left-3 top-3.5 text-gray-400" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="p-3 border rounded-xl bg-white">
          <option value="all">Todas</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {isLoadingProducts && (
        <div className="animate-pulse space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      )}

      {!isLoadingProducts && (
        <div className="space-y-2">
          {filteredProducts.map(product => {
            const status = getStockStatus(product);
            const isExpiring = product.expiry_date && (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) <= 7;
            return (
              <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CameraIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{product.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.text}</span>
                      {isExpiring && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">⏰ Próximo</span>}
                    </div>
                    <p className="text-sm text-gray-500">{product.category}</p>
                    {product.suppliers?.name && <p className="text-xs text-gray-400">🏢 {product.suppliers.name}</p>}
                    {product.barcode && <p className="text-xs text-gray-400">🏷️ {product.barcode}</p>}
                    {isAdmin && product.price > 0 && <p className="text-xs text-gray-500">💰 €{product.price}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div><span className="text-2xl font-bold">{product.stock}</span><span className="text-sm text-gray-500 ml-1">{product.unit}</span></div>
                      {product.expiry_date && <div className="text-xs text-gray-500">Caduca: {new Date(product.expiry_date).toLocaleDateString('es')}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {isAdmin && (
                      <button onClick={() => openEditModal(product)} className="p-2 bg-yellow-100 text-yellow-700 rounded-lg" title="Editar">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button onClick={() => { setSelectedProduct(product); setMovementData({ type: 'entrada', quantity: '', reason: '' }); setShowMovementModal(true); }}
                      className="p-2 bg-green-100 text-green-700 rounded-lg"><PlusIcon className="h-5 w-5" /></button>
                    <button onClick={() => { setSelectedProduct(product); setMovementData({ type: 'salida', quantity: '', reason: '' }); setShowMovementModal(true); }}
                      className="p-2 bg-red-100 text-red-700 rounded-lg" disabled={product.stock === 0}><MinusIcon className="h-5 w-5" /></button>
                    {isAdmin && <button onClick={() => handleDelete(product.id)} className="p-2 bg-gray-100 text-gray-700 rounded-lg"><TrashIcon className="h-5 w-5" /></button>}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && !isLoadingProducts && (
            <div className="text-center py-8 text-gray-500">No hay productos</div>
          )}
        </div>
      )}

      {/* Modal Agregar/Editar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">📸 Foto del producto</label>
                <div className="flex gap-2">
                  <button type="button" onClick={openCamera} className="flex-1 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm flex items-center justify-center gap-2 border border-blue-200">
                    <CameraIcon className="h-5 w-5" /> Cámara
                  </button>
                  <button type="button" onClick={openGallery} className="flex-1 p-3 bg-gray-50 text-gray-700 rounded-xl text-sm flex items-center justify-center gap-2 border border-gray-200">
                    🖼️ Galería
                  </button>
                </div>
                {formData.image && (
                  <div className="mt-3 relative inline-block">
                    <img src={formData.image} alt="Vista previa" className="w-20 h-20 object-cover rounded-lg border" />
                    <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow">✕</button>
                  </div>
                )}
              </div>

              <input type="text" placeholder="Nombre*" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl" required />
              <input type="text" placeholder="Categoría*" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-3 border rounded-xl" required />
              
              <div>
                <label className="block text-sm font-medium mb-1">🏢 Proveedor</label>
                <select value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} className="w-full p-3 border rounded-xl">
                  <option value="">Sin proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium mb-1">💰 Precio (€)</label>
                  <input type="number" step="0.01" placeholder="Precio unitario" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full p-3 border rounded-xl" />
                </div>
              )}

              <div className="flex gap-2">
                <input type="number" step="0.01" placeholder="Stock inicial*" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="flex-1 p-3 border rounded-xl" required />
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-24 p-3 border rounded-xl">
                  <option value="unidad">ud</option><option value="kg">kg</option><option value="L">L</option><option value="caja">caja</option>
                </select>
              </div>
              <input type="number" placeholder="Stock mínimo" value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: e.target.value})} className="w-full p-3 border rounded-xl" />
              <input type="date" placeholder="Fecha caducidad" value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} className="w-full p-3 border rounded-xl" />
              <div className="flex gap-2">
                <input type="text" placeholder="Código de barras" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="flex-1 p-3 border rounded-xl" />
                <button type="button" onClick={() => setShowScanner(true)} className="px-4 bg-gray-100 rounded-xl"><QrCodeIcon className="h-5 w-5" /></button>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={resetModal} className="flex-1 p-3 border rounded-xl">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 p-3 bg-blue-600 text-white rounded-xl disabled:opacity-50">
                  {isSaving ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimiento (sin cambios) */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {movementData.type === 'entrada' ? '📥 Entrada' : '📤 Salida'} - {selectedProduct?.name}
            </h2>
            <form onSubmit={handleMovement} className="space-y-3">
              <div className="text-center p-4 bg-gray-100 rounded-xl">
                <span className="text-3xl font-bold">{selectedProduct?.stock}</span>
                <span className="text-gray-600 ml-1">{selectedProduct?.unit}</span>
                <p className="text-sm text-gray-500">Stock actual</p>
              </div>
              <input type="number" step="0.01" placeholder="Cantidad" value={movementData.quantity}
                onChange={(e) => setMovementData({...movementData, quantity: e.target.value})}
                className="w-full p-3 border rounded-xl text-lg text-center" required autoFocus />
              <input type="text" placeholder="Motivo (opcional)" value={movementData.reason}
                onChange={(e) => setMovementData({...movementData, reason: e.target.value})}
                className="w-full p-3 border rounded-xl" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowMovementModal(false)} className="flex-1 p-3 border rounded-xl">Cancelar</button>
                <button type="submit" disabled={isSaving} className={`flex-1 p-3 text-white rounded-xl disabled:opacity-50 ${movementData.type === 'entrada' ? 'bg-green-600' : 'bg-red-600'}`}>
                  {isSaving ? 'Registrando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner onScan={(code) => { setFormData({...formData, barcode: code}); setShowScanner(false); }} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default Inventory;
