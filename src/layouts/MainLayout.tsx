import React from 'react';
import BottomNavbar from '@/components/BottomNavBar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto h-full max-w-[1024px] max-h-[1366px] bg-white flex flex-col">
      <main className="flex-1 p-4 pb-20 overflow-y-auto sm:px-6">
        {children}
      </main>

      <BottomNavbar />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
