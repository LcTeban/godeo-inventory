import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      setCurrentRestaurant(user.restaurant);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Error al iniciar sesión' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
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
    restaurantName: restaurantNames[currentRestaurant]
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
