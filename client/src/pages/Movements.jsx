import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Movements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentRestaurant } = useAuth();

  useEffect(() => {
    fetchMovements();
  }, [currentRestaurant]);

  const fetchMovements = async () => {
    try {
      const response = await axios.get(`/api/${currentRestaurant}/movements`);
      setMovements(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Historial de Movimientos</h1>
      
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.map((mov) => (
                <tr key={mov.id}>
                  <td className="px-4 py-3 text-sm">
                    {format(new Date(mov.createdAt), 'dd/MM HH:mm', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm">{mov.product?.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      mov.type === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {mov.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{mov.quantity}</td>
                  <td className="px-4 py-3 text-sm">{mov.user?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Movements;
