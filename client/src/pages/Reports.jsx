import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
  const { isAdmin, getProducts, getMovements } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('summary');
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  // Redirigir si no es admin
  useEffect(() => {
    if (!isAdmin) navigate('/dashboard');
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodData, movData] = await Promise.all([
        getProducts(),
        getMovements()
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setMovements(Array.isArray(movData) ? movData : []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---- Cálculos financieros ----
  const inventoryValueByRestaurant = () => {
    const map = {};
    products.forEach(p => {
      const rest = p.restaurant;
      if (!map[rest]) map[rest] = 0;
      map[rest] += (p.stock * (p.price || 0));
    });
    return map;
  };

  const totalInventoryValue = Object.values(inventoryValueByRestaurant()).reduce((a, b) => a + b, 0);

  const productsLowStock = products.filter(p => p.stock <= p.min_stock);
  const lowStockValue = productsLowStock.reduce((sum, p) => sum + (p.stock * (p.price || 0)), 0);

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
    .reduce((sum, m) => sum + (m.quantity * (m.products?.price || 0)), 0);
  const totalExits = filteredMovements
    .filter(m => m.type === 'salida')
    .reduce((sum, m) => sum + (m.quantity * (m.products?.price || 0)), 0);
  const cogs = totalExits; // Costo de mercancía vendida

  const pendingTransfers = () => {
    // Usamos la función del contexto para transferencias (se puede pedir)
    // Pero como Reports es solo admin, podemos llamar a getTransfers desde el contexto
    // Debemos agregar getTransfers en AuthContext si no está (ya está)
    return 0; // Lo obtendremos más abajo
  };

  // Agregaremos en AuthContext la función getTransfers para usarla aquí
  // Pero para no modificar AuthContext ahora, usaremos un estado adicional
  const [transfers, setTransfers] = useState([]);
  useEffect(() => {
    const { getTransfers } = useAuth();
    if (getTransfers) {
      getTransfers().then(data => setTransfers(Array.isArray(data) ? data : [])).catch(() => {});
    }
  }, []);

  const restaurants = ['POZOBLANCO', 'FUERTEVENTURA', 'GRAN_CAPITAN'];
  const restaurantNames = {
    POZOBLANCO: '🍽️ Pozoblanco',
    FUERTEVENTURA: '🏖️ Fuerteventura',
    GRAN_CAPITAN: '🏛️ Gran Capitán'
  };

  if (!isAdmin) return null;
  if (loading) return <div className="text-center py-8 text-gray-500">Cargando reportes...</div>;

  const tabs = [
    { key: 'summary', label: '📊 Resumen' },
    { key: 'inventory', label: '📦 Inventario Valorizado' },
    { key: 'movements', label: '🔄 Movimientos' },
    { key: 'alerts', label: '⚠️ Alertas Stock' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📊 Reportes Financieros</h1>
      
      {/* Pestañas */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selector de período (para movimientos) */}
      {activeTab === 'movements' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Período:</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="border rounded-lg p-2 text-sm">
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
          </select>
        </div>
      )}

      {/* Contenido de pestañas */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Tarjetas por restaurante */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {restaurants.map(rest => (
              <div key={rest} className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-lg">{restaurantNames[rest]}</h3>
                <p className="text-2xl font-bold mt-2">€{inventoryValueByRestaurant()[rest]?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-gray-500">Valor inventario</p>
                <p className="text-sm mt-2">
                  {products.filter(p => p.restaurant === rest).length} productos
                </p>
              </div>
            ))}
          </div>
          {/* Totales generales */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-lg">💰 Total General</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Valor total inventario</p>
                <p className="text-xl font-bold">€{totalInventoryValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Productos totales</p>
                <p className="text-xl font-bold">{products.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transferencias pendientes</p>
                <p className="text-xl font-bold">{transfers.filter(t => t.status === 'pendiente').length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Costo de ventas (período)</p>
                <p className="text-xl font-bold text-red-600">€{cogs.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Producto</th>
                <th className="text-left p-2">Restaurante</th>
                <th className="text-left p-2">Stock</th>
                <th className="text-left p-2">Precio unit.</th>
                <th className="text-left p-2">Valor total</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2">{restaurantNames[p.restaurant]}</td>
                  <td className="p-2">{p.stock} {p.unit}</td>
                  <td className="p-2">€{(p.price || 0).toFixed(2)}</td>
                  <td className="p-2 font-semibold">€{(p.stock * (p.price || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total entradas (€)</p>
              <p className="text-xl font-bold text-green-600">+€{totalEntries.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total salidas (€)</p>
              <p className="text-xl font-bold text-red-600">-€{totalExits.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Diferencia</p>
              <p className={`text-xl font-bold ${totalEntries - totalExits >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                €{(totalEntries - totalExits).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Cantidad</th>
                  <th className="text-left p-2">Precio unit.</th>
                  <th className="text-left p-2">Valor mov.</th>
                  <th className="text-left p-2">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.slice(0, 50).map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2">{new Date(m.created_at).toLocaleDateString('es')}</td>
                    <td className="p-2">{m.products?.name || '-'}</td>
                    <td className={`p-2 font-medium ${m.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {m.type}
                    </td>
                    <td className="p-2">{m.quantity}</td>
                    <td className="p-2">€{(m.products?.price || 0).toFixed(2)}</td>
                    <td className="p-2 font-semibold">€{(m.quantity * (m.products?.price || 0)).toFixed(2)}</td>
                    <td className="p-2">{m.users?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Productos con stock bajo</h3>
            <p className="text-sm text-gray-600">Valor total en riesgo: <span className="font-bold text-red-600">€{lowStockValue.toFixed(2)}</span></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsLowStock.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-400">
                <div className="flex justify-between">
                  <h4 className="font-medium">{p.name}</h4>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Stock bajo</span>
                </div>
                <p className="text-sm text-gray-500">{restaurantNames[p.restaurant]}</p>
                <div className="mt-2 flex justify-between items-end">
                  <div>
                    <span className="text-lg font-bold">{p.stock}</span>
                    <span className="text-sm text-gray-500 ml-1">{p.unit}</span>
                  </div>
                  <span className="font-semibold">€{((p.stock || 0) * (p.price || 0)).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          {productsLowStock.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay productos con stock bajo</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
