import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, PencilIcon, TrashIcon, FolderIcon, GlobeAltIcon,
  ClipboardDocumentIcon, XMarkIcon
} from '@heroicons/react/24/outline';

const TreeNode = ({ category, allCategories, onEdit, onDelete, onAddChild, onCopy }) => {
  const [expanded, setExpanded] = useState(false);
  const children = allCategories.filter(c => c.parent_id === category.id);

  return (
    <div className="ml-3 sm:ml-4">
      <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 rounded-lg cursor-pointer flex-wrap" onClick={() => setExpanded(!expanded)}>
        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-1 flex-shrink-0">
          <FolderIcon className={`h-5 w-5 ${children.length > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
        </button>
        <span className="flex-1 font-medium text-sm sm:text-base break-words">
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
        <div className="border-l-2 border-gray-200 ml-2 pl-2 sm:pl-3">
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

  // Estados para copia
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyCategory, setCopyCategory] = useState(null);
  const [copyTarget, setCopyTarget] = useState('');
  const [isCopying, setIsCopying] = useState(false);

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
  };

  const handleEdit = async () => {
    if (editId && editName.trim()) {
      const cat = categories.find(c => c.id === editId);
      await updateCategory(editId, editName, cat?.parent_id || null, editIsGlobal);
      setEditId(null);
      setEditName('');
      setEditIsGlobal(false);
      loadCategories();
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar categoría? Las subcategorías quedarán huérfanas.')) {
      await deleteCategory(id);
      loadCategories();
    }
  };

  const handleCopy = (category) => {
    setCopyCategory(category);
    setCopyTarget('');
    setShowCopyModal(true);
  };

  const executeCopy = async () => {
    if (!copyTarget || copyTarget === currentRestaurant) {
      alert('Selecciona un restaurante de destino diferente al actual.');
      return;
    }
    setIsCopying(true);
    try {
      const result = await duplicateCategory(copyCategory.id, copyTarget);
      alert(`✅ Categoría copiada con éxito.\nCategorías creadas: ${result.categoriesCreated}\nProductos copiados: ${result.productsCopied}`);
      setShowCopyModal(false);
      setCopyCategory(null);
      loadCategories();
    } catch (error) {
      alert('Error al copiar: ' + error.message);
    } finally {
      setIsCopying(false);
    }
  };

  if (!isAdmin) return <div className="text-center py-8 text-gray-500">Acceso restringido</div>;

  const roots = categories.filter(c => c.parent_id === null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800">📁 Gestión de Categorías</h1>
        <button
          onClick={() => { setShowAddRoot(true); setParentForNew(null); setEditId(null); setIsGlobal(false); }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-4 w-4" /> Nueva Carpeta Raíz
        </button>
      </div>

      {/* Formularios de añadir/editar (sin cambios) */}
      {(showAddRoot || parentForNew !== null || editId !== null) && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {editId ? '✏️ Editar categoría' : parentForNew ? '📂 Nueva subcategoría' : '📁 Nueva carpeta raíz'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder={editId ? 'Nuevo nombre' : 'Nombre de la categoría'}
              value={editId ? editName : newName}
              onChange={(e) => editId ? setEditName(e.target.value) : setNewName(e.target.value)}
              className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editId ? editIsGlobal : isGlobal}
                  onChange={(e) => editId ? setEditIsGlobal(e.target.checked) : setIsGlobal(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                />
                🌍 Global
              </label>
              <button
                onClick={editId ? handleEdit : () => handleAddSub(parentForNew)}
                className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                {editId ? 'Guardar' : 'Crear'}
              </button>
              <button
                onClick={() => { setShowAddRoot(false); setParentForNew(null); setEditId(null); setEditName(''); setNewName(''); setIsGlobal(false); }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        {roots.length === 0 && !showAddRoot && parentForNew === null && editId === null && (
          <div className="text-center py-10">
            <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay categorías creadas</p>
            <p className="text-gray-400 text-xs mt-1">Crea la primera carpeta para organizar tu inventario</p>
          </div>
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

      {/* Modal de copia de categoría */}
      {showCopyModal && copyCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowCopyModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">📋 Copiar categoría</h2>
              <button onClick={() => setShowCopyModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Vas a copiar la categoría <strong>{copyCategory.name}</strong> y todas sus subcategorías y productos al restaurante seleccionado.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">🏢 Restaurante destino</label>
                <select
                  value={copyTarget}
                  onChange={(e) => setCopyTarget(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeCopy}
                  disabled={isCopying || !copyTarget}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                >
                  {isCopying ? 'Copiando...' : 'Copiar todo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
