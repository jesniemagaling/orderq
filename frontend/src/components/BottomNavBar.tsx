import { Link, useLocation } from 'react-router-dom';

export default function BottomNavbar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '/icons/home.svg' },
    { path: '/search', label: 'Search', icon: '/icons/search.svg' },
    { path: '/menu', label: 'Menu', icon: '/icons/menu.svg' },
    { path: '/orders', label: 'Orders', icon: '/icons/orders.svg' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-10 w-full bg-white border-t border-gray-200 shadow-md">
      <ul className="flex items-center justify-around max-w-[390px] mx-auto p-4 text-red-900">
        {navItems.map((item) => (
          <li key={item.path} className="flex flex-col items-center">
            <Link to={item.path} className="flex flex-col items-center">
              <img
                src={item.icon}
                alt={item.label}
                className={`w-8 h-8 mb-1 ${
                  location.pathname === item.path ? 'opacity-100' : 'opacity-60'
                }`}
              />
              <span
                className={`text-xs ${
                  location.pathname === item.path
                    ? 'font-extrabold text-bg-primary-500'
                    : 'opacity-60'
                }`}
              >
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
