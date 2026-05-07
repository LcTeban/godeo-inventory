import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  CurrencyDollarIcon, CubeIcon, ExclamationTriangleIcon,
  ArrowTrendingDownIcon, ClockIcon, TruckIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const { isAdmin, currentRestaurant, switchRestaurant, getProducts, getMovements, getTransfers } = useAuth();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('summary');
  const [allProducts, setAllProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) navigate('/dashboard');
  }, [isAdmin, navigate]);

  useEffect(() => {
    mountedRef.current = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prods, movs, trans] = await Promise.all([
          getProducts({ restaurant: null }),
          getMovements({ restaurant: currentRestaurant, period }),
          getTransfers(),
        ]);
        if (mountedRef.current) {
          setAllProducts(Array.isArray(prods) ? prods : []);
          setMovements(Array.isArray(movs) ? movs : []);
          setTransfers(Array.isArray(trans) ? trans : []);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    fetchData();
    return () => { mountedRef.current = false; };
  }, [currentRestaurant, period]);

  // Cálculos financieros
  const inventoryValueByRestaurant = () => {
    const map = {};
    allProducts.forEach(p => {
      const rest = p.restaurant;
      if (!map[rest]) map[rest] = 0;
      map[rest] += (p.stock || 0) * (p.price || 0);
    });
    return map;
  };

  const totalInventoryValue = Object.values(inventoryValueByRestaurant()).reduce((a, b) => a + b, 0);
  const totalProducts = allProducts.length;
  const pendingTransfers = transfers.filter(t => t.status === 'pendiente').length;

  const filteredMovements = movements.filter(m => {
    const date = new Date(m.created_at);
    const now = new Date();
    if (period === 'week') return date >= new Date(now - 7 * 24 * 60 * 60 * 1000);
    if (period === 'month') return date >= new Date(now - 30 * 24 * 60 * 60 * 1000);
    if (period === 'year') return date >= new Date(now - 365 * 24 * 60 * 60 * 1000);
    return true;
  });

  const totalEntries = filteredMovements
    .filter(m => m.type === 'entrada')
    .reduce((sum, m) => sum + ((m.quantity || 0) * (m.products?.price || 0)), 0);
  const totalExits = filteredMovements
    .filter(m => m.type === 'salida')
    .reduce((sum, m) => sum + ((m.quantity || 0) * (m.products?.price || 0)), 0);
  const costOfSales = totalExits;

  // Top 5 productos más consumidos (salidas) en el período
  const consumptionMap = {};
  filteredMovements
    .filter(m => m.type === 'salida')
    .forEach(m => {
      const name = m.products?.name || 'Desconocido';
      consumptionMap[name] = (consumptionMap[name] || 0) + (m.quantity || 0);
    });
  const topConsumed = Object.entries(consumptionMap)
    .map(([name, value]) => ({ name, consumo: value }))
    .sort((a, b) => b.consumo - a.consumo)
    .slice(0, 5);

  const lowStockProducts = allProducts.filter(p => (p.stock || 0) <= (p.min_stock || 10));
  const lowStockValue = lowStockProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);

  const restaurants = ['POZOBLANCO', 'FUERTEVENTURA', 'GRAN_CAPITAN'];
  const restaurantNames = {
    POZOBLANCO: '🍽️ Pozoblanco',
    FUERTEVENTURA: '🏖️ Fuerteventura',
    GRAN_CAPITAN: '🏛️ Gran Capitán'
  };
  const restaurantColors = {
    POZOBLANCO: '#f97316',
    FUERTEVENTURA: '#3b82f6',
    GRAN_CAPITAN: '#8b5cf6'
  };

  if (!isAdmin) return null;
  if (loading) return <div className="text-center py-8 text-gray-500">Cargando reportes...</div>;

  return (
    <div className="space-y-6">
      {/* Header con selector de restaurante y período */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">📊 Reportes Financieros</h1>
        <div className="flex items-center gap-3">
          <select
            value={currentRestaurant}
            onChange={(e) => switchRestaurant(e.target.value)}
            className="border rounded-lg p-2 text-sm bg-white shadow-sm"
          >
            {restaurants.map(rest => (
              <option key={rest} value={rest}>{restaurantNames[rest]}</option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded-lg p-2 text-sm bg-white shadow-sm"
          >
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
          </select>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor inventario</p>
              <p className="text-2xl font-bold text-gray-800">€{totalInventoryValue.toFixed(0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <CubeIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total productos</p>
              <p className="text-2xl font-bold text-gray-800">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <TruckIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transf. pendientes</p>
              <p className="text-2xl font-bold text-gray-800">{pendingTransfers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Costo de ventas</p>
              <p className="text-2xl font-bold text-red-600">€{costOfSales.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por restaurante (solo admin) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {restaurants.map(rest => {
          const value = inventoryValueByRestaurant()[rest] || 0;
          const prods = allProducts.filter(p => p.restaurant === rest).length;
          return (
            <div key={rest} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{restaurantNames[rest]}</h3>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: restaurantColors[rest] }}></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor inventario</span>
                  <span className="font-bold">€{value.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Productos</span>
                  <span className="font-bold">{prods}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pestañas de detalle */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'movements', label: '🔄 Movimientos' },
          { key: 'alerts', label: '⚠️ Alertas Stock' },
          { key: 'consumption', label: '📊 Consumo' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de pestañas */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total entradas</p>
              <p className="text-2xl font-bold text-green-600">+€{totalEntries.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total salidas</p>
              <p className="text-2xl font-bold text-red-600">-€{totalExits.toFixed(0)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Últimos movimientos en {restaurantNames[currentRestaurant]}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Producto</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-right p-3">Cantidad</th>
                    <th className="text-right p-3">Precio ud.</th>
                    <th className="text-right p-3">Valor</th>
                    <th className="text-left p-3">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMovements.slice(0, 20).map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="p-3">{new Date(m.created_at).toLocaleDateString('es')}</td>
                      <td className="p-3 font-medium">{m.products?.name || '-'}</td>
                      <td className={`p-3 font-medium ${m.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{m.type}</td>
                      <td className="p-3 text-right">{m.quantity}</td>
                      <td className="p-3 text-right">€{(m.products?.price || 0).toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold">€{((m.quantity || 0) * (m.products?.price || 0)).toFixed(2)}</td>
                      <td className="p-3">{m.users?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-800">Productos con stock bajo en {restaurantNames[currentRestaurant]}</h3>
            </div>
            <p className="text-sm text-gray-500">Valor total en riesgo: <span className="font-bold text-red-600">€{lowStockValue.toFixed(0)}</span></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts
              .filter(p => p.restaurant === currentRestaurant)
              .map(p => (
                <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-amber-200 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800">{p.name}</h4>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">Bajo</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">{p.stock || 0} {p.unit} (mín {p.min_stock || 10})</div>
                  <div className="mt-auto text-right font-semibold text-gray-800">
                    €{((p.stock || 0) * (p.price || 0)).toFixed(2)}
                  </div>
                </div>
              ))}
            {lowStockProducts.filter(p => p.restaurant === currentRestaurant).length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">🎉 No hay productos con stock bajo</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'consumption' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">📊 Top 5 productos más consumidos ({restaurantNames[currentRestaurant]})</h3>
            {topConsumed.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topConsumed} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="consumo" fill={restaurantColors[currentRestaurant]} radius={[0, 4, 4, 0]}>
                    {topConsumed.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={restaurantColors[currentRestaurant]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay datos de consumo en este período</p>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Detalle de consumo ({restaurantNames[currentRestaurant]})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Producto</th>
                    <th className="text-right p-3">Cantidad consumida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topConsumed.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 text-right font-semibold">{item.consumo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
