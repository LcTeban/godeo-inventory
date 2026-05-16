import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
      <motion.div
        className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/50 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🍴</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Godeo</h1>
          <p className="text-slate-500 dark:text-gray-300 mt-2 text-sm">Gestión de Inventario</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all"
              placeholder="admin@godeo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition shadow-sm shadow-orange-200 dark:shadow-orange-900/50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Credenciales de prueba */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Credenciales de prueba:</p>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-gray-300 flex items-center gap-1.5">
              <span className="w-5 h-5 bg-slate-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-[10px]">📧</span>
              admin@godeo.com
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-300 flex items-center gap-1.5">
              <span className="w-5 h-5 bg-slate-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-[10px]">🔑</span>
              Godeo2024
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
