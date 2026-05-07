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

  useEffect(() => {
    loadMovements();
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

  // Aplicar filtros
  const filteredMovements = movements.filter(mov => {
    // Búsqueda por nombre de producto o usuario
    const matchesSearch = !searchTerm || 
      mov.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por tipo (entrada / salida)
    const matchesType = filterType === 'all' || mov.type === filterType;
    
    // Filtro por fecha
    let matchesDate = true;
    if (filterDate !== 'all') {
      const movDate = new Date(mov.created_at);
      const today = new Date();
      if (filterDate === 'today') {
        matchesDate = movDate.toDateString() === today.toDateString();
      } else if (filterDate === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = movDate >= weekAgo;
      } else if (filterDate === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = movDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Estadísticas rápidas
  const totalEntries = filteredMovements
    .filter(m => m.type === 'entrada')
    .reduce((sum, m) => sum + (m.quantity || 0), 0);
  const totalExits = filteredMovements
    .filter(m => m.type === 'salida')
    .reduce((sum, m) => sum + (m.quantity || 0), 0);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterDate('all');
  };

  const hasActiveFilters = searchTerm || filterType !== 'all' || filterDate !== 'all';

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
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
          <h1 className="text-xl font-bold text-gray-800">🔄 Historial de Movimientos</h1>
          <p className="text-sm text-gray-500 mt-1">Consulta todas las entradas y salidas de inventario</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="font-medium text-green-700">Entradas: {totalEntries}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="font-medium text-red-700">Salidas: {totalExits}</span>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por producto, usuario o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              showFilters || hasActiveFilters ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
            {hasActiveFilters && <span className="w-5 h-5 bg-white text-blue-600 rounded-full text-xs flex items-center justify-center font-bold">!</span>}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>

        {/* Panel de filtros desplegable */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de movimiento</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Todos los tipos</option>
                <option value="entrada">📥 Entradas</option>
                <option value="salida">📤 Salidas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Período</label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Todo el historial</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de movimientos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="text-center py-16">
            <FunnelIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No se encontraron movimientos</p>
            <p className="text-gray-400 text-sm mt-1">
              {hasActiveFilters ? 'Prueba con otros filtros' : 'Aún no hay movimientos registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMovements.map(mov => (
                  <tr key={mov.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(mov.created_at).toLocaleString('es', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{mov.products?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        mov.type === 'entrada' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {mov.type === 'entrada' ? '📥 Entrada' : '📤 Salida'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${mov.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {mov.users?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                      {mov.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="text-center text-sm text-gray-500">
        Mostrando {filteredMovements.length} de {movements.length} movimientos
        {hasActiveFilters && ' (filtros activos)'}
      </div>
    </div>
  );
};

export default Movements;
