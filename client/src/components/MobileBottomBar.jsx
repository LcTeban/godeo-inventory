import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  CubeIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

const MobileBottomBar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = isAdmin
    ? [
        { path: '/dashboard', icon: HomeIcon, label: 'Inicio' },
        { path: '/inventory', icon: CubeIcon, label: 'Inventario' },
        { path: '', icon: PlusIcon, label: 'Añadir', action: 'add', central: true },
        { path: '/transfers', icon: ArrowsRightLeftIcon, label: 'Transf.' },
        { path: '', icon: Bars3Icon, label: 'Más', action: 'menu' },
      ]
    : [
        { path: '/dashboard', icon: HomeIcon, label: 'Inicio' },
        { path: '/inventory', icon: CubeIcon, label: 'Inventario' },
        { path: '', icon: PlusIcon, label: 'Añadir', action: 'add', central: true },
        { path: '/requests', icon: ClipboardDocumentListIcon, label: 'Pedidos' },
        { path: '', icon: Bars3Icon, label: 'Más', action: 'menu' },
      ];

  const isActive = (path) => location.pathname === path;

  const handleAction = (item) => {
    if (item.action === 'add') {
      window.dispatchEvent(new CustomEvent('openAddProduct'));
    } else if (item.action === 'menu') {
      onMenuToggle();
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center h-16 relative">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <button
              key={index}
              onClick={() => handleAction(item)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
                item.central ? 'relative -mt-5' : ''
              } ${active ? 'text-blue-600' : 'text-gray-500'}`}
            >
              {item.central ? (
                <div className="absolute -top-1 bg-blue-600 text-white rounded-full p-3 shadow-lg shadow-blue-600/30">
                  <item.icon className="h-6 w-6" />
                </div>
              ) : (
                <item.icon className={`h-6 w-6 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
              )}
              {!item.central && (
                <span className="text-[11px] mt-1 font-medium">{item.label}</span>
              )}
              {/* El botón central NO muestra texto, solo el ícono */}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomBar;
