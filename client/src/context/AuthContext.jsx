import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
const SUPABASE_URL = 'https://fshypzqmuyctllmbzdnh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaHlwenFtdXljdGxsbWJ6ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTQ1NDMsImV4cCI6MjA5MzA3MDU0M30.m4c4A6J7K8JvGI69eHBpfUtGMMdD4jVGvfjz_NmQdHE';

const AuthProvider = ({ children }) => {
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

  // Función universal para llamar a Supabase
  const apiCall = useCallback(async (table, method, data = null, filters = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token || SUPABASE_KEY}`
    };

    let url = `${SUPABASE_URL}/rest/v1/${table}`;

    // Agregar filtros
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    if (queryParams.toString()) url += `?${queryParams.toString()}`;

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

  // Login
  const login = async (email, password) => {
    try {
      const users = await apiCall('users', 'GET', null, {
        select: '*',
        email: `eq.${email}`
      });
      
      const foundUser = users[0];
      
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
      
      // Token simple (solo para identificación, no JWT real)
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
    apiCall
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };
