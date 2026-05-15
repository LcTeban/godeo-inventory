import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MagnifyingGlassIcon, FunnelIcon, XMarkIcon,
  TruckIcon, CheckCircleIcon, ClockIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';

const Transfers = () => {
  const { currentRestaurant, isAdmin, getTransfers, getProducts, addTransfer, completeTransfer } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDirection, setFilterDirection] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '', quantity: '', toRestaurant: '', reason: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(null);

  useLockBodyScroll(showModal);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, [currentRestaurant]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transData, prodData] = await Promise.all([
        getTransfers(),
        getProducts()
      ]);
      setTransfers(Array.isArray(transData) ? transData : []);
      setProducts((Array.isArray(prodData) ? prodData : []).filter(p => p.stock > 0));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las transferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity || !formData.toRestaurant) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    setIsSaving(true);
    try {
      await addTransfer(formData);
      setShowModal(false);
      setFormData({ productId: '', quantity: '', toRestaurant: '', reason: '' });
      loadData();
      toast.success('Transferencia enviada correctamente');
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (id) => {
    setIsCompleting(id);
    try {
      await completeTransfer(id);
      loadData();
      toast.success('Transferencia confirmada correctamente');
    } catch (error) {
      toast.error('Error al completar: ' + error.message);
    } finally {
      setIsCompleting(null);
    }
  };

  // Filtrado
  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = !searchTerm || 
      t.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.from_restaurant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.to_restaurant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    
    let matchesDirection = true;
    if (filterDirection === 'outgoing') {
      matchesDirection = t.from_restaurant === currentRestaurant;
    } else if (filterDirection === 'incoming') {
      matchesDirection = t.to_restaurant === currentRestaurant;
    }
    
    return matchesSearch && matchesStatus && matchesDirection;
  });

  const pendingCount = transfers.filter(t => t.status === 'pendiente').length;
  const completedToday = transfers.filter(t => {
    if (t.status !== 'completado') return false;
    const today = new Date();
    const completed = new Date(t.completed_at || t.created_at);
    return completed.toDateString() === today.toDateString();
  }).length;

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️' }
  ];

  const availableDestinations = restaurants.filter(r => r.id !== currentRestaurant);

  // Variantes de animación stagger para la lista
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 120, damping: 18 },
    },
  };

  // Variantes para modales
  const modalVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
  };

  const desktopModalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 25 },
    },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white rounded-2xl w-1/3 shadow-sm"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-white rounded-2xl shadow-sm"></div>
          <div className="h-16 bg-white rounded-2xl shadow-sm"></div>
          <div className="h-16 bg-white rounded-2xl shadow-sm"></div>
        </div>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl shadow-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">🚚 Transferencias</h1>
          <p className="text-sm text-slate-500 mt-1">Envía y recibe productos entre sucursales</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-orange-600 transition shadow-sm shadow-orange-200"
        >
          <TruckIcon className="h-4 w-4" /> Nueva Transferencia
        </button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-start">
          <div className="p-2 bg-amber-50 rounded-xl mb-3">
            <ClockIcon className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-1 tracking-wide">Pendientes</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-start">
          <div className="p-2 bg-emerald-50 rounded-xl mb-3">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{completedToday}</p>
          <p className="text-xs text-slate-500 mt-1 tracking-wide">Completadas hoy</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-start">
          <div className="p-2 bg-blue-50 rounded-xl mb-3">
            <ArrowPathIcon className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{transfers.length}</p>
          <p className="text-xs text-slate-500 mt-1 tracking-wide">Total</p>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por producto, restaurante o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              showFilters || filterStatus !== 'all' || filterDirection !== 'all' 
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-200' 
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
          </button>
          {(filterStatus !== 'all' || filterDirection !== 'all') && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterDirection('all'); }}
              className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
              >
                <option value="all">Todos</option>
                <option value="pendiente">⏳ Pendientes</option>
                <option value="completado">✅ Completadas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Dirección</label>
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
              >
                <option value="all">Todas</option>
                <option value="outgoing">📤 Enviadas</option>
                <option value="incoming">📥 Recibidas</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de transferencias */}
      {filteredTransfers.length === 0 ? (
        transfers.length === 0 ? (
          <EmptyState
            icon={TruckIcon}
            title="Sin transferencias"
            message="Crea la primera transferencia entre sucursales"
            actionLabel="Nueva transferencia"
            onAction={() => setShowModal(true)}
          />
        ) : (
          <EmptyState
            icon={FunnelIcon}
            title="Sin resultados"
            message="Ajusta los filtros para ver más resultados"
            actionLabel="Limpiar filtros"
            onAction={() => { setFilterStatus('all'); setFilterDirection('all'); setSearchTerm(''); }}
          />
        )
      ) : (
        <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
          {filteredTransfers.map((transfer) => (
            <motion.div 
              key={transfer.id} 
              className={`bg-white rounded-2xl p-4 shadow-sm transition ${
                transfer.status === 'pendiente' ? 'border border-amber-200' : ''
              }`}
              variants={itemVariants}
              layout
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{transfer.products?.name || 'Producto'}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      transfer.status === 'pendiente' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {transfer.status === 'pendiente' ? '⏳ Pendiente' : '✅ Completada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="font-medium">{transfer.quantity} {transfer.products?.unit || ''}</span>
                    <span className="text-slate-300">•</span>
                    <span>{transfer.from_restaurant}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-medium">{transfer.to_restaurant}</span>
                  </div>
                  {transfer.reason && (
                    <p className="text-xs text-slate-500 mt-1">{transfer.reason}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{new Date(transfer.created_at).toLocaleString('es', { 
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                    })}</span>
                    <span>•</span>
                    <span>Por: {transfer.users?.name || '-'}</span>
                  </div>
                </div>
                
                {transfer.status === 'pendiente' && (isAdmin || currentRestaurant === transfer.to_restaurant) && (
                  <button
                    onClick={() => handleComplete(transfer.id)}
                    disabled={isCompleting === transfer.id}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex-shrink-0 shadow-sm shadow-emerald-200"
                  >
                    {isCompleting === transfer.id ? '...' : 'Confirmar Recepción'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal Nueva Transferencia */}
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
              className={`bg-white w-full max-w-md flex flex-col shadow-2xl ${isMobile ? 'rounded-t-[32px] mb-12' : 'rounded-2xl'}`}
              style={isMobile ? { maxHeight: '85dvh' } : { maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
              variants={isMobile ? modalVariants : desktopModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {isMobile && <div className="bottom-sheet-handle" />}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Nueva Transferencia</h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 modal-scroll" style={{ paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '16px' }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">📦 Producto *</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition"
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock} {p.unit})
                      </option>
                    ))}
                  </select>
                  {formData.productId && (
                    <p className="text-xs text-slate-500 mt-1">
                      Stock disponible: {products.find(p => p.id?.toString() === formData.productId)?.stock || 0} {products.find(p => p.id?.toString() === formData.productId)?.unit}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">🔢 Cantidad *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">🏢 Restaurante destino *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableDestinations.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, toRestaurant: r.id }))}
                        className={`p-3 rounded-xl border text-sm font-medium transition ${
                          formData.toRestaurant === r.id
                            ? 'bg-orange-50 border-orange-300 text-orange-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-lg">{r.icon}</span> {r.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">📝 Motivo (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Urgencia fin de semana"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50 shadow-sm shadow-orange-200"
                  >
                    {isSaving ? 'Enviando...' : 'Enviar Transferencia'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transfers;
