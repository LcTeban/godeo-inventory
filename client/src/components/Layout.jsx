import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  CubeIcon, 
  ArrowPathIcon, 
  TruckIcon,
  ArrowsRightLeftIcon,
  ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout, currentRestaurant, switchRestaurant, isAdmin, restaurantName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const restaurants = [
    { id: 'POZOBLANCO', name: 'Pozoblanco', icon: '🍽️' },
    { id: 'FUERTEVENTURA', name: 'Fuerteventura', icon: '🏖️' },
    { id: 'GRAN_CAPITAN', name: 'Gran Capitán', icon: '🏛️' }
  ];

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Inventario', href: '/inventory', icon: CubeIcon },
    { name: 'Movimientos', href: '/movements', icon: ArrowPathIcon },
    { name: 'Transferencias', href: '/transfers', icon: ArrowsRightLeftIcon },
    { name: 'Proveedores', href: '/suppliers', icon: TruckIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <div className="w-64 bg-white shadow-lg flex flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">🍴 Godeo</h1>
            <p className="text-sm text-gray-600 mt-1">Sistema de Inventario</p>
            
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Restaurante Actual
              </label>
              {isAdmin ? (
                <select
                  value={currentRestaurant}
                  onChange={(e) => switchRestaurant(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.icon} {r.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  {restaurantName}
                </div>
              )}
            </div>
            
            <div className="mt-3 text-sm">
              <p className="text-gray-600">{user?.name}</p>
              <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                {user?.role}
              </span>
            </div>
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
              className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
