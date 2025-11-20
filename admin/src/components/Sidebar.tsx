import { BarChart2, ClipboardList, Layers, LogOut, Table } from 'lucide-react';
import SidebarItem from './SidebarItem';

interface SidebarProps {
  role: 'admin' | 'cashier' | 'kitchen';
}

export default function Sidebar({ role }: SidebarProps) {
  const commonClasses =
    'flex flex-col justify-between h-screen w-56 border-r bg-white px-4 py-6';

  const adminLinks = [
    { to: '/admin/overview', label: 'Overview', icon: <BarChart2 size={20} /> },
    { to: '/admin/orders', label: 'Orders', icon: <ClipboardList size={20} /> },
    { to: '/admin/menu', label: 'Menu', icon: <Layers size={20} /> },
  ];

  const cashierLinks = [
    { to: '/cashier/tables', label: 'Tables', icon: <Table size={20} /> },
    {
      to: '/cashier/orders',
      label: 'Orders',
      icon: <ClipboardList size={20} />,
    },
  ];

  const kitchenLinks = [
    {
      to: '/kitchen/orders',
      label: 'Orders',
      icon: <ClipboardList size={20} />,
    },
  ];

  const links =
    role === 'admin'
      ? adminLinks
      : role === 'cashier'
      ? cashierLinks
      : kitchenLinks;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('auth');
    sessionStorage.clear();
    window.location.href = '/';
  };

  return (
    <aside className={commonClasses}>
      {/* Logo */}
      <div>
        <div className="flex items-center gap-2 mb-8">
          <img src="/orderq-logo.svg" alt="OrderQ" className="h-8 w-8" />
          <span className="font-semibold text-lg">OrderQ</span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-4">
          {links.map((link) => (
            <SidebarItem
              key={link.to}
              to={link.to}
              icon={link.icon}
              label={link.label}
            />
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-md text-gray-900 hover:text-[#820D17] mt-auto"
      >
        <LogOut size={20} className="text-[#820D17]" />
        Logout
      </button>
    </aside>
  );
}
