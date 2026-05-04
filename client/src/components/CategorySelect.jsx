import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon } from '@heroicons/react/24/outline';

const CategorySelect = ({ value, onChange, restaurant }) => {
  const { getAllCategoriesFlat, addCategory, isAdmin } = useAuth();
  const [flatList, setFlatList] = useState([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parentForNew, setParentForNew] = useState(null); // null = raíz

  useEffect(() => {
    loadCategories();
  }, [restaurant]);

  const loadCategories = async () => {
    const list = await getAllCategoriesFlat();
    setFlatList(list || []);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await addCategory(newCategoryName, parentForNew);
    setNewCategoryName('');
    setShowAddInput(false);
    loadCategories();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">📁 Categoría</label>
      <div className="flex gap-2">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-3 border rounded-xl"
        >
          <option value="">Sin categoría</option>
          {flatList.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
        {isAdmin && (
          <button type="button" onClick={() => { setParentForNew(null); setShowAddInput(true); }} className="p-3 bg-gray-100 rounded-xl">
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      {showAddInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Nueva categoría"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 p-2 border rounded-xl"
          />
          <select
            value={parentForNew || ''}
            onChange={(e) => setParentForNew(e.target.value || null)}
            className="p-2 border rounded-xl text-sm"
          >
            <option value="">Categoría padre (opcional)</option>
            {flatList.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <button type="button" onClick={handleAddCategory} className="px-4 py-2 bg-blue-600 text-white rounded-xl">✓</button>
          <button type="button" onClick={() => setShowAddInput(false)} className="px-4 py-2 border rounded-xl">✕</button>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;
