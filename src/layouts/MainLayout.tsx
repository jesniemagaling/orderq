import React from 'react';
import BottomNavbar from '@/components/BottomNavBar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto h-full max-w-[1024px] max-h-[1366px] bg-white shadow-md flex flex-col">
      <main className="flex-1 p-4 pb-20 overflow-y-auto">{children}</main>

      <BottomNavbar />
    </div>
  );
}
