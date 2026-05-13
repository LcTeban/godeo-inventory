import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, MinusIcon, TrashIcon, CameraIcon, QrCodeIcon,
  DocumentArrowDownIcon, TableCellsIcon, PencilIcon,
  FolderIcon, FolderOpenIcon, ArrowLeftIcon, DocumentDuplicateIcon,
  XMarkIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import BarcodeScanner from '../components/BarcodeScanner';
import LazyImage from '../components/LazyImage';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', category_id: '', stock: '', unit: 'unidad', min_stock: '10',
    expiry_date: '', image: '', barcode: '', supplier_id: '', price: ''
  });
  const [movementData, setMovementData] = useState({
    type: 'entrada', quantity: '', reason: ''
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copyTarget, setCopyTarget] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  const {
    currentRestaurant, isAdmin, getProducts, addProduct, updateProduct, deleteProduct,
    addMovement, getSuppliers, getProductById, getProductImage, getAllCategoriesFlat,
    duplicateProduct, deleteUncategorizedProducts
  } = useAuth();

  const isAnyModalOpen = showAddModal || showMovementModal || showCopyModal || showDeleteAllModal || showScanner;
  useLockBodyScroll(isAnyModalOpen);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    loadCategories();
  }, [currentRestaurant]);

  useEffect(() => {
    const handleOpenAddProduct = () => {
      setEditingProduct(null);
      setFormData({
        name: '', category_id: '', stock: '', unit: 'unidad', min_stock: '10',
        expiry_date: '', image: '', barcode: '', supplier_id: '', price: ''
      });
      setShowAddModal(true);
    };
    window.addEventListener('openAddProduct', handleOpenAddProduct);
    return () => window.removeEventListener('openAddProduct', handleOpenAddProduct);
  }, []);

  const loadCategories = async () => {
    const flat = await getAllCategoriesFlat();
    setAllCategories(flat || []);
  };

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
      name: '', category_id: '', stock: '', unit: 'unidad', min_stock: '10',
      expiry_date: '', image: '', barcode: '', supplier_id: '', price: ''
    });
  };

  const openAddModal = (presetCategoryId = null) => {
    setEditingProduct(null);
    setFormData({
      name: '', category_id: presetCategoryId || '', stock: '', unit: 'unidad', min_stock: '10',
      expiry_date: '', image: '', barcode: '', supplier_id: '', price: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category_id: product.category_id ? product.category_id.toString() : '',
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

  const handleCopyProduct = async () => {
    if (!copyTarget || copyTarget === currentRestaurant) {
      alert('Selecciona un restaurante de destino diferente al actual.');
      return;
    }
    setIsCopying(true);
    try {
      await duplicateProduct(selectedProduct.id, copyTarget);
      setShowCopyModal(false);
      setCopyTarget('');
      alert('✅ Producto copiado con éxito.');
    } catch (error) {
      alert('Error al copiar: ' + error.message);
    } finally {
      setIsCopying(false);
    }
  };

  const openCopyModal = (product) => {
    setSelectedProduct(product);
    setCopyTarget('');
    setShowCopyModal(true);
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return { color: 'bg-red-100 text-red-700', text: 'Agotado' };
    if (product.stock <= product.min_stock) return { color: 'bg-amber-100 text-amber-700', text: 'Bajo' };
    return { color: 'bg-emerald-100 text-emerald-700', text: 'OK' };
  };

  const getDisplayedProducts = () => {
    if (searchTerm.trim() !== '') {
      return products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm)
      );
    }
    if (currentFolderId === null) {
      return products.filter(p => !p.category_id);
    }
    return products.filter(p => p.category_id === currentFolderId);
  };

  const displayedProducts = getDisplayedProducts();

  const exportToExcel = () => {
    const data = displayedProducts.map(p => ({
      'Nombre': p.name,
      'Categoría': p.categories?.name || '',
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
    doc.text(`Inventario – Godeo ${currentRestaurant}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es')}`, 14, 28);
    const tableData = displayedProducts.map(p => [
      p.name,
      p.categories?.name || '',
      `${p.stock} ${p.unit}`,
      p.min_stock,
      p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('es') : 'N/A',
      p.barcode || 'N/A',
      p.suppliers?.name || '',
      `€${p.price || 0}`
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

  const navigateToFolder = (folderId) => {
    setFolderPath(prev => [...prev, currentFolderId]);
    setCurrentFolderId(folderId);
  };

  const goBack = () => {
    if (folderPath.length > 0) {
      const previousId = folderPath[folderPath.length - 1];
      setFolderPath(prev => prev.slice(0, -1));
      setCurrentFolderId(previousId);
    } else {
      setCurrentFolderId(null);
    }
  };

  const currentCategories = (() => {
    if (currentFolderId === null) {
      return allCategories.filter(c => c.parent_id === null);
    }
    return allCategories.filter(c => c.parent_id === currentFolderId);
  })();

  const currentProductsInFolder = (() => {
    if (currentFolderId === null) return [];
    return products.filter(p => p.category_id === currentFolderId);
  })();

  const uncategorizedProducts = products.filter(p => !p.category_id);

  const currentFolderName = currentFolderId
    ? (allCategories.find(c => c.id === currentFolderId)?.name || '')
    : '';

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

  const handleDeleteAllUncategorized = async () => {
    if (!isAdmin) return;
    setIsDeletingAll(true);
    try {
      const result = await deleteUncategorizedProducts(currentRestaurant);
      alert(`✅ Se eliminaron ${result.deleted} productos sin categoría.`);
      setShowDeleteAllModal(false);
      setDeleteConfirmText('');
      await fetchProducts();
    } catch (error) {
      alert('❌ Error al eliminar: ' + error.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const ProductList = ({ products }) => (
    <div className="space-y-2">
      {products.map(product => {
        const status = getStockStatus(product);
        const isExpiring = product.expiry_date && (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) <= 7;
        return (
          <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <LazyImage productId={product.id} fetchImage={getProductImage} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{product.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.text}</span>
                    {isExpiring && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⏰ Próximo</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                  {product.categories?.name && <span>📁 {product.categories.name}</span>}
                  {product.suppliers?.name && <span>🏢 {product.suppliers.name}</span>}
                  {product.barcode && <span>🏷️ {product.barcode}</span>}
                  {isAdmin && product.price > 0 && <span>💰 €{product.price}</span>}
                  {product.expiry_date && <span>📅 Caduca: {new Date(product.expiry_date).toLocaleDateString('es')}</span>}
                </div>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <span className="text-xl font-bold text-slate-900">{product.stock}</span>
                    <span className="text-sm text-slate-500 ml-1">{product.unit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <>
                        <button onClick={() => openEditModal(product)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Editar">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => openCopyModal(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Copiar a otro restaurante">
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => { setSelectedProduct(product); setMovementData({ type: 'entrada', quantity: '', reason: '' }); setShowMovementModal(true); }}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Entrada">
                      <PlusIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setSelectedProduct(product); setMovementData({ type: 'salida', quantity: '', reason: '' }); setShowMovementModal(true); }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" disabled={product.stock === 0} title="Salida">
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg" title="Eliminar">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentFolderId !== null && (
            <button onClick={goBack} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200" title="Volver">
              <ArrowLeftIcon className="h-5 w-5 text-slate-600" />
            </button>
          )}
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {currentFolderId ? currentFolderName : 'Inventario'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportToExcel} className="p-2 bg-emerald-50 text-emerald-700 rounded-lg" title="Excel">
            <TableCellsIcon className="h-5 w-5" />
          </button>
          <button onClick={exportToPDF} className="p-2 bg-red-50 text-red-700 rounded-lg" title="PDF">
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
          {isAdmin && (
            <button onClick={() => openAddModal(currentFolderId)} className="bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-200">
              <PlusIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Buscar en todo el inventario..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value.trim() !== '') {
              setCurrentFolderId(null);
              setFolderPath([]);
            }
          }}
          className="w-full p-3 bg-white rounded-2xl shadow-sm pl-10 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition"
        />
        <QrCodeIcon className="h-5 w-5 absolute left-3 top-3.5 text-slate-400" />
      </div>

      {/* Contenido principal */}
      {isLoadingProducts ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl shadow-sm"></div>
          ))}
        </div>
      ) : searchTerm.trim() !== '' ? (
        <>
          <p className="text-sm text-slate-500">
            Resultados para «{searchTerm}» ({displayedProducts.length})
          </p>
          <ProductList products={displayedProducts} />
        </>
      ) : (
        <>
          {/* Carpetas */}
          {currentCategories.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {currentCategories.map(cat => {
                const hasChildren = allCategories.some(c => c.parent_id === cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigateToFolder(cat.id)}
                    className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    {hasChildren ? (
                      <FolderIcon className="h-12 w-12 text-amber-500 mb-1" />
                    ) : (
                      <FolderOpenIcon className="h-12 w-12 text-blue-500 mb-1" />
                    )}
                    <span className="text-xs font-medium text-slate-800 text-center leading-tight break-words">
                      {cat.name}
                    </span>
                    {!hasChildren && (
                      <span className="text-xs text-slate-500 mt-0.5">
                        {products.filter(p => p.category_id === cat.id).length} prod.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Productos en carpeta actual */}
          {currentFolderId && currentProductsInFolder.length > 0 && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-slate-600 mb-2">Productos en {currentFolderName}</h2>
              <ProductList products={currentProductsInFolder} />
            </div>
          )}

          {/* Productos sin categoría */}
          {uncategorizedProducts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-600">📂 Productos sin categoría ({uncategorizedProducts.length})</h2>
                {isAdmin && (
                  <button
                    onClick={() => setShowDeleteAllModal(true)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center gap-1"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Eliminar todos
                  </button>
                )}
              </div>
              <ProductList products={uncategorizedProducts} />
            </div>
          )}

          {/* Estado completamente vacío */}
          {currentCategories.length === 0 && currentProductsInFolder.length === 0 && uncategorizedProducts.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <FolderIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay productos ni categorías</p>
            </div>
          )}
        </>
      )}

      {/* Modal Agregar/Editar Producto (Bottom Sheet) */}
      {showAddModal && (
        <div className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center'} bg-black/30 backdrop-blur-sm`} onClick={resetModal}>
          <div
            className={`bg-white w-full max-w-md flex flex-col shadow-2xl ${
              isMobile
                ? 'rounded-t-[32px] animate-slide-up max-h-[85dvh] mb-12'
                : 'rounded-2xl max-h-[90vh]'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {isMobile && <div className="bottom-sheet-handle" />}
            <div className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4 modal-scroll" style={{ paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '16px' }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">📸 Foto del producto</label>
                <div className="flex gap-2">
                  <button type="button" onClick={openCamera} className="flex-1 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm flex items-center justify-center gap-2 border border-blue-200">
                    <CameraIcon className="h-5 w-5" /> Cámara
                  </button>
                  <button type="button" onClick={openGallery} className="flex-1 p-3 bg-slate-50 text-slate-700 rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-200">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input type="text" placeholder="Nombre*" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">📁 Categoría</label>
                <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition">
                  <option value="">General (sin categoría)</option>
                  {allCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.label || cat.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">🏢 Proveedor</label>
                <select value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition">
                  <option value="">Sin proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">💰 Precio (€)</label>
                  <input type="number" step="0.01" placeholder="Precio unitario" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" />
                </div>
              )}

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock inicial *</label>
                  <input type="number" step="0.01" placeholder="Stock inicial*" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" required />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                  <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition">
                    <option value="unidad">ud</option><option value="kg">kg</option><option value="L">L</option><option value="caja">caja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock mínimo</label>
                <input type="number" placeholder="Stock mínimo" value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha caducidad</label>
                <input type="date" placeholder="Fecha caducidad" value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código de barras</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Código de barras" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" />
                    <button type="button" onClick={() => setShowScanner(true)} className="px-4 bg-slate-100 rounded-xl"><QrCodeIcon className="h-5 w-5" /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button type="button" onClick={resetModal} className="flex-1 p-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={handleAddProduct} disabled={isSaving} className="flex-1 p-3 bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition">
                {isSaving ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimiento (Bottom Sheet) */}
      {showMovementModal && (
        <div className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center'} bg-black/30 backdrop-blur-sm`} onClick={() => setShowMovementModal(false)}>
          <div className={`bg-white w-full max-w-md flex flex-col shadow-2xl ${
            isMobile ? 'rounded-t-[32px] animate-slide-up mb-12' : 'rounded-2xl'
          }`} onClick={e => e.stopPropagation()}>
            {isMobile && <div className="bottom-sheet-handle" />}
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {movementData.type === 'entrada' ? '📥 Entrada' : '📤 Salida'} - {selectedProduct?.name}
              </h2>
              <form onSubmit={handleMovement} className="space-y-3">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <span className="text-3xl font-bold text-slate-900">{selectedProduct?.stock}</span>
                  <span className="text-slate-500 ml-1">{selectedProduct?.unit}</span>
                  <p className="text-sm text-slate-400">Stock actual</p>
                </div>
                <input type="number" step="0.01" placeholder="Cantidad" value={movementData.quantity}
                  onChange={(e) => setMovementData({...movementData, quantity: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-lg text-center focus:ring-2 focus:ring-blue-500/20 outline-none transition" required autoFocus />
                <input type="text" placeholder="Motivo (opcional)" value={movementData.reason}
                  onChange={(e) => setMovementData({...movementData, reason: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowMovementModal(false)} className="flex-1 p-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition">Cancelar</button>
                  <button type="submit" disabled={isSaving} className={`flex-1 p-3 text-white rounded-xl shadow-sm disabled:opacity-50 transition ${movementData.type === 'entrada' ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' : 'bg-red-600 shadow-red-200 hover:bg-red-700'}`}>
                    {isSaving ? 'Registrando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Copiar Producto */}
      {showCopyModal && selectedProduct && (
        <div className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center'} bg-black/30 backdrop-blur-sm`} onClick={() => setShowCopyModal(false)}>
          <div className={`bg-white w-full max-w-md flex flex-col shadow-2xl ${
            isMobile ? 'rounded-t-[32px] animate-slide-up mb-12' : 'rounded-2xl'
          }`} onClick={e => e.stopPropagation()}>
            {isMobile && <div className="bottom-sheet-handle" />}
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">📋 Copiar Producto</h2>
              <p className="text-sm text-slate-500 mb-4">
                Copiarás <strong className="text-slate-700">{selectedProduct.name}</strong> a otro restaurante.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">🏢 Restaurante destino</label>
                  <select value={copyTarget} onChange={(e) => setCopyTarget(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition">
                    <option value="">Seleccionar destino</option>
                    {['POZOBLANCO', 'FUERTEVENTURA', 'GRAN_CAPITAN'].filter(r => r !== currentRestaurant).map(r => (
                      <option key={r} value={r}>{r === 'POZOBLANCO' ? '🍽️ Pozoblanco' : r === 'FUERTEVENTURA' ? '🏖️ Fuerteventura' : '🏛️ Gran Capitán'}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowCopyModal(false)} className="flex-1 p-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition">Cancelar</button>
                  <button onClick={handleCopyProduct} disabled={isCopying || !copyTarget} className="flex-1 p-3 bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition">
                    {isCopying ? 'Copiando...' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar todos sin categoría */}
      {showDeleteAllModal && (
        <div className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center'} bg-black/30 backdrop-blur-sm`} onClick={() => setShowDeleteAllModal(false)}>
          <div className={`bg-white w-full max-w-md flex flex-col shadow-2xl ${
            isMobile ? 'rounded-t-[32px] animate-slide-up mb-12' : 'rounded-2xl'
          }`} onClick={e => e.stopPropagation()}>
            {isMobile && <div className="bottom-sheet-handle" />}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Eliminar productos sin categoría</h2>
              </div>
              <p className="text-sm text-slate-500 mb-2">Esta acción eliminará permanentemente los {uncategorizedProducts.length} productos sin categoría.</p>
              <p className="text-sm text-slate-500 mb-4">Escribe <span className="font-bold text-red-600">ELIMINAR</span> para confirmar.</p>
              <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Escribe ELIMINAR para confirmar"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none transition mb-4" autoFocus />
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteAllModal(false); setDeleteConfirmText(''); }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition">Cancelar</button>
                <button onClick={handleDeleteAllUncategorized} disabled={deleteConfirmText !== 'ELIMINAR' || isDeletingAll}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl shadow-sm shadow-red-200 hover:bg-red-700 disabled:opacity-50 transition">
                  {isDeletingAll ? 'Eliminando...' : 'Eliminar todos'}
                </button>
              </div>
            </div>
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
