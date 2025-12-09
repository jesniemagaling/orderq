import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export default function Button({
  children,
  fullWidth = false,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-5 py-3 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-[#6e0b13] focus:ring-[#820D17]/40',
    secondary: 'text-gray-800 hover:border-primary border border-transparent',
    outline:
      'border border-primary text-primary hover:bg-primary hover:text-white focus:ring-[#820D17]/40',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        rounded-lg font-medium
        ${fullWidth ? 'w-full' : ''} 
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
