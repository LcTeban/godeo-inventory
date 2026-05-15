import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PlusIcon, TrashIcon, PencilIcon, CameraIcon,
  XMarkIcon, BookOpenIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';

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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      toast.error('Error al cargar las recetas');
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
    if (!name.trim()) return toast.error('Falta el nombre de la receta');

    try {
      if (editingRecipe) {
        const validIngredients = ingredients.filter(ing => ing.product_id && parseFloat(ing.quantity) > 0);
        await updateRecipe(editingRecipe.id, name, image, validIngredients);
        toast.success('Receta actualizada correctamente');
      } else {
        await addRecipe(name, image, []);
        toast.success('Receta creada correctamente. Ahora puedes editarla para añadir ingredientes.');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar receta?')) {
      try {
        await deleteRecipe(id);
        loadData();
        toast.success('Receta eliminada');
      } catch (error) {
        toast.error('Error al eliminar');
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

  // Variantes de animación stagger para tarjetas
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  // Variantes para modales
  const modalVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
  };

  const desktopModalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 25 },
    },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">📖 Recetas</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona las recetas y sus ingredientes</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-all shadow-sm shadow-orange-200 active:scale-95"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva Receta
          </button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar receta por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all shadow-sm"
        />
      </div>

      {/* Lista de recetas */}
      {filteredRecipes.length === 0 ? (
        searchTerm ? (
          <EmptyState
            icon={BookOpenIcon}
            title="Sin resultados"
            message="Prueba con otro término de búsqueda"
            actionLabel="Ver todas las recetas"
            onAction={() => setSearchTerm('')}
          />
        ) : (
          <EmptyState
            icon={BookOpenIcon}
            title="No hay recetas"
            message="Crea la primera receta para empezar"
            actionLabel="Nueva receta"
            onAction={openAdd}
          />
        )
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" variants={containerVariants} initial="hidden" animate="visible">
          {filteredRecipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md group"
              variants={itemVariants}
              layout
            >
              {/* Imagen de la receta (abre detalle) */}
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
                {/* Overlay gradiente en la parte inferior */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold text-lg leading-tight">{recipe.name}</h3>
                </div>
              </div>

              {/* Información y acciones */}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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

                {/* Lista de ingredientes (preview) */}
                {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {recipe.recipe_ingredients.slice(0, 3).map((ing, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 truncate mr-2">{ing.products?.name || 'Producto'}</span>
                        <span className="font-medium text-slate-900 whitespace-nowrap tabular-nums">
                          {ing.quantity} <span className="text-slate-500 font-normal">{ing.unit}</span>
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
                  <p className="text-sm text-slate-400 italic mt-3">Sin ingredientes aún</p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal Detalle (vista previa) */}
      <AnimatePresence>
        {showDetail && selectedRecipe && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col"
            onClick={() => setShowDetail(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
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
                <div className="w-full h-64 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpenIcon className="h-16 w-16 text-slate-600" />
                </div>
              )}
              <h3 className="text-white font-semibold mb-4 text-lg">🥄 Ingredientes</h3>
              {selectedRecipe.recipe_ingredients && selectedRecipe.recipe_ingredients.length > 0 ? (
                <ul className="space-y-2.5">
                  {selectedRecipe.recipe_ingredients.map((ing, i) => (
                    <li key={i} className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 flex justify-between items-center">
                      <span className="text-slate-200 font-medium">{ing.products?.name || `Producto #${ing.product_id}`}</span>
                      <span className="text-white font-semibold tabular-nums">
                        {ing.quantity} <span className="text-slate-400 font-normal">{ing.unit}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-center py-8">No hay ingredientes registrados</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Crear/Editar Receta */}
      <AnimatePresence>
        {showModal && isAdmin && (
          <motion.div
            className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center'} bg-black/30 backdrop-blur-sm`}
            onClick={() => setShowModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`bg-white w-full max-w-lg flex flex-col shadow-2xl ${isMobile ? 'rounded-t-[32px] mb-12' : 'rounded-2xl'}`}
              style={isMobile ? { maxHeight: '85dvh' } : { maxHeight: '85vh' }}
              onClick={e => e.stopPropagation()}
              variants={isMobile ? modalVariants : desktopModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {isMobile && <div className="bottom-sheet-handle" />}
              {/* Cabecera del modal */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingRecipe ? '✏️ Editar Receta' : '📖 Nueva Receta'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto modal-scroll">
                <div className="px-6 py-5 space-y-5" style={{ paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '16px' }}>
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la receta *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Tarta de queso"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Imagen */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">📸 Imagen de la receta</label>
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
                        className="flex-1 py-3 px-4 bg-slate-50 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 border border-slate-200"
                      >
                        🖼️ Galería
                      </button>
                    </div>
                    {image && (
                      <div className="mt-3 relative inline-block">
                        <img
                          src={image}
                          alt="Vista previa"
                          className="w-28 h-28 object-cover rounded-xl border-2 border-slate-100 shadow-sm"
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

                  {/* Ingredientes (solo en edición) */}
                  {editingRecipe && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">🥄 Ingredientes</label>
                      <div className="space-y-3">
                        {ingredients.map((ing, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all"
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
                                  className="w-28 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all"
                                  required
                                />
                                <select
                                  value={ing.unit}
                                  onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                                  className="w-24 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none transition-all"
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
                          className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50 transition-all"
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

                {/* Footer del modal */}
                <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
                  >
                    {editingRecipe ? 'Actualizar Receta' : 'Crear Receta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Recipes;
