import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  CubeIcon,
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

const MobileBottomBar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  // Cinco botones fijos para todos los roles, con Movimientos como tercera opción
  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Inicio' },
    { path: '/inventory', icon: CubeIcon, label: 'Inventario' },
    { path: '/movements', icon: ArrowPathIcon, label: 'Movim.' },
    { path: '/transfers', icon: ArrowsRightLeftIcon, label: 'Transf.' },
    { path: '', icon: Bars3Icon, label: 'Más', action: 'menu' },
  ];

  const isActive = (path) => {
    if (path === '') return false; // El botón "Más" nunca está activo
    return location.pathname === path;
  };

  const handleAction = (item) => {
    if (item.action === 'menu') {
      onMenuToggle();
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-white/30 bg-white/80 backdrop-blur-lg shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02),0_-2px_4px_-2px_rgba(0,0,0,0.03)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center h-14 px-1">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <button
              key={index}
              onClick={() => handleAction(item)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
                active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <item.icon
                className={`w-6 h-6 transition-all duration-200 ${
                  active ? 'scale-110' : 'scale-100'
                }`}
              />
              {/* Indicador de punto activo */}
              <span
                className={`mt-0.5 w-1 h-1 rounded-full transition-all duration-200 ${
                  active ? 'bg-blue-600 opacity-100' : 'bg-transparent opacity-0'
                }`}
              />
              <span className="text-[10px] tracking-wider font-medium leading-none mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomBar;
