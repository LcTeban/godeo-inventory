import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, PencilIcon, TrashIcon, FolderIcon, GlobeAltIcon,
  ClipboardDocumentIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';

const TreeNode = ({ category, allCategories, onEdit, onDelete, onAddChild, onCopy }) => {
  const [expanded, setExpanded] = useState(false);
  const children = allCategories.filter(c => c.parent_id === category.id);

  return (
    <div className="ml-3 sm:ml-4">
      <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer flex-wrap" onClick={() => setExpanded(!expanded)}>
        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-1 flex-shrink-0">
          <FolderIcon className={`h-5 w-5 ${children.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
        </button>
        <span className="flex-1 font-medium text-sm sm:text-base text-slate-700 break-words">
          {category.name}
          {!category.restaurant && <GlobeAltIcon className="h-4 w-4 inline ml-1 text-blue-500" title="Global" />}
        </span>
        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onAddChild(category.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Añadir subcategoría">
            <PlusIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onEdit(category)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onCopy(category)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Copiar a otro restaurante">
            <ClipboardDocumentIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(category.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && children.length > 0 && (
        <div className="border-l-2 border-slate-200 ml-2 pl-2 sm:pl-3">
          {children.map(child => (
            <TreeNode key={child.id} category={child} allCategories={allCategories} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} onCopy={onCopy} />
          ))}
        </div>
      )}
    </div>
  );
};

const Categories = () => {
  const { isAdmin, getAllCategoriesFlat, addCategory, updateCategory, deleteCategory, duplicateCategory, currentRestaurant } = useAuth();
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [parentForNew, setParentForNew] = useState(null);
  const [showAddRoot, setShowAddRoot] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [editIsGlobal, setEditIsGlobal] = useState(false);

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyCategory, setCopyCategory] = useState(null);
  const [copyTarget, setCopyTarget] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  useLockBodyScroll(showCopyModal);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    const all = await getAllCategoriesFlat();
    setCategories(all || []);
  };

  const handleAddSub = async (parentId) => {
    if (!newName.trim()) return;
    await addCategory(newName, parentId, isGlobal);
    setNewName('');
    setParentForNew(null);
    setIsGlobal(false);
    loadCategories();
    toast.success('Categoría creada correctamente');
  };

  const handleEdit = async () => {
    if (editId && editName.trim()) {
      const cat = categories.find(c => c.id === editId);
      await updateCategory(editId, editName, cat?.parent_id || null, editIsGlobal);
      setEditId(null);
      setEditName('');
      setEditIsGlobal(false);
      loadCategories();
      toast.success('Categoría actualizada correctamente');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar categoría? Las subcategorías quedarán huérfanas.')) {
      await deleteCategory(id);
      loadCategories();
      toast.success('Categoría eliminada');
    }
  };

  const handleCopy = (category) => {
    setCopyCategory(category);
    setCopyTarget('');
    setShowCopyModal(true);
  };

  const executeCopy = async () => {
    if (!copyTarget || copyTarget === currentRestaurant) {
      toast.error('Selecciona un restaurante de destino diferente al actual.');
      return;
    }
    setIsCopying(true);
    try {
      const result = await duplicateCategory(copyCategory.id, copyTarget);
      toast.success(`✅ Categoría copiada con éxito. Productos copiados: ${result.productsCopied}`);
      setShowCopyModal(false);
      setCopyCategory(null);
      loadCategories();
    } catch (error) {
      toast.error('Error al copiar: ' + error.message);
    } finally {
      setIsCopying(false);
    }
  };

  if (!isAdmin) return <div className="text-center py-8 text-slate-500">Acceso restringido</div>;

  const roots = categories.filter(c => c.parent_id === null);

  // Variantes para modal
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">📁 Gestión de Categorías</h1>
        <button
          onClick={() => { setShowAddRoot(true); setParentForNew(null); setEditId(null); setIsGlobal(false); }}
          className="w-full sm:w-auto bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-orange-600 transition shadow-sm shadow-orange-200"
        >
          <PlusIcon className="h-4 w-4" /> Nueva Carpeta Raíz
        </button>
      </div>

      {(showAddRoot || parentForNew !== null || editId !== null) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">
            {editId ? '✏️ Editar categoría' : parentForNew ? '📂 Nueva subcategoría' : '📁 Nueva carpeta raíz'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder={editId ? 'Nuevo nombre' : 'Nombre de la categoría'}
              value={editId ? editName : newName}
              onChange={(e) => editId ? setEditName(e.target.value) : setNewName(e.target.value)}
              className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editId ? editIsGlobal : isGlobal}
                  onChange={(e) => editId ? setEditIsGlobal(e.target.checked) : setIsGlobal(e.target.checked)}
                  className="rounded border-slate-300 text-orange-500 shadow-sm focus:ring-orange-500"
                />
                🌍 Global
              </label>
              <button
                onClick={editId ? handleEdit : () => handleAddSub(parentForNew)}
                className="px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition shadow-sm shadow-orange-200"
              >
                {editId ? 'Guardar' : 'Crear'}
              </button>
              <button
                onClick={() => { setShowAddRoot(false); setParentForNew(null); setEditId(null); setEditName(''); setNewName(''); setIsGlobal(false); }}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-4">
        {roots.length === 0 && !showAddRoot && parentForNew === null && editId === null && (
          <EmptyState
            icon={FolderIcon}
            title="No hay categorías"
            message="Crea la primera carpeta para organizar tu inventario"
            actionLabel="Nueva carpeta raíz"
            onAction={() => setShowAddRoot(true)}
          />
        )}
        {roots.map(root => (
          <TreeNode
            key={root.id}
            category={root}
            allCategories={categories}
            onEdit={(cat) => { setEditId(cat.id); setEditName(cat.name); setEditIsGlobal(!cat.restaurant); setShowAddRoot(false); setParentForNew(null); }}
            onDelete={handleDelete}
            onAddChild={(parentId) => {
              setParentForNew(parentId);
              setNewName('');
              setIsGlobal(false);
              setShowAddRoot(false);
              setEditId(null);
            }}
            onCopy={handleCopy}
          />
        ))}
      </div>

      <AnimatePresence>
        {showCopyModal && copyCategory && (
          <motion.div
            className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center'} bg-black/30 backdrop-blur-sm`}
            onClick={() => setShowCopyModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`bg-white w-full max-w-md flex flex-col shadow-2xl ${isMobile ? 'rounded-t-[32px] mb-12' : 'rounded-2xl'}`}
              onClick={e => e.stopPropagation()}
              variants={isMobile ? modalVariants : desktopModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {isMobile && <div className="bottom-sheet-handle" />}
              <div className="p-6 space-y-4" style={{ paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '16px' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">📋 Copiar categoría</h2>
                  <button onClick={() => setShowCopyModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-600">
                  Vas a copiar la categoría <strong className="text-slate-900">{copyCategory.name}</strong> y todas sus subcategorías y productos al restaurante seleccionado.
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">🏢 Restaurante destino</label>
                  <select
                    value={copyTarget}
                    onChange={(e) => setCopyTarget(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition"
                  >
                    <option value="">Seleccionar destino</option>
                    {['POZOBLANCO', 'FUERTEVENTURA', 'GRAN_CAPITAN']
                      .filter(r => r !== currentRestaurant)
                      .map(r => (
                        <option key={r} value={r}>
                          {r === 'POZOBLANCO' ? '🍽️ Pozoblanco' : r === 'FUERTEVENTURA' ? '🏖️ Fuerteventura' : '🏛️ Gran Capitán'}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCopyModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeCopy}
                    disabled={isCopying || !copyTarget}
                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50 shadow-sm shadow-orange-200"
                  >
                    {isCopying ? 'Copiando...' : 'Copiar todo'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Categories;
