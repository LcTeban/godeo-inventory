import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Movements = () => {
  const { currentRestaurant, getMovements } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    loadMovements();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentRestaurant]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const data = await getMovements({ limit: 100 });
      setMovements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

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
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              showFilters || hasActiveFilters ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
            {hasActiveFilters && <span className="w-5 h-5 bg-white text-blue-600 rounded-full text-xs flex items-center justify-center font-bold">!</span>}
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
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                <option value="all">Todos los tipos</option>
                <option value="entrada">📥 Entradas</option>
                <option value="salida">📤 Salidas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Período</label>
              <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                <option value="all">Todo el historial</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="text-center py-16">
            <FunnelIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No se encontraron movimientos</p>
            <p className="text-slate-400 text-sm mt-1">{hasActiveFilters ? 'Prueba con otros filtros' : 'Aún no hay movimientos registrados'}</p>
          </div>
        ) : isMobile ? (
          <div className="divide-y divide-slate-100">
            {filteredMovements.map(mov => (
              <div key={mov.id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-slate-900">{mov.products?.name || '-'}</h3>
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
                  <span className={`font-semibold ${mov.type === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>{mov.type === 'entrada' ? '+' : '-'}{mov.quantity}</span>
                </div>
              </div>
            ))}
          </div>
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
                    <td className="px-4 py-3"><span className="font-medium text-slate-900">{mov.products?.name || '-'}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${mov.type === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{mov.type === 'entrada' ? '📥 Entrada' : '📤 Salida'}</span></td>
                    <td className="px-4 py-3 text-right"><span className={`font-semibold ${mov.type === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>{mov.type === 'entrada' ? '+' : '-'}{mov.quantity}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{mov.users?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">{mov.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="text-center text-sm text-slate-500">Mostrando {filteredMovements.length} de {movements.length} movimientos{hasActiveFilters && ' (filtros activos)'}</div>
    </div>
  );
};

export default Movements;
