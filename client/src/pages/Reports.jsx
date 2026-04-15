import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from 'recharts';

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const { currentRestaurant } = useAuth();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  useEffect(() => {
    fetchReportData();
  }, [currentRestaurant, timeRange]);

  const fetchReportData = async () => {
    try {
      const response = await axios.get(`/api/reports/consumption/${currentRestaurant}?range=${timeRange}`);
      setReportData(response.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por categoría para el gráfico circular
  const categoryData = reportData.reduce((acc, item) => {
    const existing = acc.find(c => c.category === item.category);
    if (existing) {
      existing.consumed += item.consumed;
    } else {
      acc.push({ category: item.category, consumed: item.consumed });
    }
    return acc;
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando gráficos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">📊 Reportes de Consumo</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="p-2 border rounded-lg bg-white"
        >
          <option value="week">Última semana</option>
          <option value="month">Último mes</option>
          <option value="year">Último año</option>
        </select>
      </div>

      {reportData.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          No hay datos de consumo para mostrar
        </div>
      ) : (
        <>
          {/* Gráfico de barras - Top 10 productos */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-4">🍽️ Top 10 Productos Más Consumidos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="consumed" fill="#3B82F6" name="Cantidad Consumida" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico circular - Por categoría */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-4">🥧 Distribución por Categoría</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="consumed"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de resumen */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-4">📋 Resumen de Consumo</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Producto</th>
                    <th className="px-4 py-2 text-left">Categoría</th>
                    <th className="px-4 py-2 text-right">Cantidad Consumida</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2 text-gray-500">{item.category}</td>
                      <td className="px-4 py-2 text-right font-semibold">{item.consumed || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
