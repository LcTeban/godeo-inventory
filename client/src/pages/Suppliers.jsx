import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '', contact: '', phone: '', email: '', address: ''
  });
  const { isAdmin, getSuppliers, addSupplier, updateSupplier, deleteSupplier } = useAuth();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contact: '', phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await addSupplier(formData);
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este proveedor?')) {
      try {
        await deleteSupplier(id);
        fetchSuppliers();
      } catch (error) {
        alert('Error al eliminar: ' + error.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Proveedores</h1>
        {isAdmin && (
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1">
            <PlusIcon className="h-4 w-4" /> Nuevo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{s.name}</h3>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1 text-blue-600"><PencilIcon className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1 text-red-600"><TrashIcon className="h-4 w-4" /></button>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              {s.contact && <p>👤 {s.contact}</p>}
              {s.phone && <p>📞 {s.phone}</p>}
              {s.email && <p>✉️ {s.email}</p>}
              {s.address && <p>📍 {s.address}</p>}
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-8 text-gray-500">No hay proveedores registrados</div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingSupplier ? 'Editar' : 'Nuevo'} Proveedor</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Nombre*" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl" required />
              <input type="text" placeholder="Persona de contacto" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full p-3 border rounded-xl" />
              <input type="tel" placeholder="Teléfono" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl" />
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-xl" />
              <input type="text" placeholder="Dirección" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-3 border rounded-xl" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3 border rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-blue-600 text-white rounded-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
