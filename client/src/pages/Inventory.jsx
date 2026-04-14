import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category: '', stock: '', unit: 'unidad', price: '', minStock: '10'
  });
  const [movementData, setMovementData] = useState({
    type: 'entrada', quantity: '', reason: ''
  });
  const { currentRestaurant, isAdmin } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [currentRestaurant]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`/api/${currentRestaurant}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        await axios.put(`/api/${currentRestaurant}/products/${selectedProduct.id}`, formData);
      } else {
        await axios.post(`/api/${currentRestaurant}/products`, formData);
      }
      fetchProducts();
      setShowModal(false);
      setFormData({ name: '', category: '', stock: '', unit: 'unidad', price: '', minStock: '10' });
      setSelectedProduct(null);
    } catch (error) {
      alert('Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      try {
        await axios.delete(`/api/${currentRestaurant}/products/${id}`);
        fetchProducts();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/${currentRestaurant}/movements`, {
        ...movementData,
        productId: selectedProduct.id
      });
      fetchProducts();
      setShowMovementModal(false);
      setMovementData({ type: 'entrada', quantity: '', reason: '' });
    } catch (error) {
      alert(error.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedProduct(null);
              setFormData({ name: '', category: '', stock: '', unit: 'unidad', price: '', minStock: '10' });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className={product.stock <= product.minStock ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.stock <= product.minStock ? 'text-red-600 font-bold' : ''}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">€{product.price}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowMovementModal(true);
                      }}
                      className="text-green-600 hover:text-green-900 mr-3"
                      title="Movimiento"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setFormData(product);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{selectedProduct ? 'Editar' : 'Nuevo'} Producto</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Nombre" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded mb-3" required />
              <input type="text" placeholder="Categoría" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded mb-3" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Stock" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border rounded">
                  <option value="unidad">Unidad</option><option value="kg">Kg</option><option value="L">Litro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <input type="number" placeholder="Precio" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                <input type="number" placeholder="Stock Mínimo" value={formData.minStock} onChange={(e) => setFormData({...formData, minStock: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimiento */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Movimiento - {selectedProduct?.name}</h2>
            <form onSubmit={handleMovement}>
              <select value={movementData.type} onChange={(e) => setMovementData({...movementData, type: e.target.value})} className="w-full px-3 py-2 border rounded mb-3">
                <option value="entrada">Entrada</option><option value="salida">Salida</option>
              </select>
              <input type="number" placeholder="Cantidad" value={movementData.quantity} onChange={(e) => setMovementData({...movementData, quantity: e.target.value})} className="w-full px-3 py-2 border rounded mb-3" required />
              <input type="text" placeholder="Motivo (opcional)" value={movementData.reason} onChange={(e) => setMovementData({...movementData, reason: e.target.value})} className="w-full px-3 py-2 border rounded mb-3" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowMovementModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
