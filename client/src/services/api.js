import toast from 'react-hot-toast';

const SUPABASE_URL = 'https://fshypzqmuyctllmbzdnh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzaHlwenFtdXljdGxsbWJ6ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTQ1NDMsImV4cCI6MjA5MzA3MDU0M30.m4c4A6J7K8JvGI69eHBpfUtGMMdD4jVGvfjz_NmQdHE';

/**
 * Wrapper global para llamadas a la API REST de Supabase.
 * Maneja automáticamente errores HTTP y de red.
 */
export const apiCall = async (table, method = 'GET', data = null, filters = {}) => {
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

  try {
    const response = await fetch(url, config);

    // Error 401: redirigir al login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedRestaurant');
      window.location.href = '/godeo-inventory/login';
      throw new Error('Sesión expirada. Inicia sesión nuevamente.');
    }

    // Error 500: error genérico del servidor
    if (response.status >= 500) {
      toast.error('Error del servidor. Intenta nuevamente más tarde.');
      throw new Error('Error interno del servidor');
    }

    // Error 400/403/404 etc.
    if (!response.ok) {
      let errorMsg = 'Error desconocido';
      try {
        const err = await response.json();
        errorMsg = err.message || errorMsg;
      } catch (e) {}
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Respuesta exitosa
    if (response.status === 204 || method === 'DELETE') return { success: true };
    try {
      return await response.json();
    } catch (e) {
      return { success: true };
    }
  } catch (error) {
    // Error de red (sin conexión)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      toast.error('Sin conexión a internet. Verifica tu red.');
    }
    // Si no es un error que ya hayamos manejado, lo propagamos
    if (!error.message.includes('Sesión expirada') && !error.message.includes('Error interno') && !error.message.includes('Error desconocido')) {
      toast.error('Error de conexión');
    }
    throw error;
  }
};
