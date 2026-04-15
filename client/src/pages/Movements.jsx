import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
      setMovements(response.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    return type === 'entrada' ? 'text-green-600' : 'text-red-600';
  };

  const getTypeIcon = (type) => {
    return type === 'entrada' ? '📥' : '📤';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Historial de Movimientos</h1>
      
      <div className="space-y-2">
        {movements.map(mov => (
          <div key={mov.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <span className="text-2xl">{getTypeIcon(mov.type)}</span>
                <div>
                  <p className="font-semibold">{mov.product_name}</p>
                  <p className="text-sm text-gray-500">{mov.reason || 'Sin motivo'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(mov.created_at).toLocaleString('es', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xl font-bold ${getTypeColor(mov.type)}`}>
                  {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                </span>
                <p className="text-xs text-gray-500">{mov.user_name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {movements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay movimientos registrados
        </div>
      )}
    </div>
  );
};

export default Movements;
