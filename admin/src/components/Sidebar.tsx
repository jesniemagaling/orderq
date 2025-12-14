import {
  BarChart2,
  ClipboardList,
  Layers,
  LogOut,
  Table,
  TrendingUp,
} from 'lucide-react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useEffect } from 'react';
import SidebarItem from './SidebarItem';
import SalesSubItem from './SalesSubItem';

interface SidebarProps {
  role: 'admin' | 'cashier' | 'kitchen';
}

const SALES_TABS = [
  { to: '/admin/sales/daily-income', label: 'Daily Income' },
  { to: '/admin/sales/sales-per-day', label: 'Sales Per Day' },
  { to: '/admin/sales/sales-summary', label: 'Sales Summary' },
  { to: '/admin/sales/orders-per-table', label: 'Orders Per Table' },
  { to: '/admin/sales/orders-per-day', label: 'Orders Per Day' },
  { to: '/admin/sales/item-sales', label: 'Item Sales / Top Selling' },
  { to: '/admin/sales/category-sales', label: 'Category Sales' },
  { to: '/admin/sales/payment-method', label: 'Payment Method Breakdown' },
  { to: '/admin/sales/hourly-heatmap', label: 'Hourly Heatmap' },
];

export default function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isSalesRoute = location.pathname.startsWith('/admin/sales');
  const isSalesMainActive = location.pathname === '/admin/sales';

  const links =
    role === 'admin'
      ? [
          {
            to: '/admin/overview',
            label: 'Overview',
            icon: <BarChart2 size={20} />,
          },
          {
            to: '/admin/sales',
            label: 'Sales',
            icon: <TrendingUp size={20} />,
          },
          {
            to: '/admin/orders',
            label: 'Orders',
            icon: <ClipboardList size={20} />,
          },
          { to: '/admin/menu', label: 'Menu', icon: <Layers size={20} /> },
        ]
      : role === 'cashier'
      ? [
          { to: '/cashier/tables', label: 'Tables', icon: <Table size={20} /> },
          {
            to: '/cashier/orders',
            label: 'Orders',
            icon: <ClipboardList size={20} />,
          },
        ]
      : [
          {
            to: '/kitchen/orders',
            label: 'Orders',
            icon: <ClipboardList size={20} />,
          },
        ];

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  return (
    <aside className="flex flex-col justify-between w-56 h-screen px-4 py-6 bg-white border-r">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <img src="/orderq-logo.svg" alt="OrderQ" className="w-8 h-8" />
          <span className="text-lg font-semibold">OrderQ</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2" role="menu">
          {links.map((link) => {
            const isSales = link.label === 'Sales';

            if (!isSales) {
              return (
                <SidebarItem
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  label={link.label}
                />
              );
            }

            return (
              <div key="sales">
                {/* Main Sales link */}
                <SidebarItem
                  to={link.to}
                  icon={link.icon}
                  label={link.label}
                  isActive={isSalesMainActive || isSalesRoute}
                />

                {/* Sales sub-menu */}
                {isSalesRoute && (
                  <div
                    className="ml-8 space-y-1 transition-all duration-300"
                    role="menu"
                  >
                    {SALES_TABS.map((tab) => (
                      <SalesSubItem
                        key={tab.to}
                        to={tab.to}
                        label={tab.label}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-md text-gray-900 hover:text-[#820D17]"
      >
        <LogOut size={20} className="text-[#820D17]" />
        Logout
      </button>
    </aside>
  );
}
