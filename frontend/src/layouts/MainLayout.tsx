import React from 'react';
import BottomNavbar from '@/components/BottomNavBar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation } from 'react-router-dom';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  const hideNavbarRoutes = ['/session-expired'];

  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="relative mx-auto h-full max-w-[1024px] max-h-[1366px] bg-white flex flex-col">
      <main className="flex-1 p-4 pb-20 sm:px-6">{children}</main>

      {!shouldHideNavbar && <BottomNavbar />}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
