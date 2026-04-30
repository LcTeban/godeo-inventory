import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  // Lista de ítems del formulario
  const [items, setItems] = useState([
    { productName: '', quantity: '', unit: 'unidad' }
  ]);
  const [batchNote, setBatchNote] = useState('');
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

  // Agregar una línea más al formulario
  const addItemLine = () => {
    setItems([...items, { productName: '', quantity: '', unit: 'unidad' }]);
  };

  // Eliminar una línea
  const removeItemLine = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Actualizar un campo de una línea
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que al menos un ítem tenga nombre y cantidad
    const validItems = items.filter(item => item.productName && item.quantity);
    if (validItems.length === 0) {
      alert('Agrega al menos un producto con nombre y cantidad');
      return;
    }

    try {
      // Enviar cada ítem como una solicitud individual
      for (const item of validItems) {
        await addRequest({
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          notes: batchNote.trim() || null  // Nota general para toda la lista
        });
      }

      setShowModal(false);
      setItems([{ productName: '', quantity: '', unit: 'unidad' }]);
      setBatchNote('');
      fetchRequests();
    } catch (error) {
      alert('Error al enviar: ' + error.message);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateRequest(id, status);
      fetchRequests();
    } catch (error) {
      alert('Error al actualizar');
    }
  };

  // Filtrar solicitudes
  const myRequests = requests.filter(r => r.user_id === user?.id);
  const pendingRequests = isAdmin ? requests.filter(r => r.status === 'pendiente') : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Pedidos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1"
        >
          <PlusIcon className="h-4 w-4" /> Nueva lista
        </button>
      </div>

      {/* Mis solicitudes (cada empleado ve las suyas) */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-3">📋 Mis Solicitudes</h2>
        <div className="space-y-2">
          {myRequests.map(req => (
            <div key={req.id} className="border rounded-lg p-3">
              <div className="flex justify-between">
                <span className="font-medium">{req.product_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  req.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  req.status === 'aprobado' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {req.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{req.quantity} {req.unit}</p>
              {req.notes && <p className="text-xs text-gray-500">{req.notes}</p>}
              <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString('es')}</p>
            </div>
          ))}
          {myRequests.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No has hecho solicitudes</p>
          )}
        </div>
      </div>

      {/* Panel del administrador */}
      {isAdmin && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold mb-3">⏳ Pendientes de aprobar ({pendingRequests.length})</h2>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="border rounded-lg p-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{req.product_name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {req.restaurant}
                  </span>
                </div>
                <p className="text-sm">{req.quantity} {req.unit}</p>
                <p className="text-xs text-gray-500">Solicitado por: {req.users?.name || 'Empleado'}</p>
                {req.notes && <p className="text-xs text-gray-600 mt-1">"{req.notes}"</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleStatus(req.id, 'aprobado')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm"
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => handleStatus(req.id, 'rechazado')}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm"
                  >
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No hay solicitudes pendientes</p>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear lista */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[85vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Nueva lista de pedidos</h2>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3 pr-1">
              {/* Líneas de productos */}
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Producto {index + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItemLine(index)} className="text-red-500 text-sm">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Nombre*"
                    value={item.productName}
                    onChange={(e) => updateItem(index, 'productName', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cant.*"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="flex-1 p-2 border rounded text-sm"
                      required
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      className="w-20 p-2 border rounded text-sm"
                    >
                      <option value="unidad">ud</option>
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="caja">caja</option>
                    </select>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItemLine}
                className="w-full p-2 border border-dashed border-blue-400 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
              >
                + Agregar otro producto
              </button>

              <div>
                <label className="block text-sm font-medium mb-1">Nota general (opcional)</label>
                <textarea
                  value={batchNote}
                  onChange={(e) => setBatchNote(e.target.value)}
                  placeholder="Ej: Para evento del sábado"
                  className="w-full p-2 border rounded text-sm"
                  rows="2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3 border rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-blue-600 text-white rounded-xl">Enviar lista</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
