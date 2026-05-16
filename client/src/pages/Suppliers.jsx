import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon,
  BuildingOffice2Icon, PhoneIcon, EnvelopeIcon, MapPinIcon,
  UserIcon, CubeIcon, Squares2X2Icon, ListBulletIcon,
  XMarkIcon, FunnelIcon, ArrowUpIcon, ArrowDownIcon
} from '@heroicons/react/24/outline';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const Suppliers = () => {
  const { isAdmin, getSuppliers, addSupplier, updateSupplier, deleteSupplier, getProducts } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '', contact: '', phone: '', email: '', address: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '', message: '', confirmText: 'Eliminar', confirmColor: 'red',
    onConfirm: () => {},
  });

  useLockBodyScroll(showModal || confirmOpen);

  useEffect(() => {
    loadData();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppData, prodData] = await Promise.all([
        getSuppliers(),
        getProducts()
      ]);
      setSuppliers(Array.isArray(suppData) ? suppData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  const getSupplierStats = (supplierId) => {
    const supplierProducts = products.filter(p => p.supplier_id === supplierId);
    return supplierProducts.length;
  };

  const openAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contact: '', phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
        toast.success('Proveedor actualizado correctamente');
      } else {
        await addSupplier(formData);
        toast.success('Proveedor creado correctamente');
      }
      setShowModal(false);
      setFormData({ name: '', contact: '', phone: '', email: '', address: '' });
      setEditingSupplier(null);
      loadData();
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (id) => {
    setConfirmConfig({
      title: 'Eliminar proveedor',
      message: '¿Estás seguro de que deseas eliminar este proveedor? Se eliminará también la asociación con los productos.',
      confirmText: 'Eliminar',
      confirmColor: 'red',
      onConfirm: async () => {
        setConfirmOpen(false);
        try {
          await deleteSupplier(id);
          loadData();
          toast.success('Proveedor eliminado');
        } catch (error) {
          toast.error('Error al eliminar');
        }
      },
    });
    setConfirmOpen(true);
  };

  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name?.toLowerCase().includes(search) ||
        s.contact?.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search) ||
        s.phone?.includes(search)
      );
    }
    
    result.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (sortOrder === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
    
    return result;
  }, [suppliers, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const totalProductsWithSupplier = products.filter(p => p.supplier_id).length;

  const effectiveViewMode = isMobile ? 'grid' : viewMode;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  const modalVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
  };

  const desktopModalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 25 },
    },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white dark:bg-gray-900 rounded-2xl w-1/3 shadow-sm dark:shadow-md dark:shadow-black/30"></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
          <div className="h-16 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
          <div className="h-16 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-40 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">🏢 Proveedores</h1>
          <p className="text-sm text-slate-500 dark:text-gray-300 mt-1">Gestiona tus proveedores y su información de contacto</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-orange-600 transition shadow-sm shadow-orange-200"
          >
            <PlusIcon className="h-4 w-4" /> Nuevo Proveedor
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 flex flex-col items-start">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl mb-3"><BuildingOffice2Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{suppliers.length}</p>
          <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 tracking-wide">Total proveedores</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 flex flex-col items-start">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl mb-3"><CubeIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /></div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalProductsWithSupplier}</p>
          <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 tracking-wide">Productos asignados</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-md dark:shadow-black/30 flex flex-col items-start">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl mb-3"><UserIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{suppliers.filter(s => s.contact || s.email || s.phone).length}</p>
          <p className="text-xs text-slate-500 dark:text-gray-300 mt-1 tracking-wide">Con contacto</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 relative min-w-[200px]">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-slate-400 dark:text-gray-300" />
            <input type="text" placeholder="Buscar proveedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition" />
          </div>
          {!isMobile && (
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}><Squares2X2Icon className="h-5 w-5" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800'}`}><ListBulletIcon className="h-5 w-5" /></button>
            </div>
          )}
        </div>
      </div>

      {effectiveViewMode === 'grid' && (
        filteredSuppliers.length > 0 ? (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={containerVariants} initial="hidden" animate="visible">
            {filteredSuppliers.map(supplier => (
              <motion.div key={supplier.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30 p-5 group dark:border-white/5 border border-transparent" variants={itemVariants} layout>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"><BuildingOffice2Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{supplier.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-gray-300">{getSupplierStats(supplier.id)} productos</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(supplier)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><PencilIcon className="h-4 w-4" /></button>
                      <button onClick={() => requestDelete(supplier.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><TrashIcon className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {supplier.contact && <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300"><UserIcon className="h-4 w-4 text-slate-400 dark:text-gray-300 flex-shrink-0" /><span className="truncate">{supplier.contact}</span></div>}
                  {supplier.phone && <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300"><PhoneIcon className="h-4 w-4 text-slate-400 dark:text-gray-300 flex-shrink-0" /><a href={`tel:${supplier.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline truncate">{supplier.phone}</a></div>}
                  {supplier.email && <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300"><EnvelopeIcon className="h-4 w-4 text-slate-400 dark:text-gray-300 flex-shrink-0" /><a href={`mailto:${supplier.email}`} className="text-blue-600 dark:text-blue-400 hover:underline truncate">{supplier.email}</a></div>}
                  {supplier.address && <div className="flex items-center gap-2 text-slate-600 dark:text-gray-300"><MapPinIcon className="h-4 w-4 text-slate-400 dark:text-gray-300 flex-shrink-0" /><span className="truncate">{supplier.address}</span></div>}
                </div>
                {!supplier.contact && !supplier.phone && !supplier.email && !supplier.address && <p className="text-sm text-slate-400 dark:text-gray-300 italic mt-2">Sin información de contacto</p>}
              </motion.div>
            ))}
          </motion.div>
        ) : searchTerm ? (
          <EmptyState
            icon={BuildingOffice2Icon}
            title="Sin resultados"
            message="Prueba con otro término de búsqueda"
            actionLabel="Ver todos los proveedores"
            onAction={() => setSearchTerm('')}
          />
        ) : (
          <EmptyState
            icon={BuildingOffice2Icon}
            title="Sin proveedores"
            message="Agrega el primer proveedor para empezar"
            actionLabel="Nuevo proveedor"
            onAction={openAdd}
          />
        )
      )}

      {!isMobile && effectiveViewMode === 'list' && (
        filteredSuppliers.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-md dark:shadow-black/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('name')}><div className="flex items-center gap-1">Proveedor {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />)}</div></th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Contacto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Productos</th>
                    {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredSuppliers.map(supplier => (
                    <tr key={supplier.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3"><span className="font-bold text-slate-900 dark:text-white">{supplier.name}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-gray-300">{supplier.contact || '-'}</td>
                      <td className="px-4 py-3 text-sm">{supplier.phone ? <a href={`tel:${supplier.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{supplier.phone}</a> : '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-gray-300 hidden md:table-cell">{supplier.email ? <a href={`mailto:${supplier.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{supplier.email}</a> : '-'}</td>
                      <td className="px-4 py-3 text-sm text-center"><span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">{getSupplierStats(supplier.id)}</span></td>
                      {isAdmin && <td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => openEdit(supplier)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><PencilIcon className="h-4 w-4" /></button><button onClick={() => requestDelete(supplier.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><TrashIcon className="h-4 w-4" /></button></div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : searchTerm ? (
          <EmptyState
            icon={BuildingOffice2Icon}
            title="Sin resultados"
            message="Prueba con otro término de búsqueda"
            actionLabel="Ver todos los proveedores"
            onAction={() => setSearchTerm('')}
          />
        ) : (
          <EmptyState
            icon={BuildingOffice2Icon}
            title="Sin proveedores"
            message="Agrega el primer proveedor para empezar"
            actionLabel="Nuevo proveedor"
            onAction={openAdd}
          />
        )
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        confirmColor={confirmConfig.confirmColor}
      />

      {/* Modal Agregar/Editar */}
      <AnimatePresence>
        {showModal && isAdmin && (
          <motion.div
            className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center'} bg-black/30 backdrop-blur-sm`}
            onClick={() => setShowModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`bg-white dark:bg-gray-900 w-full max-w-md flex flex-col shadow-2xl dark:shadow-black/50 ${
                isMobile ? 'rounded-[32px] mb-16' : 'rounded-2xl'
              }`}
              style={isMobile ? { maxHeight: '80dvh' } : { maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
              variants={isMobile ? modalVariants : desktopModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {isMobile && <div className="bottom-sheet-handle" />}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingSupplier ? '✏️ Editar Proveedor' : '🏢 Nuevo Proveedor'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 dark:text-gray-300 hover:text-slate-600 dark:hover:text-white rounded-lg"><XMarkIcon className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 modal-scroll" style={{ paddingBottom: isMobile ? 'calc(90px + env(safe-area-inset-bottom))' : '16px' }}>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">🏢 Nombre *</label><input type="text" placeholder="Nombre de la empresa" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition" required autoFocus /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">👤 Contacto</label><input type="text" placeholder="Nombre del contacto" value={formData.contact} onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">📞 Teléfono</label><input type="tel" placeholder="+34 123 456 789" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition" /></div>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">✉️ Email</label><input type="email" placeholder="correo@proveedor.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">📍 Dirección</label><input type="text" placeholder="Dirección fiscal o almacén" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition" /></div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-50 transition">{isSaving ? 'Guardando...' : editingSupplier ? 'Actualizar' : 'Guardar'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Suppliers;
