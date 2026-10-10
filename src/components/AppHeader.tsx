import React from 'react';
import { Menu } from 'lucide-react';

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#a2a9b1]">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Top-left: App Title in Wikipedia serif style */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-normal font-wiki-serif tracking-tight text-[#202122] select-none">
            Alarmatron
          </h1>
        </div>

        {/* Top-right: Hamburger menu button navigating to Settings */}
        <button
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
          className="p-2 -mr-2 text-[#202122] hover:bg-[#f8f9fa] active:bg-[#eaecf0] rounded-xs border border-transparent hover:border-[#c8ccd1] transition-colors"
        >
          <Menu className="w-5 h-5 text-[#202122]" />
        </button>
      </div>
    </header>
  );
};
