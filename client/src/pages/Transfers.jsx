import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    productId: '', quantity: '', toRestaurant: '', reason: ''
  });
  const { currentRestaurant, isAdmin, getTransfers, getProducts, addTransfer, completeTransfer } = useAuth();

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
      const [transData, prodData] = await Promise.all([
        getTransfers(),
        getProducts()
      ]);
      setTransfers(Array.isArray(transData) ? transData : []);
      setProducts((Array.isArray(prodData) ? prodData : []).filter(p => p.stock > 0));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addTransfer(formData);
      setShowModal(false);
      setFormData({ productId: '', quantity: '', toRestaurant: '', reason: '' });
      fetchData();
    } catch (error) {
      alert('Error al crear transferencia: ' + error.message);
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeTransfer(id);
      fetchData();
    } catch (error) {
      alert('Error al completar: ' + error.message);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Transferencias</h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">+ Nueva</button>
      </div>

      <div className="space-y-2">
        {transfers.map(transfer => (
          <div key={transfer.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{transfer.products?.name}</p>
                <p className="text-sm text-gray-600">{transfer.quantity} {transfer.products?.unit} • {transfer.from_restaurant} → {transfer.to_restaurant}</p>
                {transfer.reason && <p className="text-xs text-gray-500">{transfer.reason}</p>}
                <p className="text-xs text-gray-400">{new Date(transfer.created_at).toLocaleString('es')}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${transfer.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {transfer.status}
              </span>
            </div>
            {transfer.status === 'pendiente' && (isAdmin || currentRestaurant === transfer.to_restaurant) && (
              <button onClick={() => handleComplete(transfer.id)} className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm">Confirmar Recepción</button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nueva Transferencia</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})} className="w-full p-3 border rounded-xl" required>
                <option value="">Seleccionar producto</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>)}
              </select>
              <input type="number" step="0.01" placeholder="Cantidad" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full p-3 border rounded-xl" required />
              <select value={formData.toRestaurant} onChange={(e) => setFormData({...formData, toRestaurant: e.target.value})} className="w-full p-3 border rounded-xl" required>
                <option value="">Destino</option>
                {availableDestinations.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
              </select>
              <input type="text" placeholder="Nota (opcional)" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full p-3 border rounded-xl" />
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
