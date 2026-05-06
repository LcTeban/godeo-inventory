import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  TruckIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { currentRestaurant, isAdmin, getDashboard, getMovements, getRequests } = useAuth();
  const [stats, setStats] = useState({ restaurants: {}, pendingTransfers: 0 });
  const [recentMovements, setRecentMovements] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [currentRestaurant]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashboardData, movements, requests] = await Promise.all([
        getDashboard(),
        getMovements({ limit: 5 }),
        isAdmin ? getRequests() : Promise.resolve([])
      ]);

      setStats(dashboardData);
      setRecentMovements(movements?.slice(0, 5) || []);
      if (isAdmin) {
        setPendingRequests((requests || []).filter(r => r.status === 'pendiente'));
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️', color: 'from-orange-400 to-orange-600', bg: 'bg-orange-50' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️', color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️', color: 'from-purple-400 to-purple-600', bg: 'bg-purple-50' }
  ];

  const currentRest = restaurants.find(r => r.id === currentRestaurant);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-20 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="h-40 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera del restaurante actual */}
      <div className={`bg-gradient-to-r ${currentRest?.color} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{currentRest?.icon}</span>
          <div>
            <h1 className="text-2xl font-bold">{currentRest?.name}</h1>
            <p className="opacity-90 text-sm">Panel de Control de Inventario</p>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-2xl font-bold text-gray-800">
            {stats.restaurants[currentRestaurant]?.totalProducts || 0}
          </div>
          <div className="text-xs text-gray-500">Productos</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl mb-1">⚠️</div>
          <div className={`text-2xl font-bold ${(stats.restaurants[currentRestaurant]?.lowStock || 0) > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
            {stats.restaurants[currentRestaurant]?.lowStock || 0}
          </div>
          <div className="text-xs text-gray-500">Stock Bajo</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl mb-1">🚚</div>
          <div className={`text-2xl font-bold ${stats.pendingTransfers > 0 ? 'text-blue-600' : 'text-gray-800'}`}>
            {stats.pendingTransfers}
          </div>
          <div className="text-xs text-gray-500">Pendientes</div>
        </div>
      </div>

      {/* Panel de Administrador */}
      {isAdmin && (
        <>
          {/* Tarjetas de las 3 sucursales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {restaurants.map(rest => (
              <div key={rest.id} className={`rounded-xl p-5 shadow-sm ${rest.bg} border border-gray-100`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{rest.icon}</span>
                  <h3 className="font-semibold text-gray-800">{rest.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Productos</span>
                    <span className="font-bold text-gray-800">{stats.restaurants[rest.id]?.totalProducts || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock Bajo</span>
                    <span className={`font-bold ${(stats.restaurants[rest.id]?.lowStock || 0) > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                      {stats.restaurants[rest.id]?.lowStock || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alertas urgentes */}
          {(stats.pendingTransfers > 0 || pendingRequests.length > 0 || (stats.restaurants[currentRestaurant]?.lowStock || 0) > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                Alertas Pendientes
              </h3>
              <div className="space-y-2">
                {stats.pendingTransfers > 0 && (
                  <Link to="/transfers" className="block text-sm text-yellow-700 hover:text-yellow-900">
                    🚚 {stats.pendingTransfers} transferencia(s) pendiente(s) de confirmar
                  </Link>
                )}
                {(stats.restaurants[currentRestaurant]?.lowStock || 0) > 0 && (
                  <Link to="/inventory" className="block text-sm text-yellow-700 hover:text-yellow-900">
                    ⚠️ {stats.restaurants[currentRestaurant]?.lowStock} producto(s) con stock bajo
                  </Link>
                )}
                {pendingRequests.length > 0 && (
                  <Link to="/requests" className="block text-sm text-yellow-700 hover:text-yellow-900">
                    📋 {pendingRequests.length} pedido(s) de empleados sin revisar
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actividad reciente */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Actividad Reciente
        </h3>
        <div className="space-y-2">
          {recentMovements.slice(0, 5).map(mov => (
            <div key={mov.id} className="flex items-center justify-between text-sm border-b pb-2">
              <div>
                <span className="font-medium">{mov.products?.name || mov.product_name}</span>
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  mov.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                {new Date(mov.created_at).toLocaleString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {recentMovements.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-2">Sin movimientos recientes</p>
          )}
        </div>
        <Link to="/movements" className="block mt-3 text-blue-600 text-sm font-medium hover:underline">
          Ver todos los movimientos →
        </Link>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/inventory" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50 transition">
          <span className="text-3xl">📦</span>
          <p className="font-medium mt-1 text-sm">Inventario</p>
        </Link>
        <Link to="/movements" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50 transition">
          <span className="text-3xl">🔄</span>
          <p className="font-medium mt-1 text-sm">Movimientos</p>
        </Link>
        <Link to="/requests" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50 transition">
          <span className="text-3xl">📋</span>
          <p className="font-medium mt-1 text-sm">Pedidos</p>
        </Link>
        {isAdmin ? (
          <Link to="/reports" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50 transition">
            <span className="text-3xl">📊</span>
            <p className="font-medium mt-1 text-sm">Reportes</p>
          </Link>
        ) : (
          <Link to="/recipes" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50 transition">
            <span className="text-3xl">📖</span>
            <p className="font-medium mt-1 text-sm">Recetas</p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
