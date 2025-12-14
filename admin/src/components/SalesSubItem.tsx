import { NavLink } from 'react-router-dom';

interface SalesSubItemProps {
  to: string;
  label: string;
}

export default function SalesSubItem({ to, label }: SalesSubItemProps) {
  const handleClick = () => {
    localStorage.setItem('lastSalesTab', to);
  };

  return (
    <NavLink
      to={to}
      end
      onClick={handleClick}
      className={({ isActive }) =>
        `block rounded-md px-2 py-2 text-sm transition
    ${
      isActive
        ? 'text-primary font-semibold'
        : 'text-gray-800 hover:bg-gray-100 font-medium'
    }`
      }
    >
      {label}
    </NavLink>
  );
}
