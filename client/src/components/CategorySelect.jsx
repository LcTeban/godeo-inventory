import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon } from '@heroicons/react/24/outline';

const CategorySelect = ({ value, onChange, restaurant }) => {
  const { getCategories, addCategory, isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedParent, setSelectedParent] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parentForNew, setParentForNew] = useState(null); // null = categoría raíz

  useEffect(() => {
    loadCategories();
  }, [restaurant]);

  const loadCategories = async () => {
    const cats = await getCategories(null); // raíz
    setCategories(cats || []);
  };

  useEffect(() => {
    if (selectedParent) {
      getCategories(selectedParent).then(setSubcategories);
    } else {
      setSubcategories([]);
    }
  }, [selectedParent]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName, parentForNew);
    setNewCategoryName('');
    setShowAddInput(false);
    loadCategories();
    if (parentForNew) {
      // refrescar subcategorías del padre
      getCategories(parentForNew).then(setSubcategories);
    }
  };

  const currentCategoryId = value || '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">📁 Categoría</label>
      <div className="flex gap-2">
        <select
          value={currentCategoryId}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-3 border rounded-xl"
        >
          <option value="">Sin categoría</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {isAdmin && (
          <button type="button" onClick={() => { setParentForNew(null); setShowAddInput(true); }} className="p-3 bg-gray-100 rounded-xl">
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      {selectedParent && subcategories.length > 0 && (
        <select
          value={currentCategoryId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border rounded-xl"
        >
          <option value="">Sin subcategoría</option>
          {subcategories.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
      )}
      {showAddInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Nombre de la categoría"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 p-2 border rounded-xl"
          />
          <button type="button" onClick={handleAddCategory} className="px-4 py-2 bg-blue-600 text-white rounded-xl">✓</button>
          <button type="button" onClick={() => setShowAddInput(false)} className="px-4 py-2 border rounded-xl">✕</button>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;
