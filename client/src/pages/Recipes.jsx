import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, TrashIcon, PencilIcon, CameraIcon,
  XMarkIcon, BookOpenIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

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

  useLockBodyScroll(showModal || showDetail);

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
      if (field === 'product_id' && value) {
        const product = products.find(p => p.id.toString() === value);
        if (product) {
          updated[index].unit = product.unit || 'g';
        }
      }
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

    try {
      if (editingRecipe) {
        const validIngredients = ingredients.filter(ing => ing.product_id && parseFloat(ing.quantity) > 0);
        await updateRecipe(editingRecipe.id, name, image, validIngredients);
      } else {
        await addRecipe(name, image, []);
      }
      setShowModal(false);
      resetForm();
      loadData();
      if (!editingRecipe) {
        alert('Receta creada. Ahora edítala para añadir los ingredientes.');
      }
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

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;
    const search = searchTerm.toLowerCase();
    return recipes.filter(r => r.name?.toLowerCase().includes(search));
  }, [recipes, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">📖 Recetas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona las recetas y sus ingredientes</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva Receta
          </button>
        )}
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar receta por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all shadow-sm"
        />
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-20 h-20 mx-auto mb-5 bg-blue-50 rounded-full flex items-center justify-center">
            <BookOpenIcon className="h-10 w-10 text-blue-400" />
          </div>
          <p className="text-gray-500 font-medium text-lg">
            {recipes.length === 0 ? 'No hay recetas creadas' : 'No se encontraron recetas'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {recipes.length === 0 ? 'Crea la primera receta para empezar' : 'Prueba con otro término de búsqueda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md group"
            >
              <div className="relative cursor-pointer overflow-hidden" onClick={() => openDetail(recipe)}>
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                    <BookOpenIcon className="h-14 w-14 text-blue-300" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold text-lg leading-tight">{recipe.name}</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {recipe.recipe_ingredients?.length || 0} ingredientes
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(recipe); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar receta"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar receta"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {recipe.recipe_ingredients.slice(0, 3).map((ing, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate mr-2">{ing.products?.name || 'Producto'}</span>
                        <span className="font-medium text-gray-900 whitespace-nowrap tabular-nums">
                          {ing.quantity} <span className="text-gray-500 font-normal">{ing.unit}</span>
                        </span>
                      </li>
                    ))}
                    {recipe.recipe_ingredients.length > 3 && (
                      <li className="text-xs text-blue-600 font-medium cursor-pointer hover:underline pt-1" onClick={() => openDetail(recipe)}>
                        + {recipe.recipe_ingredients.length - 3} ingredientes más
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic mt-3">Sin ingredientes aún</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetail && selectedRecipe && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col" onClick={() => setShowDetail(false)}>
          <div className="p-5 flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">{selectedRecipe.name}</h2>
            <button
              onClick={() => setShowDetail(false)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            {selectedRecipe.image ? (
              <img
                src={selectedRecipe.image}
                alt={selectedRecipe.name}
                className="w-full h-64 object-cover rounded-2xl mb-6 shadow-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                <BookOpenIcon className="h-16 w-16 text-gray-600" />
              </div>
            )}
            <h3 className="text-white font-semibold mb-4 text-lg">🥄 Ingredientes</h3>
            {selectedRecipe.recipe_ingredients && selectedRecipe.recipe_ingredients.length > 0 ? (
              <ul className="space-y-2.5">
                {selectedRecipe.recipe_ingredients.map((ing, i) => (
                  <li key={i} className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 flex justify-between items-center">
                    <span className="text-gray-200 font-medium">{ing.products?.name || `Producto #${ing.product_id}`}</span>
                    <span className="text-white font-semibold tabular-nums">
                      {ing.quantity} <span className="text-gray-400 font-normal">{ing.unit}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center py-8">No hay ingredientes registrados</p>
            )}
          </div>
        </div>
      )}

      {showModal && isAdmin && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col"
            style={{ maxHeight: 'calc(100dvh - 100px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingRecipe ? '✏️ Editar Receta' : '📖 Nueva Receta'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la receta *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Tarta de queso"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">📸 Imagen de la receta</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={openCamera}
                      className="flex-1 py-3 px-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-200"
                    >
                      <CameraIcon className="h-4 w-4" /> Cámara
                    </button>
                    <button
                      type="button"
                      onClick={openGallery}
                      className="flex-1 py-3 px-4 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-200"
                    >
                      🖼️ Galería
                    </button>
                  </div>
                  {image && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={image}
                        alt="Vista previa"
                        className="w-28 h-28 object-cover rounded-xl border-2 border-gray-100 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {editingRecipe && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">🥄 Ingredientes</label>
                    <div className="space-y-3">
                      {ingredients.map((ing, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Ingrediente {idx + 1}
                            </span>
                            {ingredients.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(idx)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <select
                              value={ing.product_id}
                              onChange={(e) => handleIngredientChange(idx, 'product_id', e.target.value)}
                              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                              required
                            >
                              <option value="">Seleccionar producto</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.stock} {p.unit})
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Cant."
                                value={ing.quantity}
                                onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                                className="w-28 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                                required
                              />
                              <select
                                value={ing.unit}
                                onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                                className="w-24 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                              >
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="L">L</option>
                                <option value="unidad">ud</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddIngredient}
                        className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
                      >
                        + Agregar ingrediente
                      </button>
                    </div>
                  </div>
                )}

                {!editingRecipe && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      💡 La receta se creará sin ingredientes. Después podrás editarla para añadir los productos del inventario.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                >
                  {editingRecipe ? 'Actualizar Receta' : 'Crear Receta'}
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
