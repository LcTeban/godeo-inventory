import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon,
  BuildingOffice2Icon, PhoneIcon, EnvelopeIcon, MapPinIcon,
  UserIcon, CubeIcon, Squares2X2Icon, ListBulletIcon,
  XMarkIcon, FunnelIcon, ArrowUpIcon, ArrowDownIcon
} from '@heroicons/react/24/outline';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

const Suppliers = () => {
  const { isAdmin, getSuppliers, addSupplier, updateSupplier, deleteSupplier, getProducts } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', contact: '', phone: '', email: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useLockBodyScroll(showModal);

  useEffect(() => {
    loadData();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppData, prodData] = await Promise.all([getSuppliers(), getProducts()]);
      setSuppliers(Array.isArray(suppData) ? suppData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const getSupplierStats = (supplierId) => products.filter(p => p.supplier_id === supplierId).length;

  const openAdd = () => { setEditingSupplier(null); setFormData({ name: '', contact: '', phone: '', email: '', address: '' }); setShowModal(true); };
  const openEdit = (supplier) => { setEditingSupplier(supplier); setFormData({ name: supplier.name || '', contact: supplier.contact || '', phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingSupplier) await updateSupplier(editingSupplier.id, formData);
      else await addSupplier(formData);
      setShowModal(false);
      setFormData({ name: '', contact: '', phone: '', email: '', address: '' });
      setEditingSupplier(null);
      loadData();
    } catch (error) { alert('Error: ' + error.message); } finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este proveedor?')) {
      try { await deleteSupplier(id); loadData(); } catch (error) { alert('Error al eliminar'); }
    }
  };

  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];
    if (searchTerm) { const search = searchTerm.toLowerCase(); result = result.filter(s => s.name?.toLowerCase().includes(search) || s.contact?.toLowerCase().includes(search) || s.email?.toLowerCase().includes(search) || s.phone?.includes(search)); }
    result.sort((a, b) => { let valA = a[sortBy] || '', valB = b[sortBy] || ''; if (typeof valA === 'string') valA = valA.toLowerCase(); if (typeof valB === 'string') valB = valB.toLowerCase(); return sortOrder === 'asc' ? (valA > valB ? 1 : valA < valB ? -1 : 0) : (valA < valB ? 1 : valA > valB ? -1 : 0); });
    return result;
  }, [suppliers, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field) => { if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortBy(field); setSortOrder('asc'); } };

  const totalProductsWithSupplier = products.filter(p => p.supplier_id).length;
  const effectiveViewMode = isMobile ? 'grid' : viewMode;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white rounded-2xl w-1/3 shadow-sm"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-white rounded-2xl shadow-sm"></div>
          <div className="h-16 bg-white rounded-2xl shadow-sm"></div>
          <div className="h-16 bg-white rounded-2xl shadow-sm"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-white rounded-2xl shadow-sm"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">🏢 Proveedores</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona tus proveedores y su información de contacto</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm shadow-blue-200 transition">
            <PlusIcon className="h-4 w-4" /> Nuevo Proveedor
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2"><BuildingOffice2Icon className="h-5 w-5 text-blue-500" /><span className="text-sm text-slate-500">Total proveedores</span></div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2"><CubeIcon className="h-5 w-5 text-indigo-500" /><span className="text-sm text-slate-500">Prod. asignados</span></div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalProductsWithSupplier}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2"><UserIcon className="h-5 w-5 text-emerald-500" /><span className="text-sm text-slate-500">Con contacto</span></div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{suppliers.filter(s => s.contact || s.email || s.phone).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 relative min-w-[200px]"><MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-slate-400" /><input type="text" placeholder="Buscar proveedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" /></div>
          {!isMobile && (
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode==='grid'?'bg-blue-100 text-blue-600':'text-slate-400 hover:bg-slate-100'}`}><Squares2X2Icon className="h-5 w-5" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode==='list'?'bg-blue-100 text-blue-600':'text-slate-400 hover:bg-slate-100'}`}><ListBulletIcon className="h-5 w-5" /></button>
            </div>
          )}
        </div>
      </div>

      {effectiveViewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-white rounded-2xl shadow-sm p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><BuildingOffice2Icon className="h-5 w-5 text-blue-600" /></div>
                  <div><h3 className="font-semibold text-slate-900">{supplier.name}</h3><p className="text-xs text-slate-500">{getSupplierStats(supplier.id)} productos</p></div>
                </div>
                {isAdmin && <div className="flex gap-1"><button onClick={() => openEdit(supplier)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><PencilIcon className="h-4 w-4" /></button><button onClick={() => handleDelete(supplier.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="h-4 w-4" /></button></div>}
              </div>
              <div className="space-y-2 text-sm">
                {supplier.contact && <div className="flex items-center gap-2 text-slate-600"><UserIcon className="h-4 w-4 text-slate-400 flex-shrink-0" /><span className="truncate">{supplier.contact}</span></div>}
                {supplier.phone && <div className="flex items-center gap-2 text-slate-600"><PhoneIcon className="h-4 w-4 text-slate-400 flex-shrink-0" /><a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline truncate">{supplier.phone}</a></div>}
                {supplier.email && <div className="flex items-center gap-2 text-slate-600"><EnvelopeIcon className="h-4 w-4 text-slate-400 flex-shrink-0" /><a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline truncate">{supplier.email}</a></div>}
                {supplier.address && <div className="flex items-center gap-2 text-slate-600"><MapPinIcon className="h-4 w-4 text-slate-400 flex-shrink-0" /><span className="truncate">{supplier.address}</span></div>}
              </div>
              {!supplier.contact && !supplier.phone && !supplier.email && !supplier.address && <p className="text-sm text-slate-400 italic mt-2">Sin información de contacto</p>}
            </div>
          ))}
        </div>
      )}

      {!isMobile && effectiveViewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('name')}><div className="flex items-center gap-1">Proveedor {sortBy==='name' && (sortOrder==='asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />)}</div></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Productos</th>
                  {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3"><span className="font-medium text-slate-900">{supplier.name}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{supplier.contact || '-'}</td>
                    <td className="px-4 py-3 text-sm">{supplier.phone ? <a href={`tel:${supplier.phone}`} className="text-blue-600 hover:underline">{supplier.phone}</a> : '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden md:table-cell">{supplier.email ? <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">{supplier.email}</a> : '-'}</td>
                    <td className="px-4 py-3 text-sm text-center"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{getSupplierStats(supplier.id)}</span></td>
                    {isAdmin && <td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => openEdit(supplier)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><PencilIcon className="h-4 w-4" /></button><button onClick={() => handleDelete(supplier.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="h-4 w-4" /></button></div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm"><BuildingOffice2Icon className="h-12 w-12 mx-auto mb-3 text-slate-300" /><p className="text-slate-500 font-medium">No se encontraron proveedores</p></div>
      )}

      {showModal && isAdmin && (
        <div className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center'} bg-black/30 backdrop-blur-sm`} onClick={() => setShowModal(false)}>
          <div className={`bg-white w-full max-w-md flex flex-col shadow-2xl ${isMobile ? 'rounded-t-[32px] animate-slide-up max-h-[85dvh] mb-12' : 'rounded-2xl max-h-[90vh]'}`} onClick={e => e.stopPropagation()}>
            {isMobile && <div className="bottom-sheet-handle" />}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">{editingSupplier ? '✏️ Editar Proveedor' : '🏢 Nuevo Proveedor'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 modal-scroll" style={{ paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '16px' }}>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">🏢 Nombre *</label><input type="text" placeholder="Nombre de la empresa" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" required autoFocus /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">👤 Contacto</label><input type="text" placeholder="Nombre del contacto" value={formData.contact} onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">📞 Teléfono</label><input type="tel" placeholder="+34 123 456 789" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">✉️ Email</label><input type="email" placeholder="correo@proveedor.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">📍 Dirección</label><input type="text" placeholder="Dirección fiscal o almacén" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition">{isSaving ? 'Guardando...' : editingSupplier ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
