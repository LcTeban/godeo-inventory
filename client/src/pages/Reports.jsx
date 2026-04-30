import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const { currentRestaurant, getReports } = useAuth();

  useEffect(() => {
    fetchReports();
  }, [currentRestaurant, timeRange]);

  const fetchReports = async () => {
    try {
      const data = await getReports(timeRange);
      const grouped = [];
      const map = {};
      (Array.isArray(data) ? data : []).forEach(m => {
        const name = m.products?.name || 'Desconocido';
        if (!map[name]) {
          map[name] = { name, consumed: 0, category: m.products?.category || '' };
          grouped.push(map[name]);
        }
        map[name].consumed += m.quantity;
      });
      setReportData(grouped.sort((a,b) => b.consumed - a.consumed));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">📊 Reportes de Consumo</h1>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="p-2 border rounded-lg bg-white">
          <option value="week">Semana</option>
          <option value="month">Mes</option>
          <option value="year">Año</option>
        </select>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-4">Productos más consumidos</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reportData.slice(0,10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="consumed" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;
