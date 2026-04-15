import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, TruckIcon } from '@heroicons/react/24/outline';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    productId: '', quantity: '', toRestaurant: '', reason: ''
  });
  const { currentRestaurant, isAdmin } = useAuth();

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️' }
  ];

  const availableDestinations = restaurants.filter(r => r.id !== currentRestaurant);

  useEffect(() => {
    fetchData();
  }, [currentRestaurant]);

  const fetchData = async () => {
    try {
      const [transRes, prodRes] = await Promise.all([
        axios.get('/api/transfers'),
        axios.get(`/api/${currentRestaurant}/products`)
      ]);
      setTransfers(transRes.data || []);
      setProducts((prodRes.data || []).filter(p => p.stock > 0));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/transfers', formData);
      setShowModal(false);
      setFormData({ productId: '', quantity: '', toRestaurant: '', reason: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    }
  };

  const handleComplete = async (transferId) => {
    try {
      await axios.post(`/api/transfers/${transferId}/complete`);
      fetchData();
    } catch (error) {
      alert('Error al completar');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Transferencias</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
        >
          + Nueva
        </button>
      </div>

      <div className="space-y-2">
        {transfers.map(transfer => (
          <div key={transfer.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-semibold">{transfer.product_name}</p>
                  <p className="text-sm text-gray-600">
                    {transfer.quantity} • {transfer.from_restaurant} → {transfer.to_restaurant}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(transfer.created_at).toLocaleString('es', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div>
                {transfer.status === 'pendiente' ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Pendiente
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Completado ✓
                  </span>
                )}
              </div>
            </div>
            {transfer.status === 'pendiente' && (isAdmin || currentRestaurant === transfer.to_restaurant) && (
              <button
                onClick={() => handleComplete(transfer.id)}
                className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm"
              >
                Confirmar Recepción
              </button>
            )}
          </div>
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay transferencias
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nueva Transferencia</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                value={formData.productId}
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
                className="w-full p-3 border rounded-xl"
                required
              >
                <option value="">Seleccionar producto</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Cantidad"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full p-3 border rounded-xl"
                required
              />
              
              <select
                value={formData.toRestaurant}
                onChange={(e) => setFormData({...formData, toRestaurant: e.target.value})}
                className="w-full p-3 border rounded-xl"
                required
              >
                <option value="">Destino</option>
                {availableDestinations.map(r => (
                  <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Nota (opcional)"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full p-3 border rounded-xl"
              />
              
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3 border rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-blue-600 text-white rounded-xl">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;
