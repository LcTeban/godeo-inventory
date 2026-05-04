import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon, FolderIcon } from '@heroicons/react/24/outline';

const TreeNode = ({ category, allCategories, onEdit, onDelete, onAddChild }) => {
  const [expanded, setExpanded] = useState(false);
  const children = allCategories.filter(c => c.parent_id === category.id);

  return (
    <div className="ml-4">
      <div className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded-lg">
        <button onClick={() => setExpanded(!expanded)} className="p-1">
          <FolderIcon className={`h-5 w-5 ${children.length > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
        </button>
        <span className="flex-1 font-medium">{category.name}</span>
        <div className="flex gap-1">
          <button onClick={() => onAddChild(category.id)} className="p-1 text-blue-600"><PlusIcon className="h-4 w-4" /></button>
          <button onClick={() => onEdit(category)} className="p-1 text-blue-600"><PencilIcon className="h-4 w-4" /></button>
          <button onClick={() => onDelete(category.id)} className="p-1 text-red-600"><TrashIcon className="h-4 w-4" /></button>
        </div>
      </div>
      {expanded && children.length > 0 && (
        <div className="border-l-2 border-gray-200 ml-2 pl-2">
          {children.map(child => (
            <TreeNode key={child.id} category={child} allCategories={allCategories} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
          ))}
        </div>
      )}
    </div>
  );
};

const Categories = () => {
  const { isAdmin, getAllCategoriesFlat, getCategories, addCategory, updateCategory, deleteCategory } = useAuth();
  const [categories, setCategories] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [parentForNew, setParentForNew] = useState(null);
  const [showAddRoot, setShowAddRoot] = useState(false);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    const roots = await getCategories(null);
    const all = await getAllCategoriesFlat();
    setCategories(all);
  };

  const handleAddSub = async (parentId) => {
    if (!newName.trim()) return;
    await addCategory(newName, parentId);
    setNewName('');
    loadCategories();
  };

  const handleEdit = async () => {
    if (editId && editName.trim()) {
      const { parent_id } = categories.find(c => c.id === editId) || {};
      await updateCategory(editId, editName, parent_id);
      setEditId(null);
      loadCategories();
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar categoría? Las subcategorías quedarán huérfanas.')) {
      await deleteCategory(id);
      loadCategories();
    }
  };

  if (!isAdmin) return <div className="text-center py-8">Acceso restringido</div>;

  const roots = categories.filter(c => c.parent_id === null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">📁 Gestión de Categorías</h1>
        <button onClick={() => setShowAddRoot(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1">
          <PlusIcon className="h-4 w-4" /> Nueva Carpeta Raíz
        </button>
      </div>

      {showAddRoot && (
        <div className="flex gap-2 bg-gray-50 p-4 rounded-xl">
          <input
            type="text"
            placeholder="Nombre de la categoría raíz"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 p-2 border rounded-xl"
          />
          <button onClick={() => { handleAddSub(null); setShowAddRoot(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Crear</button>
          <button onClick={() => setShowAddRoot(false)} className="px-4 py-2 border rounded-xl">Cancelar</button>
        </div>
      )}

      {editId && (
        <div className="flex gap-2 bg-gray-50 p-4 rounded-xl">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 p-2 border rounded-xl"
          />
          <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Guardar</button>
          <button onClick={() => setEditId(null)} className="px-4 py-2 border rounded-xl">Cancelar</button>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm">
        {roots.length === 0 && !showAddRoot && (
          <p className="text-gray-500 text-center py-4">No hay categorías. Crea la primera carpeta.</p>
        )}
        {roots.map(root => (
          <TreeNode
            key={root.id}
            category={root}
            allCategories={categories}
            onEdit={(cat) => { setEditId(cat.id); setEditName(cat.name); }}
            onDelete={handleDelete}
            onAddChild={(parentId) => {
              setParentForNew(parentId);
              setNewName('');
              setShowAddRoot(false);
            }}
          />
        ))}
      </div>

      {parentForNew && (
        <div className="flex gap-2 bg-gray-50 p-4 rounded-xl">
          <input
            type="text"
            placeholder="Nombre de la subcategoría"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 p-2 border rounded-xl"
          />
          <button onClick={() => { handleAddSub(parentForNew); setParentForNew(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Crear</button>
          <button onClick={() => setParentForNew(null)} className="px-4 py-2 border rounded-xl">Cancelar</button>
        </div>
      )}
    </div>
  );
};

export default Categories;
