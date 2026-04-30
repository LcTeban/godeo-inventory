import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, TrashIcon, PencilIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);      // Modal de edición (solo admin)
  const [showDetail, setShowDetail] = useState(false);    // Modal de detalle (todos)
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [ingredients, setIngredients] = useState([{ product_id: '', quantity: '', unit: 'g' }]);
  const { isAdmin, getRecipes, addRecipe, updateRecipe, deleteRecipe, getProducts } = useAuth();

  useEffect(() => {
    fetchRecipes();
    fetchProducts();
  }, []);

  const fetchRecipes = async () => {
    try {
      const data = await getRecipes();
      setRecipes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setImage('');
    setIngredients([{ product_id: '', quantity: '', unit: 'g' }]);
    setEditingRecipe(null);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { product_id: '', quantity: '', unit: 'g' }]);
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngs = [...ingredients];
    newIngs[index][field] = value;
    setIngredients(newIngs);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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
    const validIngredients = ingredients.filter(ing => ing.product_id && ing.quantity > 0);
    if (validIngredients.length === 0) return alert('Agrega al menos un ingrediente con producto y cantidad');

    try {
      if (editingRecipe) {
        await updateRecipe(editingRecipe.id, name, image, validIngredients);
      } else {
        await addRecipe(name, image, validIngredients);
      }
      setShowModal(false);
      resetForm();
      fetchRecipes();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar receta?')) {
      try {
        await deleteRecipe(id);
        fetchRecipes();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const openEdit = (recipe) => {
    if (!isAdmin) return;
    setEditingRecipe(recipe);
    setName(recipe.name);
    setImage(recipe.image || '');
    const ings = recipe.recipe_ingredients?.map(ing => ({
      product_id: ing.product_id.toString(),
      quantity: ing.quantity.toString(),
      unit: ing.unit
    })) || [{ product_id: '', quantity: '', unit: 'g' }];
    setIngredients(ings);
    setShowModal(true);
  };

  const openAdd = () => {
    if (!isAdmin) return;
    resetForm();
    setShowModal(true);
  };

  const openDetail = (recipe) => {
    setSelectedRecipe(recipe);
    setShowDetail(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">📖 Recetas</h1>
        {isAdmin && (
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1">
            <PlusIcon className="h-4 w-4" /> Nueva Receta
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map(recipe => (
          <div
            key={recipe.id}
            onClick={() => openDetail(recipe)}
            className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{recipe.name}</h3>
              {isAdmin && (
                <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(recipe)} className="p-1 text-blue-600"><PencilIcon className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(recipe.id)} className="p-1 text-red-600"><TrashIcon className="h-4 w-4" /></button>
                </div>
              )}
            </div>
            {recipe.image && (
              <img src={recipe.image} alt={recipe.name} className="w-full h-32 object-cover rounded-lg mt-2" />
            )}
            <p className="text-sm text-gray-500 mt-2">
              {recipe.recipe_ingredients?.length || 0} ingredientes
            </p>
          </div>
        ))}
      </div>

      {recipes.length === 0 && (
        <div className="text-center py-8 text-gray-500">No hay recetas</div>
      )}

      {/* MODAL DE DETALLE (para todos los usuarios) */}
      {showDetail && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center bg-black">
            <h2 className="text-white font-bold text-xl">{selectedRecipe.name}</h2>
            <button onClick={() => setShowDetail(false)} className="p-2 text-white">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedRecipe.image ? (
              <img src={selectedRecipe.image} alt={selectedRecipe.name} className="w-full h-64 object-contain rounded-xl mb-6" />
            ) : (
              <div className="w-full h-64 bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                <CameraIcon className="h-12 w-12 text-gray-500" />
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
              <p className="text-gray-400 text-center">No hay ingredientes registrados</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN (solo admin) */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[85vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">{editingRecipe ? 'Editar' : 'Nueva'} Receta</h2>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3 pr-1">
              <input
                type="text"
                placeholder="Nombre de la receta*"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border rounded-xl"
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2">📸 Foto de la receta</label>
                <div className="flex gap-2">
                  <button type="button" onClick={openCamera} className="flex-1 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm flex items-center justify-center gap-2 border border-blue-200">
                    <CameraIcon className="h-5 w-5" /> Cámara
                  </button>
                  <button type="button" onClick={openGallery} className="flex-1 p-3 bg-gray-50 text-gray-700 rounded-xl text-sm flex items-center justify-center gap-2 border border-gray-200">
                    🖼️ Galería
                  </button>
                </div>
                {image && (
                  <div className="mt-3 relative inline-block">
                    <img src={image} alt="Vista previa" className="w-20 h-20 object-cover rounded-lg border" />
                    <button type="button" onClick={() => setImage('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow">✕</button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">🥄 Ingredientes</label>
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-start border rounded-lg p-2">
                    <div className="flex-1 space-y-2">
                      <select
                        value={ing.product_id}
                        onChange={(e) => handleIngredientChange(idx, 'product_id', e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                        required
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cant."
                          value={ing.quantity}
                          onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                          className="flex-1 p-2 border rounded text-sm"
                          required
                        />
                        <select
                          value={ing.unit}
                          onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                          className="w-16 p-2 border rounded text-sm"
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="L">L</option>
                          <option value="unidad">ud</option>
                        </select>
                      </div>
                    </div>
                    {ingredients.length > 1 && (
                      <button type="button" onClick={() => handleRemoveIngredient(idx)} className="p-1 text-red-500">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={handleAddIngredient} className="text-blue-600 text-sm hover:underline">
                  + Agregar ingrediente
                </button>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3 border rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 p-3 bg-blue-600 text-white rounded-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
