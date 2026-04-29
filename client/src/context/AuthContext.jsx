import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// 🔻 REEMPLAZA ESTA URL POR LA TUYA (la que te dio Apps Script)
const API_URL = 'https://script.google.com/macros/s/AKfycbyrLTPusv3McWjtcygzjr-dEH4vvn3eJQGY56kh2pVoOnEq3x83hwCXodlOaloMg4mc/exec';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);

  // Al cargar, recuperar sesión guardada
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

  // Función universal para llamar a la API
  const apiCall = useCallback(async (action, data = {}, restaurantOverride = null) => {
    const token = localStorage.getItem('token');
    const restaurant = restaurantOverride || currentRestaurant || 
                       (user ? user.restaurant : 'POZOBLANCO');
    
    const params = new URLSearchParams();
    params.append('action', action);
    if (token && action !== 'login') params.append('token', token);
    if (restaurant) params.append('restaurant', restaurant);
    if (Object.keys(data).length > 0) {
      params.append('data', JSON.stringify(data));
    }
    
    const response = await fetch(`${API_URL}?${params.toString()}`);
    const result = await response.json();
    
    if (!response.ok || result.error) {
      throw new Error(result.error || 'Error en la API');
    }
    
    return result;
  }, [currentRestaurant, user]);

  const login = async (email, password) => {
    try {
      const result = await apiCall('login', { email, password }, 'POZOBLANCO');
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setCurrentRestaurant(result.user.restaurant);
        return { success: true };
      }
      return { success: false, error: result.error };
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
