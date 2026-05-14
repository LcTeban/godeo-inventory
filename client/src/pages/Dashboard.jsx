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
  const { currentRestaurant, isAdmin, getDashboard, getMovements, getRequests, getProducts } = useAuth();
  const [stats, setStats] = useState({ restaurants: {}, pendingTransfers: 0 });
  const [recentMovements, setRecentMovements] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Datos para gráficos
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
        getMovements({ limit: 200 }), // Más datos para el gráfico
        isAdmin ? getRequests() : Promise.resolve([]),
        getProducts({ forceRefresh: true }) // Para el gráfico de donut
      ]);

      setStats(dashboardData);
      setRecentMovements(movements?.slice(0, 5) || []);
      if (isAdmin) {
        setPendingRequests((requests || []).filter(r => r.status === 'pendiente'));
      }

      // Procesar datos para Área Chart (últimos 7 días)
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
          if (mov.type === 'entrada') {
            days[dayIndex].entradas += mov.quantity || 0;
          } else if (mov.type === 'salida') {
            days[dayIndex].salidas += mov.quantity || 0;
          }
        }
      });

      setAreaData(days.map(d => ({
        name: d.date,
        Entradas: d.entradas,
        Salidas: d.salidas,
      })));

      // Procesar datos para Pie Chart (estado del inventario actual)
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
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️', color: 'from-orange-400 to-orange-600', bg: 'bg-orange-50' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️', color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️', color: 'from-purple-400 to-purple-600', bg: 'bg-purple-50' }
  ];

  const currentRest = restaurants.find(r => r.id === currentRestaurant);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white rounded-2xl shadow-sm"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-white rounded-2xl shadow-sm"></div>
          <div className="h-20 bg-white rounded-2xl shadow-sm"></div>
          <div className="h-20 bg-white rounded-2xl shadow-sm"></div>
        </div>
        <div className="h-64 bg-white rounded-2xl shadow-sm"></div>
        <div className="h-64 bg-white rounded-2xl shadow-sm"></div>
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
        <div className="bg-white rounded-2xl p-4 shadow-sm animate-fade-in-up flex flex-col items-start">
          <div className="p-2 bg-blue-50 rounded-xl mb-3">
            <CubeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.restaurants[currentRestaurant]?.totalProducts || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1 tracking-wide">Productos</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm animate-fade-in-up flex flex-col items-start" style={{ animationDelay: '0.1s' }}>
          <div className="p-2 bg-amber-50 rounded-xl mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div className={`text-2xl font-bold ${(stats.restaurants[currentRestaurant]?.lowStock || 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {stats.restaurants[currentRestaurant]?.lowStock || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1 tracking-wide">Stock Bajo</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm animate-fade-in-up flex flex-col items-start" style={{ animationDelay: '0.2s' }}>
          <div className="p-2 bg-emerald-50 rounded-xl mb-3">
            <TruckIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div className={`text-2xl font-bold ${stats.pendingTransfers > 0 ? 'text-blue-600' : 'text-slate-900'}`}>
            {stats.pendingTransfers}
          </div>
          <div className="text-xs text-slate-500 mt-1 tracking-wide">Pendientes</div>
        </div>
      </div>

      {/* Panel de Administrador */}
      {isAdmin && (
        <>
          {/* Tarjetas de las 3 sucursales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {restaurants.map((rest, i) => (
              <div key={rest.id} className={`rounded-2xl p-5 shadow-sm ${rest.bg} animate-fade-in-up`} style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{rest.icon}</span>
                  <h3 className="font-semibold text-slate-900 tracking-tight">{rest.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Productos</span>
                    <span className="font-bold text-slate-900">{stats.restaurants[rest.id]?.totalProducts || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Stock Bajo</span>
                    <span className={`font-bold ${(stats.restaurants[rest.id]?.lowStock || 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                      {stats.restaurants[rest.id]?.lowStock || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alertas urgentes */}
          {(stats.pendingTransfers > 0 || pendingRequests.length > 0 || (stats.restaurants[currentRestaurant]?.lowStock || 0) > 0) && (
            <div className="bg-amber-50 rounded-2xl p-4 shadow-sm animate-fade-in-up">
              <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2 tracking-tight">
                <ExclamationTriangleIcon className="h-5 w-5" />
                Alertas Pendientes
              </h3>
              <div className="space-y-2">
                {stats.pendingTransfers > 0 && (
                  <Link to="/transfers" className="block text-sm text-amber-700 hover:text-amber-900">
                    🚚 {stats.pendingTransfers} transferencia(s) pendiente(s) de confirmar
                  </Link>
                )}
                {(stats.restaurants[currentRestaurant]?.lowStock || 0) > 0 && (
                  <Link to="/inventory" className="block text-sm text-amber-700 hover:text-amber-900">
                    ⚠️ {stats.restaurants[currentRestaurant]?.lowStock} producto(s) con stock bajo
                  </Link>
                )}
                {pendingRequests.length > 0 && (
                  <Link to="/requests" className="block text-sm text-amber-700 hover:text-amber-900">
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
        {/* Área Chart - Movimientos últimos 7 días */}
        <div className="bg-white rounded-2xl p-5 shadow-sm animate-fade-in-up">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 tracking-tight">
            <ClockIcon className="h-5 w-5 text-slate-500" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={2} fill="url(#colorEntradas)" />
                <Area type="monotone" dataKey="Salidas" stroke="#f59e0b" strokeWidth={2} fill="url(#colorSalidas)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Sin datos de movimientos en los últimos 7 días
            </div>
          )}
        </div>

        {/* Pie Chart (Donut) - Estado del inventario */}
        <div className="bg-white rounded-2xl p-5 shadow-sm animate-fade-in-up">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 tracking-tight">
            <ChartBarIcon className="h-5 w-5 text-slate-500" />
            Estado del Inventario
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              No hay productos en este restaurante
            </div>
          )}
          {/* Leyenda */}
          {pieData.length > 0 && (
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-xs text-slate-500">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-fade-in-up">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 tracking-tight">
          <ClockIcon className="h-5 w-5" />
          Actividad Reciente
        </h3>
        <div className="space-y-3">
          {recentMovements.slice(0, 5).map(mov => (
            <div key={mov.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
              <div>
                <span className="font-medium text-slate-700">{mov.products?.name || mov.product_name}</span>
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  mov.type === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                </span>
              </div>
              <span className="text-slate-400 text-xs">
                {new Date(mov.created_at).toLocaleString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {recentMovements.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-2">Sin movimientos recientes</p>
          )}
        </div>
        <Link to="/movements" className="block mt-3 text-blue-600 text-sm font-medium hover:underline">
          Ver todos los movimientos →
        </Link>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/inventory" className="bg-white rounded-2xl p-5 shadow-sm text-center hover:bg-slate-50 transition-colors animate-fade-in-up">
          <div className="p-2 bg-blue-50 rounded-xl inline-block mb-2">
            <CubeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <p className="font-medium text-sm tracking-wide text-slate-700">Inventario</p>
        </Link>
        <Link to="/movements" className="bg-white rounded-2xl p-5 shadow-sm text-center hover:bg-slate-50 transition-colors animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-2 bg-emerald-50 rounded-xl inline-block mb-2">
            <ShoppingCartIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="font-medium text-sm tracking-wide text-slate-700">Movimientos</p>
        </Link>
        <Link to="/requests" className="bg-white rounded-2xl p-5 shadow-sm text-center hover:bg-slate-50 transition-colors animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-2 bg-amber-50 rounded-xl inline-block mb-2">
            <ClockIcon className="h-5 w-5 text-amber-600" />
          </div>
          <p className="font-medium text-sm tracking-wide text-slate-700">Pedidos</p>
        </Link>
        {isAdmin ? (
          <Link to="/reports" className="bg-white rounded-2xl p-5 shadow-sm text-center hover:bg-slate-50 transition-colors animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="p-2 bg-purple-50 rounded-xl inline-block mb-2">
              <ChartBarIcon className="h-5 w-5 text-purple-600" />
            </div>
            <p className="font-medium text-sm tracking-wide text-slate-700">Reportes</p>
          </Link>
        ) : (
          <Link to="/recipes" className="bg-white rounded-2xl p-5 shadow-sm text-center hover:bg-slate-50 transition-colors animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="p-2 bg-pink-50 rounded-xl inline-block mb-2">
              <BookOpenIcon className="h-5 w-5 text-pink-600" />
            </div>
            <p className="font-medium text-sm tracking-wide text-slate-700">Recetas</p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
