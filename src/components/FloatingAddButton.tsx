import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:left-auto sm:translate-x-0 sm:right-6">
      <button
        onClick={onClick}
        aria-label="Add Alarm"
        className="group flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#3366cc] text-white shadow-lg hover:bg-[#2a4b8d] active:scale-98 transition-all focus:outline-none focus:ring-3 focus:ring-[#3366cc]/40 border border-[#2a4b8d] font-sans text-sm font-semibold tracking-wide"
      >
        <Plus className="w-5 h-5 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
        <span>Add Alarm</span>
      </button>
    </div>
  );
};
