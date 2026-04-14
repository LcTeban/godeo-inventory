import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '', quantity: '', toRestaurant: '', reason: ''
  });
  const { currentRestaurant, isAdmin } = useAuth();

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán' }
  ];

  const availableDestinations = restaurants.filter(r => r.id !== currentRestaurant);

  useEffect(() => {
    fetchTransfers();
    fetchProducts();
  }, [currentRestaurant]);

  const fetchTransfers = async () => {
    try {
      const response = await axios.get('/api/transfers');
      setTransfers(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`/api/${currentRestaurant}/products`);
      setProducts(response.data.filter(p => p.stock > 0));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/transfers', formData);
      setShowModal(false);
      setFormData({ productId: '', quantity: '', toRestaurant: '', reason: '' });
      fetchTransfers();
      fetchProducts();
      alert('Transferencia creada');
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    }
  };

  const handleComplete = async (transferId) => {
    try {
      await axios.post(`/api/transfers/${transferId}/complete`);
      fetchTransfers();
      alert('Transferencia completada');
    } catch (error) {
      alert('Error al completar');
    }
  };

  const getStatusBadge = (status) => {
    return status === 'pendiente' 
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Transferencias</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nueva Transferencia
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer.id}>
                  <td className="px-4 py-3 text-sm">
                    {format(new Date(transfer.createdAt), 'dd/MM HH:mm', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm">{transfer.product?.name}</td>
                  <td className="px-4 py-3 text-sm">{transfer.quantity}</td>
                  <td className="px-4 py-3 text-sm">{transfer.fromRestaurant}</td>
                  <td className="px-4 py-3 text-sm">{transfer.toRestaurant}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(transfer.status)}`}>
                      {transfer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {transfer.status === 'pendiente' && 
                     (isAdmin || currentRestaurant === transfer.toRestaurant) && (
                      <button
                        onClick={() => handleComplete(transfer.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Completar"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Nueva Transferencia</h2>
            <form onSubmit={handleSubmit}>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
                className="w-full px-3 py-2 border rounded mb-3"
                required
              >
                <option value="">Seleccionar producto</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Cantidad"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-3 py-2 border rounded mb-3"
                required
              />
              
              <select
                value={formData.toRestaurant}
                onChange={(e) => setFormData({...formData, toRestaurant: e.target.value})}
                className="w-full px-3 py-2 border rounded mb-3"
                required
              >
                <option value="">Seleccionar destino</option>
                {availableDestinations.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Motivo (opcional)"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full px-3 py-2 border rounded mb-4"
              />
              
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;
