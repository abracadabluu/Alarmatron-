import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40">
      <button
        onClick={onClick}
        aria-label="Set new alarm"
        title="Set new alarm"
        className="group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#3366cc] text-white shadow-xl hover:bg-[#2a4b8d] active:scale-95 transition-all focus:outline-none focus:ring-3 focus:ring-[#3366cc]/40 border-2 border-white"
      >
        <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
      </button>
    </div>
  );
};
