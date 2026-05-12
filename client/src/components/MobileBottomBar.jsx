import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  CubeIcon,
  QrCodeIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

const MobileBottomBar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  // Configurar los botones según el rol
  const navItems = isAdmin
    ? [
        { path: '/dashboard', icon: HomeIcon, label: 'Inicio' },
        { path: '/inventory', icon: CubeIcon, label: 'Inventario' },
        { path: '', icon: QrCodeIcon, label: 'Escanear', action: 'scan', central: true },
        { path: '/transfers', icon: ArrowsRightLeftIcon, label: 'Transf.' },
        { path: '', icon: Bars3Icon, label: 'Más', action: 'menu' },
      ]
    : [
        { path: '/dashboard', icon: HomeIcon, label: 'Inicio' },
        { path: '/inventory', icon: CubeIcon, label: 'Inventario' },
        { path: '', icon: QrCodeIcon, label: 'Escanear', action: 'scan', central: true },
        { path: '/requests', icon: ClipboardDocumentListIcon, label: 'Pedidos' },
        { path: '', icon: Bars3Icon, label: 'Más', action: 'menu' },
      ];

  const isActive = (path) => location.pathname === path;

  const handleAction = (item) => {
    if (item.action === 'scan') {
      // Disparar evento global para abrir el escáner
      window.dispatchEvent(new CustomEvent('openScanner'));
    } else if (item.action === 'menu') {
      onMenuToggle();
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleAction(item)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              item.central ? 'relative -mt-4' : ''
            } ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}`}
          >
            {item.central ? (
              <div className="absolute -top-2 bg-blue-600 text-white rounded-full p-3 shadow-lg">
                <item.icon className="h-6 w-6" />
              </div>
            ) : (
              <item.icon className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomBar;
