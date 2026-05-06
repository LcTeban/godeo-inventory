import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    items: [{ productName: '', quantity: '', unit: 'unidad' }],
    notes: ''
  });
  const { isAdmin, user, getRequests, addRequest, updateRequest, getProducts } = useAuth();

  useEffect(() => {
    fetchRequests();
    fetchProducts();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: '', unit: 'unidad' }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Si se selecciona un producto del inventario, auto-rellenar unidad
      if (field === 'productName' && value) {
        const selectedProduct = products.find(p => p.name === value || p.id?.toString() === value);
        if (selectedProduct) {
          newItems[index].unit = selectedProduct.unit || 'unidad';
        }
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filtrar items válidos (que tengan nombre y cantidad)
    const validItems = formData.items.filter(item => item.productName && item.quantity);
    if (validItems.length === 0) {
      alert('Agrega al menos un producto con nombre y cantidad');
      return;
    }

    try {
      // Enviar cada item como una solicitud individual
      for (const item of validItems) {
        await addRequest({
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          notes: formData.notes.trim() || null
        });
      }
      
      setShowModal(false);
      setFormData({ items: [{ productName: '', quantity: '', unit: 'unidad' }], notes: '' });
      fetchRequests();
      
      // Notificación local
      showNotification('✅ Pedido enviado', `${validItems.length} producto(s) solicitados`);
    } catch (error) {
      alert('Error al enviar: ' + error.message);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateRequest(id, status);
      fetchRequests();
      
      const request = requests.find(r => r.id === id);
      if (request) {
        const msg = status === 'aprobado' 
          ? `✅ Aprobado: ${request.product_name} (${request.quantity} ${request.unit})`
          : `❌ Rechazado: ${request.product_name}`;
        showNotification('Estado actualizado', msg);
      }
    } catch (error) {
      alert('Error al actualizar');
    }
  };

  const showNotification = (title, body) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/godeo-inventory/icon-192.png' });
    }
  };

  // Obtener sugerencias de búsqueda (productos existentes + texto libre)
  const getSuggestions = (input) => {
    if (!input || input.length < 2) return [];
    const search = input.toLowerCase();
    return products
      .filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.barcode?.includes(search)
      )
      .slice(0, 5);
  };

  const myRequests = requests.filter(r => r.user_id === user?.id);
  const pendingRequests = isAdmin ? requests.filter(r => r.status === 'pendiente') : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">📋 Pedidos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1"
        >
          <PlusIcon className="h-4 w-4" /> Nueva Lista
        </button>
      </div>

      {/* Mis Solicitudes */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-3">📝 Mis Solicitudes</h2>
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
              {req.notes && (
                <p className="text-xs text-gray-500 mt-1">{req.notes}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(req.created_at).toLocaleDateString('es')}
              </p>
            </div>
          ))}
          {myRequests.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">No has hecho solicitudes</p>
          )}
        </div>
      </div>

      {/* Panel Admin - Pendientes */}
      {isAdmin && pendingRequests.length > 0 && (
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
                <p className="text-sm text-gray-600">{req.quantity} {req.unit}</p>
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
          </div>
        </div>
      )}

      {/* Modal Nueva Lista de Pedidos */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">📋 Nueva Lista de Pedidos</h2>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Lista de productos */}
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded-xl p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Producto {index + 1}
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Campo de búsqueda con sugerencias */}
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="🔍 Buscar o escribir nombre..."
                        value={item.productName}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm"
                        list={`suggestions-${index}`}
                        autoComplete="off"
                      />
                      <datalist id={`suggestions-${index}`}>
                        {getSuggestions(item.productName).map(p => (
                          <option key={p.id} value={p.name}>
                            {p.stock} {p.unit} disponibles
                          </option>
                        ))}
                      </datalist>
                      
                      {/* Mostrar coincidencia exacta */}
                      {item.productName && products.find(p => 
                        p.name.toLowerCase() === item.productName.toLowerCase()
                      ) && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Producto existente en inventario
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Cant."
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="flex-1 p-2 border rounded-lg text-sm"
                        required
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-20 p-2 border rounded-lg text-sm"
                      >
                        <option value="unidad">ud</option>
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                        <option value="caja">caja</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full p-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl text-sm hover:bg-blue-50 transition font-medium"
                >
                  + Agregar otro producto
                </button>
              </div>

              {/* Notas generales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📝 Notas generales (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ej: Para evento del fin de semana"
                  className="w-full p-2 border rounded-lg text-sm"
                  rows="2"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ items: [{ productName: '', quantity: '', unit: 'unidad' }], notes: '' });
                  }}
                  className="flex-1 p-3 border rounded-xl text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
                >
                  Enviar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
