import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const SUPABASE_URL = 'https://fshypzqmuyctllmbzdnh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaHlwenFtdXljdGxsbWJ6ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTQ1NDMsImV4cCI6MjA5MzA3MDU0M30.m4c4A6J7K8JvGI69eHBpfUtGMMdD4jVGvfjz_NmQdHE';

const compressImage = (base64Str, maxWidth = 800) => {
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
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);

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
      try {
        const errorBody = await response.json();
        errorMsg = errorBody.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    if (response.status === 204 || method === 'DELETE') return { success: true };

    try {
      return await response.json();
    } catch (e) {
      return { success: true };
    }
  }, []);

  // Autenticación
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
      setCurrentRestaurant(userData.restaurant);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentRestaurant(null);
  };

  const switchRestaurant = (restaurant) => {
    if (user?.role === 'ADMIN') setCurrentRestaurant(restaurant);
  };

  // Productos
  const getProducts = useCallback(() => {
    return apiCall('products', 'GET', null, {
      select: '*,suppliers(name)',
      restaurant: `eq.${currentRestaurant}`,
      order: 'name.asc'
    });
  }, [apiCall, currentRestaurant]);

  const addProduct = useCallback(async (data) => {
    let finalData = { ...data };
    if (finalData.image && finalData.image.startsWith('data:image')) {
      try {
        finalData.image = await compressImage(finalData.image);
      } catch (e) {
        throw new Error('Error al procesar la imagen');
      }
    }
    // Asegurar que supplier_id sea número o null
    const supplierId = data.supplier_id ? parseInt(data.supplier_id, 10) : null;
    return apiCall('products', 'POST', {
      ...finalData,
      supplier_id: supplierId,
      restaurant: currentRestaurant,
      created_at: new Date().toISOString()
    });
  }, [apiCall, currentRestaurant]);

  const updateProduct = useCallback((id, data) => {
    const supplierId = data.supplier_id ? parseInt(data.supplier_id, 10) : null;
    return apiCall('products', 'PATCH', { ...data, supplier_id: supplierId }, { id: `eq.${id}` });
  }, [apiCall]);

  const deleteProduct = useCallback((id) => {
    return apiCall('products', 'DELETE', null, { id: `eq.${id}` });
  }, [apiCall]);

  // Movimientos
  const getMovements = useCallback(() => {
    return apiCall('movements', 'GET', null, {
      select: '*,products(name),users(name)',
      restaurant: `eq.${currentRestaurant}`,
      order: 'created_at.desc',
      limit: '100'
    });
  }, [apiCall, currentRestaurant]);

  const addMovement = useCallback((data) => {
    return apiCall('movements', 'POST', {
      ...data,
      restaurant: currentRestaurant,
      user_id: user?.id,
      created_at: new Date().toISOString()
    });
  }, [apiCall, currentRestaurant, user]);

  // Transferencias
  const getTransfers = useCallback(() => {
    return apiCall('transfers', 'GET', null, {
      select: '*,products(name,unit),users(name)',
      order: 'created_at.desc'
    });
  }, [apiCall]);

  const addTransfer = useCallback(async (data) => {
    const products = await apiCall('products', 'GET', null, {
      select: '*',
      id: `eq.${data.productId}`
    });
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
      user_id: user?.id,
      restaurant: currentRestaurant,
      created_at: new Date().toISOString()
    });

    return transfer;
  }, [apiCall, currentRestaurant, user]);

  const completeTransfer = useCallback(async (id) => {
    const transfers = await apiCall('transfers', 'GET', null, {
      select: '*',
      id: `eq.${id}`
    });
    const transfer = Array.isArray(transfers) ? transfers[0] : null;
    if (!transfer) throw new Error('Transferencia no encontrada');
    if (transfer.status === 'completado') throw new Error('Ya está completada');

    const products = await apiCall('products', 'GET', null, {
      select: '*',
      id: `eq.${transfer.product_id}`
    });
    const product = Array.isArray(products) ? products[0] : null;
    if (!product) throw new Error('Producto original no encontrado');

    const destProducts = await apiCall('products', 'GET', null, {
      select: '*',
      name: `eq.${product.name}`,
      restaurant: `eq.${transfer.to_restaurant}`
    });
    const destProduct = Array.isArray(destProducts) ? destProducts[0] : null;

    if (destProduct) {
      const newStock = destProduct.stock + transfer.quantity;
      await apiCall('products', 'PATCH', { stock: newStock }, { id: `eq.${destProduct.id}` });
    } else {
      await apiCall('products', 'POST', {
        name: product.name,
        category: product.category,
        stock: transfer.quantity,
        unit: product.unit,
        min_stock: product.min_stock,
        expiry_date: product.expiry_date,
        restaurant: transfer.to_restaurant,
        image: product.image,
        barcode: product.barcode,
        supplier_id: product.supplier_id,
        created_at: new Date().toISOString()
      });
    }

    await apiCall('movements', 'POST', {
      type: 'entrada',
      quantity: transfer.quantity,
      reason: `Transferencia desde ${transfer.from_restaurant}`,
      product_id: destProduct ? destProduct.id : product.id,
      user_id: user?.id,
      restaurant: transfer.to_restaurant,
      created_at: new Date().toISOString()
    });

    await apiCall('transfers', 'PATCH', {
      status: 'completado',
      completed_at: new Date().toISOString()
    }, { id: `eq.${id}` });

    return { success: true };
  }, [apiCall, user]);

  // Solicitudes
  const getRequests = useCallback(() => {
    return apiCall('requests', 'GET', null, {
      select: '*,users(name)',
      order: 'created_at.desc'
    });
  }, [apiCall]);

  const addRequest = useCallback((data) => {
    return apiCall('requests', 'POST', {
      ...data,
      user_id: user?.id,
      restaurant: currentRestaurant,
      status: 'pendiente',
      created_at: new Date().toISOString()
    });
  }, [apiCall, currentRestaurant, user]);

  const updateRequest = useCallback((id, status) => {
    return apiCall('requests', 'PATCH', { status }, { id: `eq.${id}` });
  }, [apiCall]);

  // Dashboard
  const getDashboard = useCallback(async () => {
    const restaurants = ['POZOBLANCO', 'FUERTEVENTURA', 'GRAN_CAPITAN'];
    const stats = {};
    for (const rest of restaurants) {
      const products = await apiCall('products', 'GET', null, {
        select: '*',
        restaurant: `eq.${rest}`
      });
      const prods = Array.isArray(products) ? products : [];
      stats[rest] = {
        totalProducts: prods.length,
        lowStock: prods.filter(p => p.stock <= p.min_stock).length
      };
    }
    const pendingTransfers = await apiCall('transfers', 'GET', null, {
      select: 'id',
      status: 'eq.pendiente'
    });
    return {
      restaurants: stats,
      pendingTransfers: Array.isArray(pendingTransfers) ? pendingTransfers.length : 0
    };
  }, [apiCall]);

  const getReports = useCallback((range) => {
    return apiCall('movements', 'GET', null, {
      select: '*,products(name,category)',
      restaurant: `eq.${currentRestaurant}`,
      type: 'eq.salida',
      order: 'created_at.desc'
    });
  }, [apiCall, currentRestaurant]);

  // -------------------- PROVEEDORES --------------------
  const getSuppliers = useCallback(() => {
    return apiCall('suppliers', 'GET', null, {
      select: '*',
      order: 'name.asc'
    });
  }, [apiCall]);

  const addSupplier = useCallback((data) => {
    if (user?.role !== 'ADMIN') throw new Error('Solo administradores');
    return apiCall('suppliers', 'POST', {
      ...data,
      created_at: new Date().toISOString()
    });
  }, [apiCall, user]);

  const updateSupplier = useCallback((id, data) => {
    if (user?.role !== 'ADMIN') throw new Error('Solo administradores');
    return apiCall('suppliers', 'PATCH', data, { id: `eq.${id}` });
  }, [apiCall, user]);

  const deleteSupplier = useCallback((id) => {
    if (user?.role !== 'ADMIN') throw new Error('Solo administradores');
    return apiCall('suppliers', 'DELETE', null, { id: `eq.${id}` });
  }, [apiCall, user]);
  // ----------------------------------------------------

  const restaurantNames = {
    POZOBLANCO: '🍽️ Godeo Pozoblanco',
    FUERTEVENTURA: '🏖️ Godeo Fuerteventura',
    GRAN_CAPITAN: '🏛️ Godeo Gran Capitán'
  };

  const value = {
    user, login, logout, switchRestaurant, currentRestaurant,
    isAdmin: user?.role === 'ADMIN',
    restaurantName: restaurantNames[currentRestaurant],
    getProducts, addProduct, updateProduct, deleteProduct,
    getMovements, addMovement,
    getTransfers, addTransfer, completeTransfer,
    getRequests, addRequest, updateRequest,
    getDashboard, getReports,
    getSuppliers, addSupplier, updateSupplier, deleteSupplier
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
