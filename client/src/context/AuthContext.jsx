import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
const SUPABASE_URL = 'https://fshypzqmuyctllmbzdnh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaHlwenFtdXljdGxsbWJ6ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTQ1NDMsImV4cCI6MjA5MzA3MDU0M30.m4c4A6J7K8JvGI69eHBpfUtGMMdD4jVGvfjz_NmQdHE';

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

  // Función universal para llamar a la API de Supabase
  const apiCall = useCallback(async (table, method, data = null, filters = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    };

    let url = `${SUPABASE_URL}/rest/v1/${table}`;

    const queryParams = new URLSearchParams();
    if (filters.select) queryParams.append('select', filters.select);
    if (filters.id) queryParams.append('id', filters.id);
    if (filters.restaurant) queryParams.append('restaurant', filters.restaurant);
    if (filters.email) queryParams.append('email', filters.email);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.order) queryParams.append('order', filters.order);
    if (filters.limit) queryParams.append('limit', filters.limit);
    Object.entries(filters).forEach(([key, value]) => {
      if (!['select', 'id', 'restaurant', 'email', 'status', 'order', 'limit'].includes(key)) {
        queryParams.append(key, value);
      }
    });
    const queryString = queryParams.toString();
    if (queryString) url += `?${queryString}`;

    const config = { method, headers };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (method === 'DELETE' && response.ok) {
      return { success: true };
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Error en Supabase');
    }
    return result;
  }, []);

  // ============================================
  // AUTENTICACIÓN
  // ============================================
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
    if (user?.role === 'ADMIN') {
      setCurrentRestaurant(restaurant);
    }
  };

  // ============================================
  // FUNCIONES ESPECÍFICAS
  // ============================================
  
  const getProducts = useCallback(() => {
    return apiCall('products', 'GET', null, {
      select: '*',
      restaurant: `eq.${currentRestaurant}`,
      order: 'name.asc'
    });
  }, [apiCall, currentRestaurant]);

  const addProduct = useCallback((data) => {
    return apiCall('products', 'POST', {
      ...data,
      restaurant: currentRestaurant,
      created_at: new Date().toISOString()
    });
  }, [apiCall, currentRestaurant]);

  const updateProduct = useCallback((id, data) => {
    return apiCall('products', 'PATCH', data, { id: `eq.${id}` });
  }, [apiCall]);

  const deleteProduct = useCallback((id) => {
    return apiCall('products', 'DELETE', null, { id: `eq.${id}` });
  }, [apiCall]);

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

  const getTransfers = useCallback(() => {
    return apiCall('transfers', 'GET', null, {
      select: '*,products(name,unit),users(name)',
      order: 'created_at.desc'
    });
  }, [apiCall]);

  const addTransfer = useCallback((data) => {
    return apiCall('transfers', 'POST', {
      ...data,
      from_restaurant: currentRestaurant,
      user_id: user?.id,
      status: 'pendiente',
      created_at: new Date().toISOString()
    });
  }, [apiCall, currentRestaurant, user]);

  const completeTransfer = useCallback((id) => {
    return apiCall('transfers', 'PATCH', {
      status: 'completado',
      completed_at: new Date().toISOString()
    }, { id: `eq.${id}` });
  }, [apiCall]);

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

  const restaurantNames = {
    POZOBLANCO: '🍽️ Godeo Pozoblanco',
    FUERTEVENTURA: '🏖️ Godeo Fuerteventura',
    GRAN_CAPITAN: '🏛️ Godeo Gran Capitán'
  };

  const value = {
    user,
    login,
    logout,
    switchRestaurant,
    currentRestaurant,
    isAdmin: user?.role === 'ADMIN',
    restaurantName: restaurantNames[currentRestaurant],
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getMovements,
    addMovement,
    getTransfers,
    addTransfer,
    completeTransfer,
    getRequests,
    addRequest,
    updateRequest,
    getDashboard,
    getReports
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
