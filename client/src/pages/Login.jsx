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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🍴</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Godeo</h1>
          <p className="text-slate-500 mt-2 text-sm">Gestión de Inventario</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 focus:bg-white outline-none transition-all"
              placeholder="admin@godeo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 focus:bg-white outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition shadow-sm shadow-orange-200"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Credenciales de prueba */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <p className="text-sm font-medium text-slate-700 mb-2">Credenciales de prueba:</p>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px]">📧</span>
              admin@godeo.com
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px]">🔑</span>
              Godeo2024
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
