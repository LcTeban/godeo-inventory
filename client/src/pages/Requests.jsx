import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon } from '@heroicons/react/24/outline';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ productName: '', quantity: '', unit: 'unidad', notes: '' });
  const { isAdmin, user, getRequests, addRequest, updateRequest } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addRequest(formData);
      setShowModal(false);
      setFormData({ productName: '', quantity: '', unit: 'unidad', notes: '' });
      fetchRequests();
    } catch (error) {
      alert('Error al enviar');
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateRequest(id, status);
      fetchRequests();
    } catch (error) {
      alert('Error');
    }
  };

  const myRequests = requests.filter(r => r.user_id === user?.id);
  const pendingRequests = isAdmin ? requests.filter(r => r.status === 'pendiente') : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Pedidos</h1>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1">
          <PlusIcon className="h-4 w-4" /> Solicitar
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-3">📋 Mis Solicitudes</h2>
        {myRequests.map(req => (
          <div key={req.id} className="border rounded-lg p-3 mb-2">
            <div className="flex justify-between">
              <span className="font-medium">{req.product_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                req.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                req.status === 'aprobado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>{req.status}</span>
            </div>
            <p className="text-sm text-gray-600">{req.quantity} {req.unit}</p>
            {req.notes && <p className="text-xs text-gray-500">{req.notes}</p>}
          </div>
        ))}
      </div>

      {isAdmin && pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold mb-3">⏳ Pendientes de aprobar</h2>
          {pendingRequests.map(req => (
            <div key={req.id} className="border rounded-lg p-3 mb-2">
              <div className="flex justify-between">
                <span className="font-medium">{req.product_name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{req.restaurant}</span>
              </div>
              <p className="text-sm">{req.quantity} {req.unit}</p>
              <p className="text-xs text-gray-500">Solicitado por: {req.users?.name}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleStatus(req.id, 'aprobado')} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm">Aprobar</button>
                <button onClick={() => handleStatus(req.id, 'rechazado')} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm">Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Solicitar Producto</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Nombre del producto" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full p-3 border rounded-xl" required />
              <div className="flex gap-2">
                <input type="number" step="0.01" placeholder="Cantidad" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="flex-1 p-3 border rounded-xl" required />
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-24 p-3 border rounded-xl">
                  <option value="unidad">ud</option><option value="kg">kg</option><option value="L">L</option><option value="caja">caja</option>
                </select>
              </div>
              <textarea placeholder="Notas" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-3 border rounded-xl" rows="2" />
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

export default Requests;
