import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon,
  ClipboardDocumentListIcon, CheckCircleIcon, XCircleIcon, ClockIcon
} from '@heroicons/react/24/outline';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';

const Requests = () => {
  const { isAdmin, user, getRequests, addRequest, updateRequest, getProducts } = useAuth();
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    items: [{ productName: '', quantity: '', unit: 'unidad' }],
    notes: ''
  });
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  const [productExists, setProductExists] = useState({});

  useLockBodyScroll(showModal);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reqData, prodData] = await Promise.all([
        getRequests(),
        getProducts()
      ]);
      setRequests(Array.isArray(reqData) ? reqData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los pedidos');
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: '', unit: 'unidad' }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (field === 'productName') {
        const exists = products.some(p => p.name.toLowerCase() === value.toLowerCase());
        setProductExists(prev2 => ({ ...prev2, [index]: exists }));
        
        if (exists) {
          const selectedProduct = products.find(p => p.name.toLowerCase() === value.toLowerCase());
          if (selectedProduct) {
            newItems[index].unit = selectedProduct.unit || 'unidad';
          }
        }
      }
      
      return { ...prev, items: newItems };
    });
    
    if (field === 'productName') {
      setActiveSuggestionIndex(index);
    }
  };

  const handleSelectSuggestion = (index, product) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        productName: product.name,
        unit: product.unit || 'unidad'
      };
      return { ...prev, items: newItems };
    });
    setProductExists(prev => ({ ...prev, [index]: true }));
    setActiveSuggestionIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = formData.items.filter(item => item.productName && item.quantity);
    if (validItems.length === 0) {
      toast.error('Agrega al menos un producto con nombre y cantidad');
      return;
    }

    try {
      for (const item of validItems) {
        await addRequest({
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          notes: formData.notes.trim() || null
        });
      }
      
      setShowModal(false);
      setFormData({ items: [{ productName: '', quantity: '', unit: 'unidad' }], notes: '' });
      setActiveSuggestionIndex(null);
      setProductExists({});
      loadData();
      toast.success('Pedido enviado correctamente');
      
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('✅ Pedido enviado', {
          body: `${validItems.length} producto(s) solicitados`,
          icon: '/godeo-inventory/icon-192.png'
        });
      }
    } catch (error) {
      toast.error('Error al enviar: ' + error.message);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateRequest(id, status);
      loadData();
      toast.success(status === 'aprobado' ? 'Pedido aprobado' : 'Pedido rechazado');
      
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const request = requests.find(r => r.id === id);
        if (request) {
          const title = status === 'aprobado' ? '✅ Pedido Aprobado' : '❌ Pedido Rechazado';
          const body = `${request.product_name} (${request.quantity} ${request.unit})`;
          new Notification(title, { body, icon: '/godeo-inventory/icon-192.png' });
        }
      }
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const getSuggestions = (input) => {
    if (!input || input.length < 1) return [];
    const search = input.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(search) || p.barcode?.includes(search))
      .slice(0, 5);
  };

  const myRequests = requests.filter(r => r.user_id === user?.id);
  const pendingRequests = isAdmin ? requests.filter(r => r.status === 'pendiente') : [];

  const filteredMyRequests = myRequests.filter(r => {
    const matchesSearch = !searchTerm || r.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredPending = pendingRequests.filter(r => {
    const matchesSearch = !searchTerm || r.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = pendingRequests.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
  };

  const modalVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { y: '100%', opacity: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  };

  const desktopModalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">📋 Pedidos</h1>
          <p className="text-sm text-slate-500 dark:text-gray-300 mt-1">
            {isAdmin ? 'Gestiona las solicitudes de los empleados' : 'Solicita los productos que necesites'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-orange-600 transition shadow-sm shadow-orange-200"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva Lista
        </button>
      </div>

      {/* KPIs (solo admin) */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 flex flex-col items-start">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl mb-3">
              <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pendingCount}</p>
            <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 tracking-wide">Pendientes</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 flex flex-col items-start">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl mb-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {requests.filter(r => {
                if (r.status !== 'aprobado') return false;
                const today = new Date();
                const date = new Date(r.updated_at || r.created_at);
                return date.toDateString() === today.toDateString();
              }).length}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 tracking-wide">Aprobados hoy</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 flex flex-col items-start">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl mb-3">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{requests.length}</p>
            <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 tracking-wide">Total solicitudes</p>
          </div>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-slate-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Buscar por nombre de producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
        >
          <option value="all">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobado">Aprobados</option>
          <option value="rechazado">Rechazados</option>
        </select>
      </div>

      {/* Mis Solicitudes */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30 overflow-hidden dark:border-white/5 border border-transparent">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="font-bold text-slate-900 dark:text-white">📝 Mis Solicitudes ({filteredMyRequests.length})</h2>
        </div>
        {myRequests.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={ClipboardDocumentListIcon}
              title="Sin solicitudes"
              message="Crea una nueva lista de pedidos para solicitar productos"
              actionLabel="Nueva Lista"
              onAction={() => setShowModal(true)}
            />
          </div>
        ) : filteredMyRequests.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={MagnifyingGlassIcon}
              title="Sin resultados"
              message="Prueba con otro término de búsqueda o cambia el filtro"
              actionLabel="Ver todas"
              onAction={() => { setSearchTerm(''); setFilterStatus('all'); }}
            />
          </div>
        ) : (
          <motion.div className="divide-y divide-slate-100 dark:divide-white/5" variants={containerVariants} initial="hidden" animate="visible">
            {filteredMyRequests.map((req) => (
              <motion.div key={req.id} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition" variants={itemVariants}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{req.product_name}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-300 mt-0.5">
                      {req.quantity} {req.unit}
                      {req.notes && <span className="text-slate-400 dark:text-gray-300 ml-2">· {req.notes}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs text-slate-400 dark:text-gray-300">
                      {new Date(req.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      req.status === 'pendiente' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700' :
                      req.status === 'aprobado' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700' :
                      'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700'
                    }`}>
                      {req.status === 'pendiente' ? '⏳' : req.status === 'aprobado' ? '✅' : '❌'} {req.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Panel Admin - Pendientes de aprobar */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30 overflow-hidden dark:border-white/5 border border-transparent">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
            <h2 className="font-bold text-slate-900 dark:text-white">
              ⏳ Pendientes de aprobar
              <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium">
                {filteredPending.length}
              </span>
            </h2>
          </div>
          {filteredPending.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={MagnifyingGlassIcon}
                title="Sin resultados"
                message="No hay pendientes que coincidan con la búsqueda"
                actionLabel="Limpiar búsqueda"
                onAction={() => setSearchTerm('')}
              />
            </div>
          ) : (
            <motion.div className="divide-y divide-slate-100 dark:divide-white/5" variants={containerVariants} initial="hidden" animate="visible">
              {filteredPending.map((req) => (
                <motion.div key={req.id} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition" variants={itemVariants}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-900 dark:text-white">{req.product_name}</p>
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded font-medium">
                          {req.restaurant}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-gray-300">
                        {req.quantity} {req.unit}
                        <span className="text-slate-400 dark:text-gray-300 ml-2">· Solicitado por {req.users?.name || 'Empleado'}</span>
                      </p>
                      {req.notes && (
                        <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 italic">"{req.notes}"</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleStatus(req.id, 'aprobado')}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm shadow-emerald-200"
                      >
                        ✓ Aprobar
                      </button>
                      <button
                        onClick={() => handleStatus(req.id, 'rechazado')}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition"
                      >
                        ✗ Rechazar
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Modal Nueva Lista */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center'} bg-black/30 backdrop-blur-sm`}
            onClick={() => setShowModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`bg-white dark:bg-gray-900 w-full max-w-lg flex flex-col shadow-2xl dark:shadow-black/50 ${
                isMobile ? 'rounded-t-[32px] mb-12' : 'rounded-2xl'
              }`}
              style={isMobile ? { maxHeight: '85dvh' } : { maxHeight: '85vh' }}
              onClick={e => e.stopPropagation()}
              variants={isMobile ? modalVariants : desktopModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {isMobile && <div className="bottom-sheet-handle" />}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 flex-shrink-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">📋 Nueva Lista de Pedidos</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ items: [{ productName: '', quantity: '', unit: 'unidad' }], notes: '' });
                    setActiveSuggestionIndex(null);
                    setProductExists({});
                  }}
                  className="p-2 text-slate-400 dark:text-gray-300 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 modal-scroll" style={{ paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '16px' }}>
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 border border-slate-100 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-gray-300 uppercase tracking-wider">
                        Producto {index + 1}
                      </span>
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-1.5 text-slate-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="relative mb-3">
                      <input
                        type="text"
                        placeholder="Buscar producto o escribir nombre..."
                        value={item.productName}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                        onFocus={() => setActiveSuggestionIndex(index)}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition"
                        autoComplete="off"
                      />
                      
                      {item.productName && (
                        <div className="mt-1">
                          {productExists[index] ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">✓ Producto del inventario</span>
                          ) : (
                            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">⚠️ Producto nuevo</span>
                          )}
                        </div>
                      )}
                      
                      {activeSuggestionIndex === index && getSuggestions(item.productName).length > 0 && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                          {getSuggestions(item.productName).map(product => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleSelectSuggestion(index, product)}
                              className="w-full px-4 py-3 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition flex items-center justify-between"
                            >
                              <div>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{product.name}</span>
                                <span className="text-xs text-slate-400 dark:text-gray-300 ml-2">{product.category}</span>
                              </div>
                              <span className="text-xs text-slate-500 dark:text-gray-300">{product.stock} {product.unit}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-500 dark:text-gray-300 mb-1">Cantidad</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition"
                          required
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-slate-500 dark:text-gray-300 mb-1">Unidad</label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none"
                        >
                          <option value="unidad">ud</option>
                          <option value="kg">kg</option>
                          <option value="L">L</option>
                          <option value="caja">caja</option>
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-300 rounded-xl text-sm font-medium hover:border-orange-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition"
                >
                  + Agregar otro producto
                </button>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-gray-300 mb-1">📝 Notas generales</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instrucciones adicionales..."
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition resize-none"
                    rows="2"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ items: [{ productName: '', quantity: '', unit: 'unidad' }], notes: '' });
                    setActiveSuggestionIndex(null);
                    setProductExists({});
                  }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-800 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition shadow-sm shadow-orange-200"
                >
                  Enviar Lista
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Requests;
