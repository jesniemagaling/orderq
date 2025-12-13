import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

export default function SidebarItem({
  to,
  label,
  icon,
  isActive,
}: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive: navIsActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md transition
        ${
          isActive ?? navIsActive
            ? 'text-primary font-semibold'
            : 'text-gray-800 hover:bg-gray-100 font-medium'
        }`
      }
    >
      {icon} {label}
    </NavLink>
  );
}
