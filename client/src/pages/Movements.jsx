import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Movements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentRestaurant, getMovements } = useAuth();

  useEffect(() => {
    fetchMovements();
  }, [currentRestaurant]);

  const fetchMovements = async () => {
    try {
      const data = await getMovements();
      setMovements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Historial de Movimientos</h1>
      <div className="space-y-2">
        {movements.map(mov => (
          <div key={mov.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{mov.products?.name || 'Producto'}</p>
                <p className="text-sm text-gray-500">{mov.reason || 'Sin motivo'}</p>
                <p className="text-xs text-gray-400">{new Date(mov.created_at).toLocaleString('es')}</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${mov.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                  {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                </span>
                <p className="text-xs text-gray-500">{mov.users?.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Movements;
