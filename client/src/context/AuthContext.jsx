import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const SUPABASE_URL = 'https://fshypzqmuyctllmbzdnh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaHlwenFtdXljdGxsbWJ6ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTQ1NDMsImV4cCI6MjA5MzA3MDU0M30.m4c4A6J7K8JvGI69eHBpfUtGMMdD4jVGvfjz_NmQdHE';

// Compresor de imágenes (más agresivo para velocidad)
const compressImage = (base64Str, maxWidth = 400) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.4)); // calidad 40%
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  // Cache global de productos (sin imágenes) – clave por restaurante
  const [cachedProducts, setCachedProducts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setCurrentRestaurant(parsedUser.restaurant);
    }
    setLoading(false);
  }, []);

  // Función centralizada para llamadas a la API de Supabase
  const apiCall = useCallback(async (table, method, data = null, filters = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    };

    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const queryParams = new URLSearchParams();

    if (method !== 'POST') {
      if (filters.select) queryParams.append('select', filters.select);
      if (filters.id) queryParams.append('id', filters.id);
      if (filters.restaurant) queryParams.append('restaurant', filters.restaurant);
      if (filters.email) queryParams.append('email', filters.email);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.order) queryParams.append('order', filters.order);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.period && filters.period !== 'all') {
        const now = new Date();
        let dateFilter = '';
        if (filters.period === 'week') dateFilter = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
        else if (filters.period === 'month') dateFilter = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
        else if (filters.period === 'year') dateFilter = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();
        if (dateFilter) queryParams.append('created_at', `gte.${dateFilter}`);
      }
    }

    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    const config = { method, headers };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMsg = 'Error de red';
      try { const err = await response.json(); errorMsg = err.message || errorMsg; } catch (e) {}
      throw new Error(errorMsg);
    }
    if (response.status === 204 || method === 'DELETE') return { success: true };
    try { return await response.json(); } catch (e) { return { success: true }; }
  }, []);

  // ========== AUTENTICACIÓN ==========
  const login = async (email, password) => {
    const users = await apiCall('users', 'GET', null, { select: '*', email: `eq.${email}` });
    const foundUser = Array.isArray(users) ? users[0] : null;
    if (!foundUser || foundUser.password !== password) return { success: false, error: 'Credenciales inválidas' };
    const userData = { id: foundUser.id, email: foundUser.email, name: foundUser.name, role: foundUser.role, restaurant: foundUser.restaurant };
    const token = btoa(JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setCurrentRestaurant(userData.restaurant);
    return { success: true };
  };

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); setCurrentRestaurant(null); };
  const switchRestaurant = (r) => { if (user?.role === 'ADMIN') setCurrentRestaurant(r); };

  // ========== PRODUCTOS (CACHE Y METADATOS) ==========
  // Obtener productos SIN la imagen (metadatos ligeros)
  const fetchProductsMeta = useCallback(async (restaurant) => {
    const filters = {
      select: 'id,name,category,stock,unit,price,min_stock,expiry_date,restaurant,barcode,supplier_id,suppliers(name)',
      order: 'name.asc'
    };
    if (restaurant) filters.restaurant = `eq.${restaurant}`;
    return apiCall('products', 'GET', null, filters);
  }, [apiCall]);

  // Refrescar la caché global de productos para un restaurante dado
  const refreshProductCache = useCallback(async (restaurant) => {
    try {
      const products = await fetchProductsMeta(restaurant);
      setCachedProducts(prev => {
        const others = prev.filter(p => p.restaurant !== restaurant);
        return [...others, ...products];
      });
      return products;
    } catch (e) {
      return [];
    }
  }, [fetchProductsMeta]);

  // Obtener productos desde caché o red
  const getProducts = useCallback(async (options = {}) => {
    const { restaurant, forceRefresh } = options;
    const filterRestaurant = restaurant !== undefined ? restaurant : currentRestaurant;
    if (!forceRefresh && cachedProducts.some(p => p.restaurant === filterRestaurant)) {
      return cachedProducts.filter(p => p.restaurant === filterRestaurant);
    }
    return refreshProductCache(filterRestaurant);
  }, [cachedProducts, currentRestaurant, refreshProductCache]);

  // Obtener producto completo (con imagen) para edición
  const getProductById = useCallback(async (id) => {
    const products = await apiCall('products', 'GET', null, {
      select: '*',
      id: `eq.${id}`
    });
    return Array.isArray(products) ? products[0] : null;
  }, [apiCall]);

  // Agregar producto
  const addProduct = useCallback(async (data) => {
    let finalData = { ...data };
    if (finalData.image && finalData.image.startsWith('data:image')) {
      try { finalData.image = await compressImage(finalData.image); } catch (e) { throw new Error('Error al procesar la imagen'); }
    }
    const supplierId = data.supplier_id ? parseInt(data.supplier_id, 10) : null;
    const expiry = finalData.expiry_date && finalData.expiry_date.trim() !== '' ? finalData.expiry_date : null;
    const result = await apiCall('products', 'POST', {
      ...finalData,
      expiry_date: expiry,
      price: parseFloat(data.price) || 0,
      supplier_id: supplierId,
      restaurant: currentRestaurant,
      created_at: new Date().toISOString()
    });
    await refreshProductCache(currentRestaurant);
    return result;
  }, [apiCall, currentRestaurant, refreshProductCache]);

  // Actualizar producto (sin borrar imagen si no se envía una nueva)
  const updateProduct = useCallback(async (id, data) => {
    const supplierId = data.supplier_id ? parseInt(data.supplier_id, 10) : null;
    const expiry = data.expiry_date && data.expiry_date.trim() !== '' ? data.expiry_date : null;
    const patchData = {
      ...data,
      expiry_date: expiry,
      price: parseFloat(data.price) || 0,
      supplier_id: supplierId
    };
    // Si el campo image está vacío (no se modificó), lo eliminamos para no sobreescribir con null
    if (patchData.image === '' || patchData.image === undefined) delete patchData.image;
    const result = await apiCall('products', 'PATCH', patchData, { id: `eq.${id}` });
    await refreshProductCache(currentRestaurant);
    return result;
  }, [apiCall, currentRestaurant, refreshProductCache]);

  // Eliminar producto
  const deleteProduct = useCallback(async (id) => {
    const result = await apiCall('products', 'DELETE', null, { id: `eq.${id}` });
    await refreshProductCache(currentRestaurant);
    return result;
  }, [apiCall, currentRestaurant, refreshProductCache]);

  // ========== MOVIMIENTOS ==========
  const getMovements = useCallback(async (options = {}) => {
    const { restaurant, period } = options;
    const filterRestaurant = restaurant !== undefined ? restaurant : currentRestaurant;
    const filters = { select: '*,products(name,price),users(name)', order: 'created_at.desc', limit: '200' };
    if (filterRestaurant) filters.restaurant = `eq.${filterRestaurant}`;
    if (period && period !== 'all') filters.period = period;
    return apiCall('movements', 'GET', null, filters);
  }, [apiCall, currentRestaurant]);

  const addMovement = useCallback(async (data) => {
    const products = await apiCall('products', 'GET', null, { select: 'stock', id: `eq.${data.productId}` });
    const product = Array.isArray(products) ? products[0] : null;
    if (!product) throw new Error('Producto no encontrado');

    let newStock = product.stock;
    if (data.type === 'entrada') newStock += parseFloat(data.quantity);
    else if (data.type === 'salida') {
      if (product.stock < data.quantity) throw new Error('Stock insuficiente');
      newStock -= parseFloat(data.quantity);
    } else if (data.type === 'ajuste') newStock = parseFloat(data.quantity);

    await apiCall('products', 'PATCH', { stock: newStock }, { id: `eq.${data.productId}` });

    const result = await apiCall('movements', 'POST', {
      type: data.type,
      quantity: parseFloat(data.quantity),
      reason: data.reason || null,
      product_id: data.productId,
      restaurant: currentRestaurant,
      user_id: user?.id,
      created_at: new Date().toISOString()
    });
    await refreshProductCache(currentRestaurant);
    return result;
  }, [apiCall, currentRestaurant, user, refreshProductCache]);

  // ========== TRANSFERENCIAS ==========
  const getTransfers = useCallback(() => {
    return apiCall('transfers', 'GET', null, { select: '*,products(name,unit,price),users(name)', order: 'created_at.desc' });
  }, [apiCall]);

  const addTransfer = useCallback(async (data) => {
    const products = await apiCall('products', 'GET', null, { select: '*', id: `eq.${data.productId}` });
    const product = Array.isArray(products) ? products[0] : null;
    if (!product) throw new Error('Producto no encontrado');
    if (product.stock < data.quantity) throw new Error('Stock insuficiente');

    const transfer = await apiCall('transfers', 'POST', {
      product_id: data.productId,
      quantity: data.quantity,
      to_restaurant: data.toRestaurant,
      reason: data.reason || null,
      from_restaurant: currentRestaurant,
      user_id: user?.id,
      status: 'pendiente',
      created_at: new Date().toISOString()
    });

    const newStock = product.stock - data.quantity;
    await apiCall('products', 'PATCH', { stock: newStock }, { id: `eq.${data.productId}` });

    await apiCall('movements', 'POST', {
      type: 'salida',
      quantity: data.quantity,
      reason: `Transferencia a ${data.toRestaurant}${data.reason ? ': ' + data.reason : ''}`,
      product_id: data.productId,
      restaurant: currentRestaurant,
      user_id: user?.id,
      created_at: new Date().toISOString()
    });

    await refreshProductCache(currentRestaurant);
    return transfer;
  }, [apiCall, currentRestaurant, user, refreshProductCache]);

  const completeTransfer = useCallback(async (id) => {
    const transfers = await apiCall('transfers', 'GET', null, { select: '*', id: `eq.${id}` });
    const transfer = Array.isArray(transfers) ? transfers[0] : null;
    if (!transfer) throw new Error('Transferencia no encontrada');
    if (transfer.status === 'completado') throw new Error('Ya está completada');

    const products = await apiCall('products', 'GET', null, { select: '*', id: `eq.${transfer.product_id}` });
    const product = Array.isArray(products) ? products[0] : null;
    if (!product) throw new Error('Producto original no encontrado');

    const destProducts = await apiCall('products', 'GET', null, {
      select: '*',
      name: `eq.${product.name}`,
      restaurant: `eq.${transfer.to_restaurant}`
    });
    const destProduct = Array.isArray(destProducts) ? destProducts[0] : null;

    if (destProduct) {
      await apiCall('products', 'PATCH', { stock: destProduct.stock + transfer.quantity }, { id: `eq.${destProduct.id}` });
    } else {
      await apiCall('products', 'POST', {
        name: product.name,
        category: product.category,
        stock: transfer.quantity,
        unit: product.unit,
        min_stock: product.min_stock,
        expiry_date: product.expiry_date || null,
        restaurant: transfer.to_restaurant,
        image: product.image,
        barcode: product.barcode,
        price: product.price,
        supplier_id: product.supplier_id,
        created_at: new Date().toISOString()
      });
    }

    await apiCall('movements', 'POST', {
      type: 'entrada',
      quantity: transfer.quantity,
      reason: `Transferencia desde ${transfer.from_restaurant}`,
      product_id: destProduct ? destProduct.id : product.id,
      restaurant: transfer.to_restaurant,
      user_id: user?.id,
      created_at: new Date().toISOString()
    });

    await apiCall('transfers', 'PATCH', { status: 'completado', completed_at: new Date().toISOString() }, { id: `eq.${id}` });
    await refreshProductCache(currentRestaurant);
    return { success: true };
  }, [apiCall, user, refreshProductCache, currentRestaurant]);

  // ========== SOLICITUDES ==========
  const getRequests = useCallback(() => {
    return apiCall('requests', 'GET', null, { select: '*,users(name)', order: 'created_at.desc' });
  }, [apiCall]);

  const addRequest = useCallback((data) => {
    return apiCall('requests', 'POST', { ...data, user_id: user?.id, restaurant: currentRestaurant, status: 'pendiente', created_at: new Date().toISOString() });
  }, [apiCall, currentRestaurant, user]);

  const updateRequest = useCallback((id, status) => {
    return apiCall('requests', 'PATCH', { status }, { id: `eq.${id}` });
  }, [apiCall]);

  // ========== DASHBOARD ==========
  const getDashboard = useCallback(async () => {
    const allProducts = await getProducts({ restaurant: null, forceRefresh: true });
    const restaurants = ['POZOBLANCO', 'FUERTEVENTURA', 'GRAN_CAPITAN'];
    const stats = {};
    for (const rest of restaurants) {
      const filtered = allProducts.filter(p => p.restaurant === rest);
      stats[rest] = {
        totalProducts: filtered.length,
        lowStock: filtered.filter(p => p.stock <= p.min_stock).length
      };
    }
    const pending = await apiCall('transfers', 'GET', null, { select: 'id', status: 'eq.pendiente' });
    return { restaurants: stats, pendingTransfers: pending.length };
  }, [apiCall, getProducts]);

  // ========== PROVEEDORES ==========
  const getSuppliers = useCallback(() => apiCall('suppliers', 'GET', null, { select: '*', order: 'name.asc' }), [apiCall]);
  const addSupplier = useCallback((data) => { if (user?.role !== 'ADMIN') throw new Error('Solo admin'); return apiCall('suppliers', 'POST', { ...data, created_at: new Date().toISOString() }); }, [apiCall, user]);
  const updateSupplier = useCallback((id, data) => { if (user?.role !== 'ADMIN') throw new Error('Solo admin'); return apiCall('suppliers', 'PATCH', data, { id: `eq.${id}` }); }, [apiCall, user]);
  const deleteSupplier = useCallback((id) => { if (user?.role !== 'ADMIN') throw new Error('Solo admin'); return apiCall('suppliers', 'DELETE', null, { id: `eq.${id}` }); }, [apiCall, user]);

  // ========== RECETAS ==========
  const getRecipes = useCallback(() => {
    return apiCall('recipes', 'GET', null, { select: '*,recipe_ingredients(*,products(name,unit))', restaurant: `eq.${currentRestaurant}`, order: 'name.asc' });
  }, [apiCall, currentRestaurant]);

  const addRecipe = useCallback(async (name, image, ingredients) => {
    if (user?.role !== 'ADMIN') throw new Error('Solo administradores');
    let finalImage = image;
    if (finalImage && finalImage.startsWith('data:image')) try { finalImage = await compressImage(finalImage); } catch (e) { throw new Error('Error al procesar la imagen'); }
    const recipe = await apiCall('recipes', 'POST', { name, image: finalImage, restaurant: currentRestaurant, created_at: new Date().toISOString() });
    for (const ing of ingredients) {
      await apiCall('recipe_ingredients', 'POST', { recipe_id: recipe.id, product_id: ing.product_id, quantity: ing.quantity, unit: ing.unit });
    }
    return recipe;
  }, [apiCall, currentRestaurant, user]);

  const updateRecipe = useCallback(async (id, name, image, ingredients) => {
    if (user?.role !== 'ADMIN') throw new Error('Solo administradores');
    let finalImage = image;
    if (finalImage && finalImage.startsWith('data:image')) try { finalImage = await compressImage(finalImage); } catch (e) { throw new Error('Error al procesar la imagen'); }
    await apiCall('recipes', 'PATCH', { name, image: finalImage }, { id: `eq.${id}` });
    const existing = await apiCall('recipe_ingredients', 'GET', null, { select: 'id', recipe_id: `eq.${id}` });
    for (const ing of (Array.isArray(existing) ? existing : [])) await apiCall('recipe_ingredients', 'DELETE', null, { id: `eq.${ing.id}` });
    for (const ing of ingredients) await apiCall('recipe_ingredients', 'POST', { recipe_id: id, product_id: ing.product_id, quantity: ing.quantity, unit: ing.unit });
  }, [apiCall, user]);

  const deleteRecipe = useCallback((id) => {
    if (user?.role !== 'ADMIN') throw new Error('Solo administradores');
    return apiCall('recipes', 'DELETE', null, { id: `eq.${id}` });
  }, [apiCall, user]);

  // ========== UTILIDADES ==========
  const restaurantNames = {
    POZOBLANCO: '🍽️ Godeo Pozoblanco',
    FUERTEVENTURA: '🏖️ Godeo Fuerteventura',
    GRAN_CAPITAN: '🏛️ Godeo Gran Capitán'
  };

  // ========== VALOR EXPORTADO ==========
  const value = {
    user, login, logout, switchRestaurant, currentRestaurant,
    isAdmin: user?.role === 'ADMIN',
    restaurantName: restaurantNames[currentRestaurant],
    getProducts, getProductById, refreshProductCache,
    addProduct, updateProduct, deleteProduct,
    getMovements, addMovement,
    getTransfers, addTransfer, completeTransfer,
    getRequests, addRequest, updateRequest,
    getDashboard,
    getSuppliers, addSupplier, updateSupplier, deleteSupplier,
    getRecipes, addRecipe, updateRecipe, deleteRecipe
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
