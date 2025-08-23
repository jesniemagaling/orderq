import React from 'react';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img
        src="/src/assets/orderq-logo.svg"
        alt="OrderQ Logo"
        className="w-30 h-30 sm:w-50 sm:h-50"
      />
      <span className="text-xl font-extrabold sm:text-3xl text-primary">
        OrderQ
      </span>
    </div>
  );
}
