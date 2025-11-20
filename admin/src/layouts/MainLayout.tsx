import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ScreenSize from '../components/ScreenSize';

export default function MainLayout() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'admin' | 'cashier' | 'kitchen' | null>(
    null
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') as
      | 'admin'
      | 'cashier'
      | 'kitchen'
      | null;

    // Redirect to login if no token or role
    if (!token || !storedRole) {
      navigate('/');
      return;
    }

    setRole(storedRole);
  }, [navigate]);

  // Prevent rendering layout until role is verified
  if (!role) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ScreenSize />

      <div className="fixed top-0 left-0 h-screen w-56 bg-white border-r shadow-sm">
        <Sidebar role={role} />
      </div>

      <main className="flex-1 ml-56 p-6 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
