import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CategorySelect = ({ value, onChange, restaurant }) => {
  const { getAllCategoriesFlat } = useAuth();
  const [flatList, setFlatList] = useState([]);

  useEffect(() => {
    loadCategories();
  }, [restaurant]);

  const loadCategories = async () => {
    const list = await getAllCategoriesFlat();
    setFlatList(list || []);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">📁 Categoría</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border rounded-xl"
      >
        <option value="">General</option>
        {flatList.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategorySelect;
