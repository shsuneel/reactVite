// src/components/Button.tsx
import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary' 
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';

  return (
    <button 
      className={`${baseClasses} ${variantClasses}`}
      onClick={onClick}
      data-testid="button"
    >
      {children}
    </button>
  );
};

export default Button;