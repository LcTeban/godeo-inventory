import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MagnifyingGlassIcon, FunnelIcon, XMarkIcon,
  TruckIcon, CheckCircleIcon, ClockIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity || !formData.toRestaurant) {
      alert('Completa todos los campos obligatorios');
      return;
    }
    setIsSaving(true);
    try {
      await addTransfer(formData);
      setShowModal(false);
      setFormData({ productId: '', quantity: '', toRestaurant: '', reason: '' });
      loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async (id) => {
    setIsCompleting(id);
    try {
      await completeTransfer(id);
      loadData();
    } catch (error) {
      alert('Error al completar: ' + error.message);
    } finally {
      setIsCompleting(null);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="h-16 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">🚚 Transferencias</h1>
          <p className="text-sm text-gray-500 mt-1">Envía y recibe productos entre sucursales</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <TruckIcon className="h-4 w-4" /> Nueva Transferencia
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-gray-500">Pendientes</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-gray-500">Completadas hoy</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{completedToday}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{transfers.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por producto, restaurante o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              showFilters || filterStatus !== 'all' || filterDirection !== 'all' 
                ? 'bg-blue-600 text-white' 
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
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
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Todos</option>
                <option value="pendiente">⏳ Pendientes</option>
                <option value="completado">✅ Completadas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dirección</label>
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Todas</option>
                <option value="outgoing">📤 Enviadas</option>
                <option value="incoming">📥 Recibidas</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {filteredTransfers.map(transfer => (
          <div 
            key={transfer.id} 
            className={`bg-white rounded-xl p-4 shadow-sm border transition ${
              transfer.status === 'pendiente' ? 'border-amber-200' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{transfer.products?.name || 'Producto'}</h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    transfer.status === 'pendiente' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {transfer.status === 'pendiente' ? '⏳ Pendiente' : '✅ Completada'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium">{transfer.quantity} {transfer.products?.unit || ''}</span>
                  <span className="text-gray-300">•</span>
                  <span>{transfer.from_restaurant}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{transfer.to_restaurant}</span>
                </div>
                {transfer.reason && (
                  <p className="text-xs text-gray-500 mt-1">{transfer.reason}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
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
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 flex-shrink-0"
                >
                  {isCompleting === transfer.id ? '...' : 'Confirmar Recepción'}
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredTransfers.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <TruckIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No hay transferencias</p>
            <p className="text-gray-400 text-sm mt-1">
              {transfers.length === 0 ? 'Crea la primera transferencia' : 'Ajusta los filtros para ver más resultados'}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Nueva Transferencia</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📦 Producto *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <p className="text-xs text-gray-500 mt-1">
                    Stock disponible: {products.find(p => p.id?.toString() === formData.productId)?.stock || 0} {products.find(p => p.id?.toString() === formData.productId)?.unit}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🔢 Cantidad *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🏢 Restaurante destino *</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableDestinations.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, toRestaurant: r.id }))}
                      className={`p-3 rounded-xl border text-sm font-medium transition ${
                        formData.toRestaurant === r.id
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{r.icon}</span> {r.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📝 Motivo (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Urgencia fin de semana"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? 'Enviando...' : 'Enviar Transferencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;
