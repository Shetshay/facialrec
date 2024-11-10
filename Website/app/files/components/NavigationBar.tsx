// /files/components/NavigationBar.tsx
import React from 'react';
import { FaArrowLeft } from "react-icons/fa";

interface NavigationBarProps {
  currentPath: string;
  handleNavigateBack: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  currentPath,
  handleNavigateBack,
}) => {
  if (!currentPath) return null;

  return (
    <div className="flex items-center space-x-2 mb-4">
      <button
        onClick={handleNavigateBack}
        className="p-2 hover:bg-gray-700 rounded-full"
      >
        <FaArrowLeft className="text-white" />
      </button>
      <span className="text-white">Current path: {currentPath}</span>
    </div>
  );
};

export default NavigationBar;
