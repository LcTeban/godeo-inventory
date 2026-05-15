import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import usePullToRefresh from '../hooks/usePullToRefresh';

const Movements = () => {
  const { currentRestaurant, getMovements } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Función de recarga que se pasará al hook
  const handleRefresh = useCallback(async () => {
    try {
      const data = await getMovements({ limit: 100 });
      setMovements(Array.isArray(data) ? data : []);
      toast.success('Movimientos actualizados');
    } catch (error) {
      console.error('Error loading movements:', error);
      toast.error('Error al actualizar los movimientos');
    }
  }, [getMovements]);

  const { containerRef, pullState, pullDistance, isRefreshing } = usePullToRefresh(handleRefresh, 80);

  useEffect(() => {
    const loadMovements = async () => {
      setLoading(true);
      try {
        const data = await getMovements({ limit: 100 });
        setMovements(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading movements:', error);
        toast.error('Error al cargar los movimientos');
      } finally {
        setLoading(false);
      }
    };
    loadMovements();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentRestaurant, getMovements]);

  const filteredMovements = movements.filter(mov => {
    const matchesSearch = !searchTerm || 
      mov.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || mov.type === filterType;
    let matchesDate = true;
    if (filterDate !== 'all') {
      const movDate = new Date(mov.created_at);
      const today = new Date();
      if (filterDate === 'today') matchesDate = movDate.toDateString() === today.toDateString();
      else if (filterDate === 'week') matchesDate = movDate >= new Date(today.getTime() - 7*24*60*60*1000);
      else if (filterDate === 'month') matchesDate = movDate >= new Date(today.getTime() - 30*24*60*60*1000);
    }
    return matchesSearch && matchesType && matchesDate;
  });

  const totalEntries = filteredMovements.filter(m => m.type === 'entrada').reduce((sum, m) => sum + (m.quantity || 0), 0);
  const totalExits = filteredMovements.filter(m => m.type === 'salida').reduce((sum, m) => sum + (m.quantity || 0), 0);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterDate('all');
  };

  const hasActiveFilters = searchTerm || filterType !== 'all' || filterDate !== 'all';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white rounded-2xl w-1/3 shadow-sm"></div>
        <div className="h-12 bg-white rounded-2xl shadow-sm"></div>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-white rounded-2xl shadow-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">🔄 Historial de Movimientos</h1>
          <p className="text-sm text-slate-500 mt-1">Consulta todas las entradas y salidas de inventario</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-emerald-700">Entradas: {totalEntries}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="font-medium text-red-700">Salidas: {totalExits}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por producto, usuario o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              showFilters || hasActiveFilters ? 'bg-orange-500 text-white shadow-sm shadow-orange-200' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
            {hasActiveFilters && <span className="w-5 h-5 bg-white text-orange-500 rounded-full text-xs flex items-center justify-center font-bold">!</span>}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-1">
              <XMarkIcon className="h-4 w-4" /> Limpiar
            </button>
          )}
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tipo de movimiento</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 outline-none">
                <option value="all">Todos los tipos</option>
                <option value="entrada">📥 Entradas</option>
                <option value="salida">📤 Salidas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Período</label>
              <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 outline-none">
                <option value="all">Todo el historial</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Contenedor con pull-to-refresh */}
      <div ref={containerRef} className="overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(100dvh - 220px)' : 'none' }}>
        {/* Indicador de pull-to-refresh */}
        <AnimatePresence>
          {(pullState === 'pulling' || pullState === 'refreshing') && (
            <motion.div
              className="flex justify-center py-2"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: pullDistance, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent"
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filteredMovements.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={FunnelIcon}
                title="Sin resultados"
                message="Prueba con otros filtros o términos de búsqueda"
                actionLabel="Limpiar filtros"
                onAction={clearFilters}
              />
            ) : movements.length === 0 ? (
              <EmptyState
                icon={ClockIcon}
                title="Sin movimientos"
                message="Aún no hay movimientos registrados. Realiza entradas o salidas para ver el historial."
                actionLabel="Ir al inventario"
                onAction={() => window.location.href = '/inventory'}
              />
            ) : (
              <EmptyState
                icon={FunnelIcon}
                title="Sin resultados"
                message="Prueba con otros filtros"
              />
            )
          ) : isMobile ? (
            <motion.div className="divide-y divide-slate-100" variants={containerVariants} initial="hidden" animate="visible">
              {filteredMovements.map(mov => (
                <motion.div key={mov.id} className="p-4 hover:bg-slate-50 transition" variants={itemVariants}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{mov.products?.name || '-'}</h3>
                      <p className="text-xs text-slate-500">
                        {new Date(mov.created_at).toLocaleString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      mov.type === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {mov.type === 'entrada' ? '📥 Entrada' : '📤 Salida'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">{mov.users?.name || '-'}{mov.reason && <span className="text-slate-400 ml-2">· {mov.reason}</span>}</span>
                    <span className={`font-bold ${mov.type === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>{mov.type === 'entrada' ? '+' : '-'}{mov.quantity}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Producto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cantidad</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.map(mov => (
                    <tr key={mov.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{new Date(mov.created_at).toLocaleString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3"><span className="font-bold text-slate-900">{mov.products?.name || '-'}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${mov.type === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{mov.type === 'entrada' ? '📥 Entrada' : '📤 Salida'}</span></td>
                      <td className="px-4 py-3 text-right"><span className={`font-bold ${mov.type === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>{mov.type === 'entrada' ? '+' : '-'}{mov.quantity}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-500">{mov.users?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">{mov.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div className="text-center text-sm text-slate-500">Mostrando {filteredMovements.length} de {movements.length} movimientos{hasActiveFilters && ' (filtros activos)'}</div>
    </div>
  );
};

export default Movements;
