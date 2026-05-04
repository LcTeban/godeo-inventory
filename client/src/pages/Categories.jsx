import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon, FolderIcon } from '@heroicons/react/24/outline';

const TreeNode = ({ category, allCategories, onEdit, onDelete, onAddChild }) => {
  const [expanded, setExpanded] = useState(false);
  const children = allCategories.filter(c => c.parent_id === category.id);

  return (
    <div className="ml-3 sm:ml-4">
      <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 rounded-lg flex-wrap">
        <button onClick={() => setExpanded(!expanded)} className="p-1 flex-shrink-0">
          <FolderIcon className={`h-5 w-5 ${children.length > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
        </button>
        <span className="flex-1 font-medium text-sm sm:text-base break-words">{category.name}</span>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onAddChild(category.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Añadir subcategoría">
            <PlusIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onEdit(category)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(category.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && children.length > 0 && (
        <div className="border-l-2 border-gray-200 ml-2 pl-2 sm:pl-3">
          {children.map(child => (
            <TreeNode key={child.id} category={child} allCategories={allCategories} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
          ))}
        </div>
      )}
    </div>
  );
};

const Categories = () => {
  const { isAdmin, getAllCategoriesFlat, addCategory, updateCategory, deleteCategory } = useAuth();
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [parentForNew, setParentForNew] = useState(null);
  const [showAddRoot, setShowAddRoot] = useState(false);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    const all = await getAllCategoriesFlat();
    setCategories(all || []);
  };

  const handleAddSub = async (parentId) => {
    if (!newName.trim()) return;
    await addCategory(newName, parentId);
    setNewName('');
    setParentForNew(null);
    loadCategories();
  };

  const handleEdit = async () => {
    if (editId && editName.trim()) {
      const { parent_id } = categories.find(c => c.id === editId) || {};
      await updateCategory(editId, editName, parent_id);
      setEditId(null);
      setEditName('');
      loadCategories();
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar categoría? Las subcategorías quedarán huérfanas.')) {
      await deleteCategory(id);
      loadCategories();
    }
  };

  if (!isAdmin) return <div className="text-center py-8 text-gray-500">Acceso restringido</div>;

  const roots = categories.filter(c => c.parent_id === null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800">📁 Gestión de Categorías</h1>
        <button
          onClick={() => { setShowAddRoot(true); setParentForNew(null); setEditId(null); }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-4 w-4" /> Nueva Carpeta Raíz
        </button>
      </div>

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
            <div className="flex gap-2">
              <button
                onClick={editId ? handleEdit : () => handleAddSub(parentForNew)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                {editId ? 'Guardar' : 'Crear'}
              </button>
              <button
                onClick={() => { setShowAddRoot(false); setParentForNew(null); setEditId(null); setEditName(''); setNewName(''); }}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition"
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
            onEdit={(cat) => { setEditId(cat.id); setEditName(cat.name); setShowAddRoot(false); setParentForNew(null); }}
            onDelete={handleDelete}
            onAddChild={(parentId) => {
              setParentForNew(parentId);
              setNewName('');
              setShowAddRoot(false);
              setEditId(null);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Categories;
