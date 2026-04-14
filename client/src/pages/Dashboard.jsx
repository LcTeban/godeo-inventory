import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({ restaurants: {}, pendingTransfers: 0 });
  const [loading, setLoading] = useState(true);
  const { currentRestaurant, isAdmin } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const RestaurantCard = ({ name, data, icon, bgColor }) => (
    <div className={`${bgColor} rounded-xl shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{name}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm opacity-90">Productos</p>
          <p className="text-3xl font-bold">{data?.totalProducts || 0}</p>
        </div>
        <div>
          <p className="text-sm opacity-90">Valor</p>
          <p className="text-2xl font-bold">€{(data?.inventoryValue || 0).toFixed(0)}</p>
        </div>
        <div>
          <p className="text-sm opacity-90">Stock Bajo</p>
          <p className="text-2xl font-bold text-yellow-200">{data?.lowStock || 0}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    );
  }

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️', bg: 'bg-gradient-to-br from-orange-500 to-red-600' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️', bg: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️', bg: 'bg-gradient-to-br from-purple-500 to-indigo-600' }
  ];

  const displayRestaurants = isAdmin ? restaurants : restaurants.filter(r => r.id === currentRestaurant);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isAdmin ? 'Dashboard General' : `Dashboard - ${restaurants.find(r => r.id === currentRestaurant)?.name}`}
      </h1>
      
      {stats.pendingTransfers > 0 && isAdmin && (
        <div className="mb-6 p-4 bg-amber-100 text-amber-800 rounded-xl flex items-center">
          <span className="text-2xl mr-3">📦</span>
          <span className="font-semibold">Hay {stats.pendingTransfers} transferencias pendientes</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayRestaurants.map(rest => (
          <RestaurantCard 
            key={rest.id}
            name={rest.name}
            icon={rest.icon}
            bgColor={rest.bg}
            data={stats.restaurants[rest.id]}
          />
        ))}
      </div>
      
      {isAdmin && (
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen General</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-3xl font-bold text-gray-800">
                {Object.values(stats.restaurants).reduce((sum, r) => sum + (r?.totalProducts || 0), 0)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-3xl font-bold text-gray-800">
                €{Object.values(stats.restaurants).reduce((sum, r) => sum + (r?.inventoryValue || 0), 0).toFixed(0)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Alertas Stock</p>
              <p className="text-3xl font-bold text-amber-600">
                {Object.values(stats.restaurants).reduce((sum, r) => sum + (r?.lowStock || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
