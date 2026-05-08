import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, TrashIcon, PencilIcon, CameraIcon,
  XMarkIcon, BookOpenIcon, MagnifyingGlassIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [ingredients, setIngredients] = useState([{ product_id: '', quantity: '', unit: 'g' }]);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin, getRecipes, addRecipe, updateRecipe, deleteRecipe, getProducts } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recData, prodData] = await Promise.all([
        getRecipes(),
        getProducts()
      ]);
      setRecipes(Array.isArray(recData) ? recData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setImage('');
    setIngredients([{ product_id: '', quantity: '', unit: 'g' }]);
    setEditingRecipe(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (recipe) => {
    setEditingRecipe(recipe);
    setName(recipe.name);
    setImage(recipe.image || '');
    if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
      setIngredients(recipe.recipe_ingredients.map(ing => ({
        product_id: ing.product_id?.toString() || '',
        quantity: ing.quantity?.toString() || '',
        unit: ing.unit || 'g'
      })));
    } else {
      setIngredients([{ product_id: '', quantity: '', unit: 'g' }]);
    }
    setShowModal(true);
  };

  const handleAddIngredient = () => {
    setIngredients(prev => [...prev, { product_id: '', quantity: '', unit: 'g' }]);
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Si cambia el product_id a vacío, limpiar también el productName
      if (field === 'product_id' && !value) {
        updated[index].productName = '';
      }
      return updated;
    });
  };

  // Seleccionar producto de sugerencia
  const handleSelectSuggestion = (index, product) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        product_id: product.id.toString(),
        productName: product.name,
        unit: product.unit || 'g'
      };
      return updated;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const openCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = handleImageChange;
    input.click();
  };

  const openGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = handleImageChange;
    input.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Falta el nombre de la receta');

    // Solo ingredientes con product_id y cantidad > 0
    const validIngredients = ingredients.filter(ing => ing.product_id && parseFloat(ing.quantity) > 0);
    if (validIngredients.length === 0) return alert('Agrega al menos un ingrediente seleccionado de la lista con cantidad mayor a 0');

    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, name, image, validIngredients);
      } else {
        await addRecipe(name, image, validIngredients);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar receta?')) {
      try {
        await deleteRecipe(id);
        loadData();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const openDetail = (recipe) => {
    setSelectedRecipe(recipe);
    setShowDetail(true);
  };

  // Búsqueda
  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;
    const search = searchTerm.toLowerCase();
    return recipes.filter(r => r.name?.toLowerCase().includes(search));
  }, [recipes, searchTerm]);

  // Obtener sugerencias de productos
  const getProductSuggestions = (input) => {
    if (!input || input.length < 1) return [];
    const search = input.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(search) || p.barcode?.includes(search))
      .slice(0, 4);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📖 Recetas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona las recetas y sus ingredientes</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition shadow-sm">
            <PlusIcon className="h-4 w-4" /> Nueva Receta
          </button>
        )}
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar receta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BookOpenIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">{recipes.length === 0 ? 'No hay recetas creadas' : 'No se encontraron recetas'}</p>
          <p className="text-gray-400 text-sm mt-1">{recipes.length === 0 ? 'Crea la primera receta para empezar' : 'Prueba con otro término de búsqueda'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition">
              <div className="relative cursor-pointer" onClick={() => openDetail(recipe)}>
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.name} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                    <BookOpenIcon className="h-12 w-12 text-blue-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                  <h3 className="text-white font-semibold text-lg">{recipe.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {recipe.recipe_ingredients?.length || 0} ingredientes
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openEdit(recipe)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(recipe.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <ul className="space-y-1">
                  {recipe.recipe_ingredients?.slice(0, 3).map((ing, i) => (
                    <li key={i} className="text-sm text-gray-600 flex justify-between">
                      <span className="truncate mr-2">{ing.products?.name || 'Producto'}</span>
                      <span className="font-medium text-gray-800 whitespace-nowrap">{ing.quantity} {ing.unit}</span>
                    </li>
                  ))}
                  {recipe.recipe_ingredients?.length > 3 && (
                    <li className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => openDetail(recipe)}>
                      + {recipe.recipe_ingredients.length - 3} más
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && selectedRecipe && (
        <div className="fixed inset-0 bg-black/75 z-50 flex flex-col" onClick={() => setShowDetail(false)}>
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">{selectedRecipe.name}</h2>
            <button onClick={() => setShowDetail(false)} className="p-2 text-white hover:bg-white/10 rounded-full">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            {selectedRecipe.image ? (
              <img src={selectedRecipe.image} alt={selectedRecipe.name} className="w-full h-56 object-cover rounded-xl mb-6" />
            ) : (
              <div className="w-full h-56 bg-gray-700 rounded-xl flex items-center justify-center mb-6">
                <BookOpenIcon className="h-16 w-16 text-gray-500" />
              </div>
            )}
            <h3 className="text-white font-semibold mb-3 text-lg">🥄 Ingredientes</h3>
            <ul className="space-y-2">
              {selectedRecipe.recipe_ingredients?.map((ing, i) => (
                <li key={i} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-gray-200">{ing.products?.name || `Producto #${ing.product_id}`}</span>
                  <span className="text-white font-semibold">{ing.quantity} {ing.unit}</span>
                </li>
              ))}
            </ul>
            {(!selectedRecipe.recipe_ingredients || selectedRecipe.recipe_ingredients.length === 0) && (
              <p className="text-gray-400 text-center py-4">No hay ingredientes registrados</p>
            )}
          </div>
        </div>
      )}

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">{editingRecipe ? '✏️ Editar Receta' : '📖 Nueva Receta'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la receta *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Tarta de queso" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">📸 Imagen de la receta</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={openCamera} className="flex-1 py-2.5 px-4 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2 border border-blue-200">
                      <CameraIcon className="h-4 w-4" /> Cámara
                    </button>
                    <button type="button" onClick={openGallery} className="flex-1 py-2.5 px-4 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2 border border-gray-200">
                      🖼️ Galería
                    </button>
                  </div>
                  {image && (
                    <div className="mt-3 relative inline-block">
                      <img src={image} alt="Vista previa" className="w-24 h-24 object-cover rounded-lg border" />
                      <button type="button" onClick={() => setImage('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow">✕</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🥄 Ingredientes</label>
                  <div className="space-y-3">
                    {ingredients.map((ing, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingrediente {idx + 1}</span>
                          {ingredients.length > 1 && (
                            <button type="button" onClick={() => handleRemoveIngredient(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="relative mb-2">
                          <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={ing.productName || ''}
                            onChange={(e) => {
                              handleIngredientChange(idx, 'productName', e.target.value);
                              // Si borra el texto, quitar product_id
                              if (!e.target.value) handleIngredientChange(idx, 'product_id', '');
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            autoComplete="off"
                          />
                          {ing.productName && getProductSuggestions(ing.productName).length > 0 && !ing.product_id && (
                            <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                              {getProductSuggestions(ing.productName).map(product => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleSelectSuggestion(idx, product)}
                                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition flex items-center justify-between"
                                >
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">{product.name}</span>
                                    <span className="text-xs text-gray-400 ml-2">{product.category}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">{product.stock} {product.unit}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {ing.product_id && (
                          <p className="text-xs text-green-600 mb-2">✓ {ing.productName || 'Producto seleccionado'}</p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Cant."
                            value={ing.quantity}
                            onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            required
                          />
                          <select
                            value={ing.unit}
                            onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                            className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="unidad">ud</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddIngredient} className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition">
                      + Agregar ingrediente
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm">
                  {editingRecipe ? 'Actualizar' : 'Crear Receta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
