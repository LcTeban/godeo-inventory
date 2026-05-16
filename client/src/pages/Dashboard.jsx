import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CubeIcon,
  ShoppingCartIcon,
  TruckIcon,
  ChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard = () => {
  const { currentRestaurant, isAdmin, getDashboard, getMovements, getRequests, getProducts, switchRestaurant } = useAuth();
  const [stats, setStats] = useState({ restaurants: {}, pendingTransfers: 0 });
  const [recentMovements, setRecentMovements] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [areaData, setAreaData] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, [currentRestaurant]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashboardData, movements, requests, products] = await Promise.all([
        getDashboard(),
        getMovements({ limit: 200 }),
        isAdmin ? getRequests() : Promise.resolve([]),
        getProducts({ forceRefresh: true })
      ]);

      setStats(dashboardData);
      setRecentMovements(movements?.slice(0, 5) || []);
      if (isAdmin) {
        setPendingRequests((requests || []).filter(r => r.status === 'pendiente'));
      }

      const today = new Date();
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push({
          date: date.toLocaleDateString('es', { weekday: 'short', day: 'numeric' }),
          dateObj: date,
          entradas: 0,
          salidas: 0,
        });
      }

      (movements || []).forEach(mov => {
        const movDate = new Date(mov.created_at);
        const dayIndex = days.findIndex(d => d.dateObj.toDateString() === movDate.toDateString());
        if (dayIndex !== -1) {
          if (mov.type === 'entrada') days[dayIndex].entradas += mov.quantity || 0;
          else if (mov.type === 'salida') days[dayIndex].salidas += mov.quantity || 0;
        }
      });

      setAreaData(days.map(d => ({
        name: d.date,
        Entradas: d.entradas,
        Salidas: d.salidas,
      })));

      const currentProducts = (products || []).filter(p => p.restaurant === currentRestaurant);
      const healthy = currentProducts.filter(p => p.stock > p.min_stock).length;
      const lowStock = currentProducts.filter(p => p.stock <= p.min_stock && p.stock > 0).length;
      const outOfStock = currentProducts.filter(p => p.stock === 0).length;

      setPieData([
        { name: 'Saludable', value: healthy, color: '#10b981' },
        { name: 'Stock Bajo', value: lowStock, color: '#f59e0b' },
        { name: 'Agotado', value: outOfStock, color: '#ef4444' },
      ].filter(item => item.value > 0));

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️', color: 'from-orange-400 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️', color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️', color: 'from-purple-400 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' }
  ];

  const currentRest = restaurants.find(r => r.id === currentRestaurant);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
          <div className="h-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
          <div className="h-20 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
        </div>
        <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
        <div className="h-64 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera del restaurante actual */}
      <div className={`bg-gradient-to-r ${currentRest?.color} rounded-2xl p-6 text-white shadow-lg animate-fade-in-up`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{currentRest?.icon}</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{currentRest?.name}</h1>
            <p className="opacity-90 text-sm">Panel de Control de Inventario</p>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 animate-fade-in-up flex flex-col items-start">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl mb-3">
            <CubeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.restaurants[currentRestaurant]?.totalProducts || 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-gray-300 mt-1 tracking-wide">Productos</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 animate-fade-in-up flex flex-col items-start" style={{ animationDelay: '0.1s' }}>
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className={`text-2xl font-bold ${(stats.restaurants[currentRestaurant]?.lowStock || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {stats.restaurants[currentRestaurant]?.lowStock || 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-gray-300 mt-1 tracking-wide">Stock Bajo</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 animate-fade-in-up flex flex-col items-start" style={{ animationDelay: '0.2s' }}>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl mb-3">
            <TruckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold ${stats.pendingTransfers > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
            {stats.pendingTransfers}
          </div>
          <div className="text-xs text-slate-500 dark:text-gray-300 mt-1 tracking-wide">Pendientes</div>
        </div>
      </div>

      {/* Panel de Administrador */}
      {isAdmin && (
        <>
          {/* Tarjetas de las 3 sucursales - CLICABLES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {restaurants.map((rest, i) => (
              <div
                key={rest.id}
                onClick={() => switchRestaurant(rest.id)}
                className={`rounded-2xl p-5 shadow-sm dark:shadow-md dark:shadow-black/30 dark:border-white/5 border-2 border-transparent ${rest.bg} animate-fade-in-up cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-shadow hover:border-orange-300 dark:hover:border-orange-600`}
                style={{ animationDelay: `${0.1 * i}s` }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') switchRestaurant(rest.id); }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{rest.icon}</span>
                  <h3 className="font-semibold text-slate-900 dark:text-white tracking-tight">{rest.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-gray-300">Productos</span>
                    <span className="font-bold text-slate-900 dark:text-white">{stats.restaurants[rest.id]?.totalProducts || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-gray-300">Stock Bajo</span>
                    <span className={`font-bold ${(stats.restaurants[rest.id]?.lowStock || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                      {stats.restaurants[rest.id]?.lowStock || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alertas urgentes */}
          {(stats.pendingTransfers > 0 || pendingRequests.length > 0 || (stats.restaurants[currentRestaurant]?.lowStock || 0) > 0) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 dark:border-white/5 border border-transparent animate-fade-in-up">
              <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2 tracking-tight">
                <ExclamationTriangleIcon className="h-5 w-5" />
                Alertas Pendientes
              </h3>
              <div className="space-y-2">
                {stats.pendingTransfers > 0 && (
                  <Link to="/transfers" className="block text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100">
                    🚚 {stats.pendingTransfers} transferencia(s) pendiente(s) de confirmar
                  </Link>
                )}
                {(stats.restaurants[currentRestaurant]?.lowStock || 0) > 0 && (
                  <Link to="/inventory" className="block text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100">
                    ⚠️ {stats.restaurants[currentRestaurant]?.lowStock} producto(s) con stock bajo
                  </Link>
                )}
                {pendingRequests.length > 0 && (
                  <Link to="/requests" className="block text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100">
                    📋 {pendingRequests.length} pedido(s) de empleados sin revisar
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Área Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-md dark:shadow-black/30 animate-fade-in-up">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 tracking-tight">
            <ClockIcon className="h-5 w-5 text-slate-500 dark:text-gray-300" />
            Movimientos (7 días)
          </h3>
          {areaData.length > 0 && areaData.some(d => d.Entradas > 0 || d.Salidas > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={areaData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={2} fill="url(#colorEntradas)" />
                <Area type="monotone" dataKey="Salidas" stroke="#f59e0b" strokeWidth={2} fill="url(#colorSalidas)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 dark:text-gray-300 text-sm">
              Sin datos de movimientos en los últimos 7 días
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-md dark:shadow-black/30 animate-fade-in-up">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 tracking-tight">
            <ChartBarIcon className="h-5 w-5 text-slate-500 dark:text-gray-300" />
            Estado del Inventario
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 dark:text-gray-300 text-sm">
              No hay productos en este restaurante
            </div>
          )}
          {pieData.length > 0 && (
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-xs text-slate-500 dark:text-gray-300">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-md dark:shadow-black/30 animate-fade-in-up">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 tracking-tight">
          <ClockIcon className="h-5 w-5" />
          Actividad Reciente
        </h3>
        <div className="space-y-3">
          {recentMovements.slice(0, 5).map(mov => (
            <div key={mov.id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-white/5 pb-2">
              <div>
                <span className="font-medium text-slate-700 dark:text-gray-300">{mov.products?.name || mov.product_name}</span>
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  mov.type === 'entrada' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                </span>
              </div>
              <span className="text-slate-400 dark:text-gray-300 text-xs">
                {new Date(mov.created_at).toLocaleString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {recentMovements.length === 0 && (
            <p className="text-slate-400 dark:text-gray-300 text-sm text-center py-2">Sin movimientos recientes</p>
          )}
        </div>
        <Link to="/movements" className="block mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
          Ver todos los movimientos →
        </Link>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/inventory" className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-md dark:shadow-black/30 text-center hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors animate-fade-in-up">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl inline-block mb-2">
            <CubeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="font-medium text-sm tracking-wide text-slate-700 dark:text-gray-300">Inventario</p>
        </Link>
        <Link to="/movements" className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-md dark:shadow-black/30 text-center hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl inline-block mb-2">
            <ShoppingCartIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-medium text-sm tracking-wide text-slate-700 dark:text-gray-300">Movimientos</p>
        </Link>
        <Link to="/requests" className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-md dark:shadow-black/30 text-center hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl inline-block mb-2">
            <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="font-medium text-sm tracking-wide text-slate-700 dark:text-gray-300">Pedidos</p>
        </Link>
        {isAdmin ? (
          <Link to="/reports" className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-md dark:shadow-black/30 text-center hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl inline-block mb-2">
              <ChartBarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-medium text-sm tracking-wide text-slate-700 dark:text-gray-300">Reportes</p>
          </Link>
        ) : (
          <Link to="/recipes" className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-md dark:shadow-black/30 text-center hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-xl inline-block mb-2">
              <BookOpenIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <p className="font-medium text-sm tracking-wide text-slate-700 dark:text-gray-300">Recetas</p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
