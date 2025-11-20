import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export default function SidebarItem({ to, icon, label }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-md px-4 py-2 text-md font-medium transition ${
          isActive
            ? 'text-[#820D17] font-semibold'
            : 'text-gray-900 hover:text-[#820D17]'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
