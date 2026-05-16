import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  BellAlertIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import MobileBottomBar from './MobileBottomBar';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  const { user, logout, currentRestaurant, switchRestaurant, isAdmin, notificationsEnabled, enableNotifications } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useLockBodyScroll(sidebarOpen && isMobile);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <SunIcon className="h-5 w-5" />;
    if (theme === 'dark') return <MoonIcon className="h-5 w-5" />;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? (
      <MoonIcon className="h-5 w-5" />
    ) : (
      <SunIcon className="h-5 w-5" />
    );
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
    // En Layout.jsx, el div principal:
<div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          success: {
            style: { background: '#065f46', color: '#ecfdf5' },
            iconTheme: { primary: '#34d399', secondary: '#ecfdf5' },
          },
          error: {
            style: { background: '#991b1b', color: '#fef2f2' },
            iconTheme: { primary: '#f87171', secondary: '#fef2f2' },
          },
        }}
      />
      {!isMobile && (
        <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
          <button onClick={toggleSidebar} className="p-2">
            <Bars3Icon className="h-6 w-6 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentRest?.icon}</span>
            <span className="font-semibold dark:text-white">{currentRest?.name}</span>
          </div>
          <button onClick={enableNotifications} className="p-2">
            {notificationsEnabled ? (
              <BellAlertIcon className="h-6 w-6 text-green-600" />
            ) : (
              <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div
            className="bg-white dark:bg-gray-800 w-64 h-full flex flex-col fixed right-0 top-0 shadow-xl animate-slide-in-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 flex justify-between items-center border-b dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-bold dark:text-white">🍴 Godeo</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="h-6 w-6 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <p className="text-sm text-slate-600 dark:text-gray-400">{user?.name}</p>
              <p className="text-xs text-purple-600 font-semibold">{user?.role}</p>
            </div>

            {isAdmin && (
              <div className="px-4 pt-2 flex-shrink-0">
                <select
                  value={currentRestaurant}
                  onChange={(e) => { switchRestaurant(e.target.value); setSidebarOpen(false); }}
                  className="w-full p-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <div className="px-4 pt-2 flex-shrink-0">
                <button
                  onClick={enableNotifications}
                  className="w-full p-2 border rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                  {notificationsEnabled ? (
                    <BellAlertIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <BellIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                  {notificationsEnabled ? 'Notificaciones ON' : 'Activar Notificaciones'}
                </button>
              </div>
            )}

            <div className="px-4 pt-2 flex-shrink-0">
              <button
                onClick={toggleTheme}
                className="w-full p-2 border rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                {getThemeIcon()}
                {theme === 'light' ? 'Modo Claro' : theme === 'dark' ? 'Modo Oscuro' : 'Automático'}
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-2">
              {navigation.map(item => {
                if (item.adminOnly && !isAdmin) return null;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center px-3 py-3 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
              <div className="h-4" />
            </nav>

            <div className="border-t dark:border-gray-700 p-4 flex-shrink-0 pb-[calc(64px+env(safe-area-inset-bottom))]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
              >
                <span className="mr-3">🚪</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {!isMobile && (
        <div className="hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0">
          <div className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col h-full">
            <div className="p-6 border-b dark:border-gray-700 flex-shrink-0">
              <h1 className="text-2xl font-bold dark:text-white">🍴 Godeo</h1>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">{user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                {user?.role}
              </span>

              {isAdmin && (
                <select
                  value={currentRestaurant}
                  onChange={(e) => switchRestaurant(e.target.value)}
                  className="w-full mt-4 p-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                  ))}
                </select>
              )}

              {isAdmin && (
                <button
                  onClick={enableNotifications}
                  className="w-full mt-2 p-2 border rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                  {notificationsEnabled ? (
                    <BellAlertIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <BellIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                  {notificationsEnabled ? 'Notificaciones ON' : 'Activar Notificaciones'}
                </button>
              )}

              <button
                onClick={toggleTheme}
                className="w-full mt-2 p-2 border rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                {getThemeIcon()}
                {theme === 'light' ? 'Modo Claro' : theme === 'dark' ? 'Modo Oscuro' : 'Automático'}
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-2">
              {navigation.map(item => {
                if (item.adminOnly && !isAdmin) return null;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center px-3 py-3 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t dark:border-gray-700 p-4 flex-shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
              >
                <span className="mr-3">🚪</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${!isMobile ? 'lg:pl-64' : 'pb-20'}`}>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </div>

      {isMobile && (
        <MobileBottomBar onMenuToggle={toggleSidebar} />
      )}
    </div>
  );
};

export default Layout;
