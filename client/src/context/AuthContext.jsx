import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const SUPABASE_URL = 'https://fshypzqmuyctllmbzdnh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaHlwenFtdXljdGxsbWJ6ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTQ1NDMsImV4cCI6MjA5MzA3MDU0M30.m4c4A6J7K8JvGI69eHBpfUtGMMdD4jVGvfjz_NmQdHE';

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
      resolve(canvas.toDataURL('image/jpeg', 0.4));
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [cachedProducts, setCachedProducts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (parsedUser.role === 'ADMIN') {
          const savedRestaurant = localStorage.getItem('selectedRestaurant');
          setCurrentRestaurant(savedRestaurant || parsedUser.restaurant);
        } else {
          setCurrentRestaurant(parsedUser.restaurant);
        }
      } catch (e) {
        console.error('Error al leer sesión:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

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
      if (filters.parent_id) queryParams.append('parent_id', filters.parent_id);
      if (filters.email) queryParams.append('email', filters.email);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.order) queryParams.append('order', filters.order);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.or) queryParams.append('or', filters.or);
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

  const login = async (email, password) => {
    try {
      const users = await apiCall('users', 'GET', null, {
        select: '*',
        email: `eq.${email}`
      });
      const foundUser = Array.isArray(users) ? users[0] : null;
      if (!foundUser || foundUser.password !== password) {
        return { success: false, error: 'Credenciales inválidas' };
      }
      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        restaurant: foundUser.restaurant
      };
      const token = btoa(JSON.stringify(userData));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      if (userData.role === 'ADMIN') {
        const saved = localStorage.getItem('selectedRestaurant');
        setCurrentRestaurant(saved || userData.restaurant);
      } else {
        setCurrentRestaurant(userData.restaurant);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedRestaurant');
    setUser(null);
    setCurrentRestaurant(null);
  };

  const switchRestaurant = (r) => {
    if (user?.role === 'ADMIN') {
      setCurrentRestaurant(r);
      localStorage.setItem('selectedRestaurant', r);
    }
  };

  const showLocalNotification = (title, body, url = '/') => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/godeo-inventory/icon-192.png', data: { url } });
    }
  };

  const sendPushNotification = useCallback(async (payload) => {
    showLocalNotification(payload.title, payload.body, payload.url);
    try {
      await apiCall('notifications', 'POST', {
        user_id: user?.id,
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/godeo-inventory/icon-192.png',
        url: payload.url || '/dashboard',
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {}
  }, [user, apiCall]);

  const enableNotifications = useCallback(async () => {
    try {
      if (typeof Notification === 'undefined') return { success: false, error: 'Notificaciones no soportadas' };
      const permission = await Notification.requestPermission();
      return permission === 'granted' ? { success: true } : { success: false, error: 'Permiso denegado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // ========== CATEGORÍAS ==========
  const getCategories = useCallback(async (parentId = null) => {
    const filters = { select: '*', or: `(restaurant.eq.${currentRestaurant}, restaurant.is.null)`, order: 'name.asc' };
    if (parentId === null) filters.parent_id = 'is.null';
    else filters.parent_id = `eq.${parentId}`;
    return apiCall('categories', 'GET', null, filters);
  }, [apiCall, currentRestaurant]);

  const getAllCategoriesFlat = useCallback(async () => {
    const all = await apiCall('categories', 'GET', null, { select: '*', or: `(restaurant.eq.${currentRestaurant}, restaurant.is.null)`, order: 'name.asc' });
    const categories = all || [];
    const addPath = (cat, depth = 0) => {
      const children = categories.filter(c => c.parent_id === cat.id);
      const result = [{ ...cat, depth, label: ' '.repeat(depth) + cat.name }];
      children.forEach(child => { result.push(...addPath(child, depth + 1)); });
      return result;
    };
    const roots = categories.filter(c => c.parent_id === null);
    let flat = [];
    roots.forEach(r => flat.push(...addPath(r)));
    return flat;
  }, [apiCall, currentRestaurant]);

  const addCategory = useCallback(async (name, parentId = null, isGlobal = false) => {
    if (user?.role !== 'ADMIN') throw new Error('Solo administradores');
    return apiCall('categories', 'POST', { name, parent_id: parentId, restaurant: isGlobal ? null : currentRestaurant, created_at: new Date().toISOString() });
  }, [apiCall, currentRestaurant, user]);

  const updateCategory = useCallback(async (id, name, parentId, isGlobal = false) => {
    if (user?.role !== 'ADMIN') throw new Error('Solo administradores');
    return apiCall('categories', 'PATCH', { name, parent_id: parentId, restaurant: isGlobal ? null : currentRestaurant }, { id: `eq.${id}` });
  }, [apiCall, user]);

  const deleteCategory = useCallback(async (id) => {
    if (user?.role !== 'ADMIN') throw new Error('Solo administradores');
    return apiCall('categories', 'DELETE', null, { id: `eq.${id}` });
  }, [apiCall, user]);

  const getCategoryPath = useCallback(async (categoryId) => {
    if (!categoryId) return '';
    let path = [];
    let currentId = categoryId;
    while (currentId) {
      const result = await apiCall('categories', 'GET', null, { select: 'id,name,parent_id', id: `eq.${currentId}` });
      const cat = result?.[0];
      if (!cat) break;
      path.unshift(cat.name);
      currentId = cat.parent_id;
    }
    return path.join(' > ');
  }, [apiCall]);

  // ========== PRODUCTOS ==========
  const fetchProductsMeta = useCallback(async (restaurant) => {
    const filters = {
      select: 'id,name,category_id,stock,unit,price,min_stock,expiry_date,restaurant,barcode,supplier_id,suppliers(name),categories!products_category_id_fkey(name,parent_id)',
      order: 'name.asc'
    };
    if (restaurant) filters.restaurant = `eq.${restaurant}`;
    return apiCall('products', 'GET', null, filters);
  }, [apiCall]);

  const refreshProductCache = useCallback(async (restaurant) => {
    try {
      const prods = await fetchProductsMeta(restaurant);
      setCachedProducts(prev => {
        const others = prev.filter(p => p.restaurant !== restaurant);
        return [...others, ...prods];
      });
      return prods;
    } catch (e) { return []; }
  }, [fetchProductsMeta]);

  const getProducts = useCallback(async (options = {}) => {
    const { restaurant, forceRefresh } = options;
    const filterRestaurant = restaurant !== undefined ? restaurant : currentRestaurant;
    if (!forceRefresh && cachedProducts.some(p => p.restaurant === filterRestaurant)) {
      return cachedProducts.filter(p => p.restaurant === filterRestaurant);
    }
    return refreshProductCache(filterRestaurant);
  }, [cachedProducts, currentRestaurant, refreshProductCache]);

  const getProductById = useCallback(async (id) => {
    const prods = await apiCall('products', 'GET', null, {
      select: '*,categories!products_category_id_fkey(name,parent_id)',
      id: `eq.${id}`
    });
    return Array.isArray(prods) ? prods[0] : null;
  }, [apiCall]);

  const getProductImage = useCallback(async (id) => {
    try {
      const result = await apiCall('products', 'GET', null, { select: 'image', id: `eq.${id}` });
      const prod = Array.isArray(result) ? result[0] : null;
      return prod?.image || null;
    } catch { return null; }
  }, [apiCall]);

  const addProduct = useCallback(async (data, targetRestaurant = null) => {
    const restaurant = targetRestaurant || currentRestaurant;
    let finalData = { ...data };
    if (finalData.image && finalData.image.startsWith('data:image')) {
      try { finalData.image = await compressImage(finalData.image); } catch (e) { throw new Error('Error al procesar la imagen'); }
    }
    const supplierId = data.supplier_id ? parseInt(data.supplier_id, 10) : null;
    const expiry = finalData.expiry_date && finalData.expiry_date.trim() !== '' ? finalData.expiry_date : null;
    const categoryId = finalData.category_id ? parseInt(finalData.category_id, 10) : null;
    const result = await apiCall('products', 'POST', {
      ...finalData, expiry_date: expiry, price: parseFloat(data.price) || 0,
      supplier_id: supplierId, category_id: categoryId, restaurant: restaurant, created_at: new Date().toISOString()
    });
    await refreshProductCache(restaurant);
    return result;
  }, [apiCall, currentRestaurant, refreshProductCache]);

  const updateProduct = useCallback(async (id, data) => {
    const supplierId = data.supplier_id ? parseInt(data.supplier_id, 10) : null;
    const expiry = data.expiry_date && data.expiry_date.trim() !== '' ? data.expiry_date : null;
    const patchData = { ...data, expiry_date: expiry, price: parseFloat(data.price) || 0, supplier_id: supplierId };
    if (data.category_id !== undefined) patchData.category_id = parseInt(data.category_id, 10) || null;
    if (patchData.image === '' || patchData.image === undefined) delete patchData.image;
    const result = await apiCall('products', 'PATCH', patchData, { id: `eq.${id}` });
    await refreshProductCache(currentRestaurant);
    return result;
  }, [apiCall, currentRestaurant, refreshProductCache]);

  const deleteProduct = useCallback(async (id) => {
    const result = await apiCall('products', 'DELETE', null, { id: `eq.${id}` });
    await refreshProductCache(currentRestaurant);
    return result;
  }, [apiCall, currentRestaurant, refreshProductCache]);

  const duplicateProduct = useCallback(async (productId, targetRestaurant) => {
    const product = await getProductById(productId);
    if (!product) throw new Error('Producto no encontrado');
    return addProduct({
      name: product.name, category_id: product.category_id, stock: product.stock,
      unit: product.unit, min_stock: product.min_stock, expiry_date: product.expiry_date,
      image: product.image, barcode: product.barcode, supplier_id: product.supplier_id, price: product.price
    }, targetRestaurant);
  }, [getProductById, addProduct]);

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
    const products = await apiCall('products', 'GET', null, { select: 'stock,min_stock,name,unit', id: `eq.${data.productId}` });
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
      type: data.type, quantity: parseFloat(data.quantity), reason: data.reason || null,
      product_id: data.productId, restaurant: currentRestaurant, user_id: user?.id,
      created_at: new Date().toISOString()
    });

    if (user?.role !== 'ADMIN') {
      sendPushNotification({
        title: '🔄 Movimiento Realizado',
        body: `${user?.name} registró ${data.type === 'entrada' ? 'entrada' : 'salida'} de ${data.quantity} ${product.unit || ''} de ${product.name}`,
        url: '/movements'
      });
    }

    if (newStock <= product.min_stock && product.min_stock > 0) {
      sendPushNotification({
        title: '⚠️ Stock Bajo',
        body: `${product.name} tiene solo ${newStock} ${product.unit} (mín: ${product.min_stock})`,
        url: '/inventory'
      });
    }

    await refreshProductCache(currentRestaurant);
    return result;
  }, [apiCall, currentRestaurant, user, refreshProductCache, sendPushNotification]);

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
      product_id: data.productId, quantity: data.quantity, to_restaurant: data.toRestaurant,
      reason: data.reason || null, from_restaurant: currentRestaurant, user_id: user?.id,
      status: 'pendiente', created_at: new Date().toISOString()
    });

    const newStock = product.stock - data.quantity;
    await apiCall('products', 'PATCH', { stock: newStock }, { id: `eq.${data.productId}` });

    await apiCall('movements', 'POST', {
      type: 'salida', quantity: data.quantity,
      reason: `Transferencia a ${data.toRestaurant}${data.reason ? ': ' + data.reason : ''}`,
      product_id: data.productId, restaurant: currentRestaurant, user_id: user?.id,
      created_at: new Date().toISOString()
    });

    sendPushNotification({
      title: '🚚 Transferencia Pendiente',
      body: `${user?.name} envió ${data.quantity} ${product.unit} de ${product.name} a ${data.toRestaurant}`,
      url: '/transfers'
    });

    await refreshProductCache(currentRestaurant);
    return transfer;
  }, [apiCall, currentRestaurant, user, refreshProductCache, sendPushNotification]);

  const completeTransfer = useCallback(async (id) => {
    const transfers = await apiCall('transfers', 'GET', null, { select: '*', id: `eq.${id}` });
    const transfer = Array.isArray(transfers) ? transfers[0] : null;
    if (!transfer) throw new Error('Transferencia no encontrada');
    if (transfer.status === 'completado') throw new Error('Ya está completada');

    const products = await apiCall('products', 'GET', null, { select: '*', id: `eq.${transfer.product_id}` });
    const product = Array.isArray(products) ? products[0] : null;
    if (!product) throw new Error('Producto original no encontrado');

    const destProducts = await apiCall('products', 'GET', null, {
      select: '*', name: `eq.${product.name}`, restaurant: `eq.${transfer.to_restaurant}`
    });
    const destProduct = Array.isArray(destProducts) ? destProducts[0] : null;

    if (destProduct) {
      await apiCall('products', 'PATCH', { stock: destProduct.stock + transfer.quantity }, { id: `eq.${destProduct.id}` });
    } else {
      await apiCall('products', 'POST', {
        name: product.name, category_id: product.category_id, stock: transfer.quantity,
        unit: product.unit, min_stock: product.min_stock, expiry_date: product.expiry_date || null,
        restaurant: transfer.to_restaurant, image: product.image, barcode: product.barcode,
        price: product.price, supplier_id: product.supplier_id, created_at: new Date().toISOString()
      });
    }

    await apiCall('movements', 'POST', {
      type: 'entrada', quantity: transfer.quantity,
      reason: `Transferencia desde ${transfer.from_restaurant}`,
      product_id: destProduct ? destProduct.id : product.id, restaurant: transfer.to_restaurant,
      user_id: user?.id, created_at: new Date().toISOString()
    });

    await apiCall('transfers', 'PATCH', { status: 'completado', completed_at: new Date().toISOString() }, { id: `eq.${id}` });

    sendPushNotification({
      title: '✅ Transferencia Completada',
      body: `Se recibió ${product.name} (${transfer.quantity} ${product.unit})`,
      url: '/transfers'
    });

    await refreshProductCache(currentRestaurant);
    return { success: true };
  }, [apiCall, user, refreshProductCache, currentRestaurant, sendPushNotification]);

  // ========== SOLICITUDES ==========
  const getRequests = useCallback(() => {
    return apiCall('requests', 'GET', null, { select: '*,users(name)', order: 'created_at.desc' });
  }, [apiCall]);

  const addRequest = useCallback(async (data) => {
    const result = await apiCall('requests', 'POST', {
      ...data, user_id: user?.id, restaurant: currentRestaurant, status: 'pendiente', created_at: new Date().toISOString()
    });
    sendPushNotification({
      title: '📋 Nuevo Pedido',
      body: `${user?.name} solicitó ${data.quantity} ${data.unit} de ${data.productName}`,
      url: '/requests'
    });
    return result;
  }, [apiCall, currentRestaurant, user, sendPushNotification]);

  const updateRequest = useCallback(async (id, status) => {
    const result = await apiCall('requests', 'PATCH', { status }, { id: `eq.${id}` });
    const request = await apiCall('requests', 'GET', null, { select: '*', id: `eq.${id}` });
    if (request?.[0]) {
      sendPushNotification({
        title: status === 'aprobado' ? '✅ Pedido Aprobado' : '❌ Pedido Rechazado',
        body: `Tu solicitud de ${request[0].product_name} ha sido ${status}`,
        url: '/requests'
      });
    }
    return result;
  }, [apiCall, sendPushNotification]);

  // ========== DASHBOARD ==========
  const getDashboard = useCallback(async () => {
    const allProducts = await getProducts({ restaurant: null, forceRefresh: true });
    const restaurants = ['POZOBLANCO', 'FUERTEVENTURA', 'GRAN_CAPITAN'];
    const stats = {};
    for (const rest of restaurants) {
      const filtered = allProducts.filter(p => p.restaurant === rest);
      stats[rest] = { totalProducts: filtered.length, lowStock: filtered.filter(p => p.stock <= p.min_stock).length };
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

  const restaurantNames = {
    POZOBLANCO: '🍽️ Godeo Pozoblanco',
    FUERTEVENTURA: '🏖️ Godeo Fuerteventura',
    GRAN_CAPITAN: '🏛️ Godeo Gran Capitán'
  };

  const value = {
    user, login, logout, switchRestaurant, currentRestaurant,
    isAdmin: user?.role === 'ADMIN',
    restaurantName: restaurantNames[currentRestaurant],
    notificationsEnabled: (typeof Notification !== 'undefined' && Notification.permission === 'granted'),
    enableNotifications,
    getProducts, getProductById, getProductImage, refreshProductCache,
    addProduct, updateProduct, deleteProduct, duplicateProduct,
    getMovements, addMovement,
    getTransfers, addTransfer, completeTransfer,
    getRequests, addRequest, updateRequest,
    getDashboard,
    getSuppliers, addSupplier, updateSupplier, deleteSupplier,
    getRecipes, addRecipe, updateRecipe, deleteRecipe,
    getCategories, getAllCategoriesFlat, addCategory, updateCategory, deleteCategory, getCategoryPath
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
