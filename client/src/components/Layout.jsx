import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  CubeIcon,
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  TruckIcon,
  BookOpenIcon,
  FolderIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import MobileBottomBar from './MobileBottomBar';

const Layout = () => {
  const { user, logout, currentRestaurant, switchRestaurant, isAdmin, notificationsEnabled, enableNotifications } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️', color: 'orange' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️', color: 'blue' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️', color: 'purple' }
  ];

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Inventario', href: '/inventory', icon: CubeIcon },
    { name: 'Movimientos', href: '/movements', icon: ArrowPathIcon },
    { name: 'Transferencias', href: '/transfers', icon: ArrowsRightLeftIcon },
    { name: 'Pedidos', href: '/requests', icon: ClipboardDocumentListIcon },
    { name: 'Recetas', href: '/recipes', icon: BookOpenIcon },
    { name: 'Proveedores', href: '/suppliers', icon: TruckIcon },
    { name: 'Reportes', href: '/reports', icon: ChartBarIcon, adminOnly: true },
    { name: 'Categorías', href: '/categories', icon: FolderIcon, adminOnly: true },
  ];

  const currentRest = restaurants.find(r => r.id === currentRestaurant);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header en tablet (lg:hidden) – solo se muestra si NO estamos en móvil */}
      {!isMobile && (
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
          <button onClick={toggleSidebar} className="p-2">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentRest?.icon}</span>
            <span className="font-semibold">{currentRest?.name}</span>
          </div>
          <button onClick={enableNotifications} className="p-2">
            {notificationsEnabled ? (
              <BellAlertIcon className="h-6 w-6 text-green-600" />
            ) : (
              <BellIcon className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>
      )}

      {/* Sidebar Mobile (overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="bg-white w-64 h-full flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="text-xl font-bold">🍴 Godeo</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 bg-gray-50">
              <p className="text-sm text-gray-600">{user?.name}</p>
              <p className="text-xs text-purple-600 font-semibold">{user?.role}</p>
            </div>

            {isAdmin && (
              <div className="px-4 pt-2">
                <select
                  value={currentRestaurant}
                  onChange={(e) => { switchRestaurant(e.target.value); setSidebarOpen(false); }}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <div className="px-4 pt-2">
                <button
                  onClick={enableNotifications}
                  className="w-full p-2 border rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-100"
                >
                  {notificationsEnabled ? (
                    <BellAlertIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <BellIcon className="h-4 w-4 text-gray-600" />
                  )}
                  {notificationsEnabled ? 'Notificaciones ON' : 'Activar Notificaciones'}
                </button>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto px-2 py-2">
              {navigation.map(item => {
                if (item.adminOnly && !isAdmin) return null;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <span className="mr-3">🚪</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop (siempre visible en lg) – solo si NO estamos en móvil */}
      {!isMobile && (
        <div className="hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0">
          <div className="w-64 bg-white shadow-lg flex flex-col h-full">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold">🍴 Godeo</h1>
              <p className="text-sm text-gray-600 mt-1">{user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                {user?.role}
              </span>

              {isAdmin && (
                <select
                  value={currentRestaurant}
                  onChange={(e) => switchRestaurant(e.target.value)}
                  className="w-full mt-4 p-2 border rounded-lg text-sm"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                  ))}
                </select>
              )}

              {isAdmin && (
                <button
                  onClick={enableNotifications}
                  className="w-full mt-2 p-2 border rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-100"
                >
                  {notificationsEnabled ? (
                    <BellAlertIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <BellIcon className="h-4 w-4 text-gray-600" />
                  )}
                  {notificationsEnabled ? 'Notificaciones ON' : 'Activar Notificaciones'}
                </button>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-2">
              {navigation.map(item => {
                if (item.adminOnly && !isAdmin) return null;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <span className="mr-3">🚪</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className={`${!isMobile ? 'lg:pl-64' : 'pb-20'}`}>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </div>

      {/* Barra inferior en móvil */}
      {isMobile && (
        <MobileBottomBar onMenuToggle={toggleSidebar} />
      )}
    </div>
  );
};

export default Layout;
