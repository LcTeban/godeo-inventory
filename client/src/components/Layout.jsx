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
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import { useState } from 'react';

const Layout = () => {
  const { user, logout, currentRestaurant, switchRestaurant, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  { name: 'Reportes', href: '/reports', icon: ChartBarIcon },
];

  const currentRest = restaurants.find(r => r.id === currentRestaurant);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER MOBILE */}
      <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{currentRest?.icon}</span>
          <span className="font-semibold">{currentRest?.name}</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* SIDEBAR MOBILE */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <div className="bg-white w-64 h-full p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">🍴 Godeo</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">{user?.name}</p>
              <p className="text-xs text-purple-600 font-semibold">{user?.role}</p>
            </div>

            {isAdmin && (
              <select
                value={currentRestaurant}
                onChange={(e) => { switchRestaurant(e.target.value); setSidebarOpen(false); }}
                className="w-full p-2 border rounded-lg mb-4"
              >
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                ))}
              </select>
            )}

            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="w-full mt-6 flex items-center px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <span className="mr-3">🚪</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <div className="hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0">
        <div className="w-64 bg-white shadow-lg flex flex-col">
          <div className="p-6">
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
          </div>
          
          <nav className="flex-1 mt-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100"
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <span className="mr-3">🚪</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="lg:pl-64">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
