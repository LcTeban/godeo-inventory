import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentRestaurant, isAdmin } = useAuth();

  useEffect(() => {
    fetchData();
  }, [currentRestaurant]);

  const fetchData = async () => {
    try {
      const [prodRes, movRes] = await Promise.all([
        axios.get(`/api/${currentRestaurant}/products`),
        axios.get(`/api/${currentRestaurant}/movements`)
      ]);
      setProducts(prodRes.data || []);
      setMovements(movRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock <= p.min_stock).length,
    expiring: products.filter(p => {
      if (!p.expiry_date) return false;
      const days = (new Date(p.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
      return days <= 7 && days >= 0;
    }).length,
    recentMovements: movements.slice(0, 5)
  };

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️', color: 'from-orange-400 to-orange-600' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️', color: 'from-blue-400 to-blue-600' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️', color: 'from-purple-400 to-purple-600' }
  ];

  const currentRest = restaurants.find(r => r.id === currentRestaurant);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con restaurante actual */}
      <div className={`bg-gradient-to-r ${currentRest?.color} rounded-2xl p-6 text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{currentRest?.icon}</span>
          <h1 className="text-2xl font-bold">{currentRest?.name}</h1>
        </div>
        <p className="opacity-90">Panel de Control de Inventario</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Productos</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl mb-1">⚠️</div>
          <div className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-orange-600' : ''}`}>
            {stats.lowStock}
          </div>
          <div className="text-xs text-gray-500">Stock Bajo</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl mb-1">⏰</div>
          <div className={`text-2xl font-bold ${stats.expiring > 0 ? 'text-red-600' : ''}`}>
            {stats.expiring}
          </div>
          <div className="text-xs text-gray-500">Por Caducar</div>
        </div>
      </div>

      {/* Alertas */}
      {(stats.lowStock > 0 || stats.expiring > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Alertas</h3>
          {stats.lowStock > 0 && (
            <Link to="/inventory" className="block text-sm text-yellow-700 mb-1">
              • {stats.lowStock} productos con stock bajo
            </Link>
          )}
          {stats.expiring > 0 && (
            <Link to="/inventory" className="block text-sm text-yellow-700">
              • {stats.expiring} productos próximos a caducar
            </Link>
          )}
        </div>
      )}

      {/* Últimos movimientos */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Últimos Movimientos</h2>
        </div>
        <div className="divide-y">
          {stats.recentMovements.map(mov => (
            <div key={mov.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{mov.product_name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(mov.created_at).toLocaleString('es', { 
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <span className={`font-semibold ${mov.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                  {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                </span>
                <p className="text-xs text-gray-500">{mov.user_name}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Link to="/movements" className="text-blue-600 text-sm font-medium">
            Ver todos los movimientos →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
