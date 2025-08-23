import React from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="p-4
      mx-auto h-full
      max-w-[1024px] max-h-[1366px]  // for tablets/phones
      bg-white shadow-md
    "
    >
      {children}
    </main>
  );
}
