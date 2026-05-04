import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const CategorySelect = ({ value, onChange, restaurant }) => {
  const { getAllCategoriesFlat } = useAuth();
  const [flatList, setFlatList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [restaurant]);

  const loadCategories = async () => {
    const list = await getAllCategoriesFlat();
    setFlatList(list || []);
  };

  const selectedCategory = flatList.find(c => c.id.toString() === value?.toString());

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">📁 Categoría</label>
      
      {/* Botón que abre el desplegable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <span className={selectedCategory ? 'text-gray-900' : 'text-gray-400'}>
          {selectedCategory ? selectedCategory.name : 'General (todas las categorías)'}
        </span>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Lista desplegable */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {/* Opción General */}
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${
              !value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
            }`}
          >
            <span>📂 General</span>
          </button>
          
          {/* Categorías con indentación visual */}
          {flatList.map(cat => {
            const indent = cat.depth || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id.toString());
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center ${
                  value?.toString() === cat.id.toString() ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                }`}
                style={{ paddingLeft: `${16 + indent * 16}px` }}
              >
                <span className="mr-2 text-gray-400">
                  {indent === 0 ? '📁' : '📂'}
                </span>
                {cat.name}
              </button>
            );
          })}
        </div>
      )}
      
      {/* Cerrar al hacer clic fuera */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CategorySelect;
