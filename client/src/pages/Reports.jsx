import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import {
  CurrencyDollarIcon, CubeIcon, ExclamationTriangleIcon,
  ArrowTrendingDownIcon, TruckIcon, ArrowUpIcon, ArrowDownIcon,
  DocumentArrowDownIcon, TableCellsIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Reports = () => {
  const { isAdmin, currentRestaurant, switchRestaurant, getProducts, getMovements, getTransfers } = useAuth();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [allProducts, setAllProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });

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

  // ---- Cálculos financieros ----
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
  const pendingTransfers = transfers.filter(t => t.status === 'pendiente').length;

  // ---- Datos para gráficos ----
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

  const categoryMap = {};
  filteredMovements
    .filter(m => m.type === 'salida')
    .forEach(m => {
      const cat = m.products?.category || 'Sin categoría';
      categoryMap[cat] = (categoryMap[cat] || 0) + (m.quantity || 0);
    });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // ---- Ordenación de tabla ----
  const currentRestProducts = allProducts.filter(p => p.restaurant === currentRestaurant);
  const sortedProducts = [...currentRestProducts].sort((a, b) => {
    const aVal = a[sortConfig.field] || '';
    const bVal = b[sortConfig.field] || '';
    if (sortConfig.field === 'price' || sortConfig.field === 'stock') {
      return sortConfig.direction === 'asc' ? (aVal - bVal) : (bVal - aVal);
    }
    return sortConfig.direction === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const requestSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3 inline ml-1" /> : <ArrowDownIcon className="h-3 w-3 inline ml-1" />;
  };

  // ---- Exportaciones ----
  const exportToExcel = () => {
    const data = sortedProducts.map(p => ({
      'Producto': p.name,
      'Categoría': p.categories?.name || '',
      'Stock': p.stock,
      'Unidad': p.unit,
      'Precio': p.price || 0,
      'Valor total': (p.stock || 0) * (p.price || 0)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `reporte_inventario_${currentRestaurant}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Reporte de Inventario - ${restaurantNames[currentRestaurant]}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es')}`, 14, 28);
    const tableData = sortedProducts.map(p => [
      p.name, p.categories?.name || '', `${p.stock} ${p.unit}`, `€${(p.price || 0).toFixed(2)}`, `€${((p.stock || 0) * (p.price || 0)).toFixed(2)}`
    ]);
    doc.autoTable({
      head: [['Producto', 'Categoría', 'Stock', 'Precio Ud.', 'Valor Total']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] }
    });
    doc.save(`reporte_inventario_${currentRestaurant}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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

  // Variantes framer-motion para animaciones sutiles
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  if (!isAdmin) return null;
  if (loading) return (
    <div className="text-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-slate-500 dark:text-gray-400">Cargando reportes...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">📊 Reportes Financieros</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">Panel de control y análisis de inventario</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={currentRestaurant}
            onChange={(e) => switchRestaurant(e.target.value)}
            className="border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
          >
            {restaurants.map(rest => (
              <option key={rest} value={rest}>{restaurantNames[rest]}</option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
          >
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="year">Último año</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-3" variants={itemVariants}>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-gray-400">Valor Inventario</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">€{totalInventoryValue.toFixed(0)}</p>
          </div>
        </motion.div>
        <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-3" variants={itemVariants}>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <CubeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-gray-400">Total Productos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalProducts}</p>
          </div>
        </motion.div>
        <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-3" variants={itemVariants}>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
            <TruckIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-gray-400">Transf. Pendientes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingTransfers}</p>
          </div>
        </motion.div>
        <motion.div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm flex items-center gap-3" variants={itemVariants}>
          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl">
            <ArrowTrendingDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-gray-400">Costo de Ventas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">€{costOfSales.toFixed(0)}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Resumen por restaurante */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {restaurants.map(rest => {
          const value = inventoryValueByRestaurant()[rest] || 0;
          const prods = allProducts.filter(p => p.restaurant === rest).length;
          return (
            <div key={rest} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 dark:text-white">{restaurantNames[rest]}</h3>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: restaurantColors[rest] }}></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-gray-400">Valor inventario</span>
                  <span className="font-bold text-slate-900 dark:text-white">€{value.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-gray-400">Productos</span>
                  <span className="font-bold text-slate-900 dark:text-white">{prods}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'overview', label: '📈 Resumen' },
          { key: 'inventory', label: '📦 Inventario' },
          { key: 'movements', label: '🔄 Movimientos' },
          { key: 'alerts', label: '⚠️ Alertas' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de pestañas */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Barras: Top 5 consumo */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">📊 Top 5 productos más consumidos</h3>
              {topConsumed.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topConsumed} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                    <XAxis type="number" tick={{ fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }} />
                    <Bar dataKey="consumo" fill={restaurantColors[currentRestaurant]} radius={[0, 4, 4, 0]}>
                      {topConsumed.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={restaurantColors[currentRestaurant]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 dark:text-gray-500 text-center py-12">Sin datos de consumo en este período</p>
              )}
            </div>

            {/* Pastel: Distribución por categoría */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">🥧 Distribución por categoría</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fill: '#94a3b8' }}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }} />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 dark:text-gray-500 text-center py-12">Sin datos de categorías</p>
              )}
            </div>
          </div>

          {/* Totales de movimientos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-slate-500 dark:text-gray-400">Total entradas</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+€{totalEntries.toFixed(0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-slate-500 dark:text-gray-400">Total salidas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">-€{totalExits.toFixed(0)}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white">Inventario actual de {restaurantNames[currentRestaurant]}</h3>
            <div className="flex gap-2">
              <button onClick={exportToExcel} className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition" title="Excel">
                <TableCellsIcon className="h-5 w-5" />
              </button>
              <button onClick={exportToPDF} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="PDF">
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 cursor-pointer hover:text-orange-500 text-slate-500 dark:text-gray-400" onClick={() => requestSort('name')}>
                    Producto {getSortIcon('name')}
                  </th>
                  <th className="text-left px-4 py-3 cursor-pointer hover:text-orange-500 text-slate-500 dark:text-gray-400" onClick={() => requestSort('category')}>
                    Categoría {getSortIcon('category')}
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer hover:text-orange-500 text-slate-500 dark:text-gray-400" onClick={() => requestSort('stock')}>
                    Stock {getSortIcon('stock')}
                  </th>
                  <th className="text-right px-4 py-3 cursor-pointer hover:text-orange-500 text-slate-500 dark:text-gray-400" onClick={() => requestSort('price')}>
                    Precio {getSortIcon('price')}
                  </th>
                  <th className="text-right px-4 py-3 text-slate-500 dark:text-gray-400">Valor total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {sortedProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{p.categories?.name || '-'}</td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{p.stock || 0} {p.unit}</td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white">€{(p.price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">€{((p.stock || 0) * (p.price || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700">
            <h3 className="font-bold text-slate-900 dark:text-white">Últimos movimientos en {restaurantNames[currentRestaurant]}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-gray-400">Fecha</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-gray-400">Producto</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-gray-400">Tipo</th>
                  <th className="text-right px-4 py-3 text-slate-500 dark:text-gray-400">Cantidad</th>
                  <th className="text-right px-4 py-3 text-slate-500 dark:text-gray-400">Precio ud.</th>
                  <th className="text-right px-4 py-3 text-slate-500 dark:text-gray-400">Valor</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-gray-400">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredMovements.slice(0, 30).map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{new Date(m.created_at).toLocaleDateString('es')}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{m.products?.name || '-'}</td>
                    <td className={`px-4 py-3 font-medium ${m.type === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{m.type}</td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{m.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white">€{(m.products?.price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">€{((m.quantity || 0) * (m.products?.price || 0)).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{m.users?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">Productos con stock bajo en {restaurantNames[currentRestaurant]}</h3>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Valor total en riesgo: <span className="font-bold">
                €{allProducts.filter(p => p.restaurant === currentRestaurant && p.stock <= p.min_stock).reduce((sum, p) => sum + (p.stock * p.price || 0), 0).toFixed(2)}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allProducts.filter(p => p.restaurant === currentRestaurant && p.stock <= p.min_stock).map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">{p.name}</h4>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">Bajo</span>
                </div>
                <div className="text-sm text-slate-500 dark:text-gray-400 mb-2">{p.stock || 0} {p.unit} (mín {p.min_stock || 10})</div>
                <div className="mt-auto text-right font-bold text-slate-900 dark:text-white">
                  €{((p.stock || 0) * (p.price || 0)).toFixed(2)}
                </div>
              </div>
            ))}
            {allProducts.filter(p => p.restaurant === currentRestaurant && p.stock <= p.min_stock).length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500 dark:text-gray-400">🎉 No hay productos con stock bajo</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
