import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export default function Button({
  children,
  fullWidth,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={` ${
        fullWidth ? 'w-full' : ''
      } rounded-lg bg-primary px-4 py-2 font-medium text-white transition-all duration-150 hover:bg-[#6e0b13] focus:outline-none focus:ring-2 focus:ring-[#820D17]/40 ${className} `}
    >
      {children}
    </button>
  );
}
