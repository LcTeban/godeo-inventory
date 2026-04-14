import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '', contact: '', phone: '', email: '', address: ''
  });
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        await axios.put(`/api/suppliers/${selectedSupplier.id}`, formData);
      } else {
        await axios.post('/api/suppliers', formData);
      }
      fetchSuppliers();
      setShowModal(false);
      setFormData({ name: '', contact: '', phone: '', email: '', address: '' });
      setSelectedSupplier(null);
    } catch (error) {
      alert('Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este proveedor?')) {
      try {
        await axios.delete(`/api/suppliers/${id}`);
        fetchSuppliers();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Proveedores</h1>
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedSupplier(null);
              setFormData({ name: '', contact: '', phone: '', email: '', address: '' });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{supplier.name}</h3>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSupplier(supplier);
                      setFormData(supplier);
                      setShowModal(true);
                    }}
                    className="text-blue-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(supplier.id)} className="text-red-600">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {supplier.contact && <p><strong>Contacto:</strong> {supplier.contact}</p>}
              {supplier.phone && <p><strong>Tel:</strong> {supplier.phone}</p>}
              {supplier.email && <p><strong>Email:</strong> {supplier.email}</p>}
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-8 text-gray-500">No hay proveedores</div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{selectedSupplier ? 'Editar' : 'Nuevo'} Proveedor</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Nombre" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded mb-3" required />
              <input type="text" placeholder="Contacto" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full px-3 py-2 border rounded mb-3" />
              <input type="tel" placeholder="Teléfono" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded mb-3" />
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded mb-3" />
              <input type="text" placeholder="Dirección" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded mb-4" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
