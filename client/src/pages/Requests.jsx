import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon,
  ClipboardDocumentListIcon, CheckCircleIcon, XCircleIcon, ClockIcon
} from '@heroicons/react/24/outline';

const Requests = () => {
  const { isAdmin, user, getRequests, addRequest, updateRequest, getProducts } = useAuth();
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Formulario
  const [formData, setFormData] = useState({
    items: [{ productName: '', quantity: '', unit: 'unidad' }],
    notes: ''
  });
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  const [productExists, setProductExists] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reqData, prodData] = await Promise.all([
        getRequests(),
        getProducts()
      ]);
      setRequests(Array.isArray(reqData) ? reqData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
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
      
      if (field === 'productName') {
        const exists = products.some(p => p.name.toLowerCase() === value.toLowerCase());
        setProductExists(prev2 => ({ ...prev2, [index]: exists }));
        
        if (exists) {
          const selectedProduct = products.find(p => p.name.toLowerCase() === value.toLowerCase());
          if (selectedProduct) {
            newItems[index].unit = selectedProduct.unit || 'unidad';
          }
        }
      }
      
      return { ...prev, items: newItems };
    });
    
    if (field === 'productName') {
      setActiveSuggestionIndex(index);
    }
  };

  const handleSelectSuggestion = (index, product) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        productName: product.name,
        unit: product.unit || 'unidad'
      };
      return { ...prev, items: newItems };
    });
    setProductExists(prev => ({ ...prev, [index]: true }));
    setActiveSuggestionIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = formData.items.filter(item => item.productName && item.quantity);
    if (validItems.length === 0) {
      alert('Agrega al menos un producto con nombre y cantidad');
      return;
    }

    try {
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
      setActiveSuggestionIndex(null);
      setProductExists({});
      loadData();
      
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('✅ Pedido enviado', {
          body: `${validItems.length} producto(s) solicitados`,
          icon: '/godeo-inventory/icon-192.png'
        });
      }
    } catch (error) {
      alert('Error al enviar: ' + error.message);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateRequest(id, status);
      loadData();
      
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const request = requests.find(r => r.id === id);
        if (request) {
          const title = status === 'aprobado' ? '✅ Pedido Aprobado' : '❌ Pedido Rechazado';
          const body = `${request.product_name} (${request.quantity} ${request.unit})`;
          new Notification(title, { body, icon: '/godeo-inventory/icon-192.png' });
        }
      }
    } catch (error) {
      alert('Error al actualizar');
    }
  };

  const getSuggestions = (input) => {
    if (!input || input.length < 1) return [];
    const search = input.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(search) || p.barcode?.includes(search))
      .slice(0, 5);
  };

  // Filtrado
  const myRequests = requests.filter(r => r.user_id === user?.id);
  const pendingRequests = isAdmin ? requests.filter(r => r.status === 'pendiente') : [];

  const filteredMyRequests = myRequests.filter(r => {
    const matchesSearch = !searchTerm || r.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredPending = pendingRequests.filter(r => {
    const matchesSearch = !searchTerm || r.product_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = pendingRequests.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📋 Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? 'Gestiona las solicitudes de los empleados' : 'Solicita los productos que necesites'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva Lista
        </button>
      </div>

      {/* KPIs (solo admin) */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-gray-500">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              <span className="text-sm text-gray-500">Aprobados hoy</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {requests.filter(r => {
                if (r.status !== 'aprobado') return false;
                const today = new Date();
                const date = new Date(r.updated_at || r.created_at);
                return date.toDateString() === today.toDateString();
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-500">Total solicitudes</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{requests.length}</p>
          </div>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="all">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobado">Aprobados</option>
          <option value="rechazado">Rechazados</option>
        </select>
      </div>

      {/* Mis Solicitudes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">📝 Mis Solicitudes ({filteredMyRequests.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredMyRequests.map(req => (
            <div key={req.id} className="px-5 py-4 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{req.product_name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {req.quantity} {req.unit}
                    {req.notes && <span className="text-gray-400 ml-2">· {req.notes}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs text-gray-400">
                    {new Date(req.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    req.status === 'pendiente' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    req.status === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {req.status === 'pendiente' ? '⏳' : req.status === 'aprobado' ? '✅' : '❌'} {req.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredMyRequests.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-gray-400 text-sm">No se encontraron solicitudes</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel Admin - Pendientes de aprobar */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              ⏳ Pendientes de aprobar
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                {filteredPending.length}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredPending.map(req => (
              <div key={req.id} className="px-5 py-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-800">{req.product_name}</p>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">
                        {req.restaurant}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {req.quantity} {req.unit}
                      <span className="text-gray-400 ml-2">· Solicitado por {req.users?.name || 'Empleado'}</span>
                    </p>
                    {req.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{req.notes}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleStatus(req.id, 'aprobado')}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      onClick={() => handleStatus(req.id, 'rechazado')}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nueva Lista */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">📋 Nueva Lista de Pedidos</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({ items: [{ productName: '', quantity: '', unit: 'unidad' }], notes: '' });
                  setActiveSuggestionIndex(null);
                  setProductExists({});
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Producto {index + 1}
                      </span>
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="relative mb-3">
                      <input
                        type="text"
                        placeholder="Buscar producto o escribir nombre..."
                        value={item.productName}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                        onFocus={() => setActiveSuggestionIndex(index)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        autoComplete="off"
                      />
                      
                      {item.productName && (
                        <div className="mt-1">
                          {productExists[index] ? (
                            <span className="text-xs text-emerald-600 flex items-center gap-1">✓ Producto del inventario</span>
                          ) : (
                            <span className="text-xs text-amber-600 flex items-center gap-1">⚠️ Producto nuevo</span>
                          )}
                        </div>
                      )}
                      
                      {activeSuggestionIndex === index && getSuggestions(item.productName).length > 0 && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                          {getSuggestions(item.productName).map(product => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleSelectSuggestion(index, product)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition flex items-center justify-between"
                            >
                              <div>
                                <span className="text-sm font-medium text-gray-800">{product.name}</span>
                                <span className="text-xs text-gray-400 ml-2">{product.category}</span>
                              </div>
                              <span className="text-xs text-gray-500">{product.stock} {product.unit}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">Unidad</label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition"
                >
                  + Agregar otro producto
                </button>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">📝 Notas generales</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instrucciones adicionales..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                    rows="2"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ items: [{ productName: '', quantity: '', unit: 'unidad' }], notes: '' });
                    setActiveSuggestionIndex(null);
                    setProductExists({});
                  }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm"
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
