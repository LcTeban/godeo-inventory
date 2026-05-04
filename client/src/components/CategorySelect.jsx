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
    <div className="w-full sm:w-auto sm:min-w-[180px]">
      <label className="block text-sm font-medium text-gray-700 mb-1">📁 Categoría</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">📂 General</option>
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
