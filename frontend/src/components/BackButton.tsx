// BackButton.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

type BackButtonProps = {
  size?: number;
  className?: string;
};

const BackButton: React.FC<BackButtonProps> = ({ size = 34, className }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`py-[3px] hover:brightness-50 ${className || ''}`}
    >
      <ChevronLeft
        className={`text-gray-700`}
        style={{ width: size, height: size }}
      />
    </button>
  );
};

export default BackButton;
