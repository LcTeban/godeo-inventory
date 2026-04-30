import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({ restaurants: {}, pendingTransfers: 0 });
  const [loading, setLoading] = useState(true);
  const { currentRestaurant, isAdmin, getDashboard } = useAuth();

  useEffect(() => {
    fetchDashboard();
  }, [currentRestaurant]);

  const fetchDashboard = async () => {
    try {
      const data = await getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️', color: 'from-orange-400 to-orange-600' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️', color: 'from-blue-400 to-blue-600' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️', color: 'from-purple-400 to-purple-600' }
  ];

  const currentRest = restaurants.find(r => r.id === currentRestaurant);

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className={`bg-gradient-to-r ${currentRest?.color} rounded-2xl p-6 text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{currentRest?.icon}</span>
          <h1 className="text-2xl font-bold">{currentRest?.name}</h1>
        </div>
        <p className="opacity-90">Panel de Control de Inventario</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-2xl font-bold">{stats.restaurants[currentRestaurant]?.totalProducts || 0}</div>
          <div className="text-xs text-gray-500">Productos</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl mb-1">⚠️</div>
          <div className={`text-2xl font-bold ${(stats.restaurants[currentRestaurant]?.lowStock || 0) > 0 ? 'text-orange-600' : ''}`}>
            {stats.restaurants[currentRestaurant]?.lowStock || 0}
          </div>
          <div className="text-xs text-gray-500">Stock Bajo</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl mb-1">🚚</div>
          <div className="text-2xl font-bold">{stats.pendingTransfers}</div>
          <div className="text-xs text-gray-500">Pendientes</div>
        </div>
      </div>

      {isAdmin && stats.pendingTransfers > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <Link to="/transfers" className="text-yellow-800 font-medium">
            ⚠️ Hay {stats.pendingTransfers} transferencias pendientes
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/inventory" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50">
          <span className="text-3xl">📦</span>
          <p className="font-medium mt-1">Inventario</p>
        </Link>
        <Link to="/movements" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50">
          <span className="text-3xl">🔄</span>
          <p className="font-medium mt-1">Movimientos</p>
        </Link>
        <Link to="/requests" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50">
          <span className="text-3xl">📋</span>
          <p className="font-medium mt-1">Pedidos</p>
        </Link>
        <Link to="/reports" className="bg-white rounded-xl p-4 shadow-sm text-center hover:bg-gray-50">
          <span className="text-3xl">📊</span>
          <p className="font-medium mt-1">Reportes</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
