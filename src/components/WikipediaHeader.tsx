import React from 'react';
import { Clock, Search, Github, Smartphone, Bell, HelpCircle, Volume2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { playChimeNote } from '../utils/audioEngine';

interface WikipediaHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenApkGuide: () => void;
  onQuickTestSound: () => void;
  activeAlarmsCount: number;
  totalAlarmsCount: number;
}

export const WikipediaHeader: React.FC<WikipediaHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenApkGuide,
  onQuickTestSound,
  activeAlarmsCount,
  totalAlarmsCount,
}) => {
  return (
    <header className="border-b border-[#a2a9b1] bg-white">
      {/* Top Utility Strip */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#54595d]">
        <div className="flex items-center gap-4">
          <span className="font-medium text-[#202122] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#3366cc]" />
            Alarmatron Encyclopedia
          </span>
          <span className="hidden sm:inline text-[#c8ccd1]">|</span>
          <span className="hidden sm:inline">
            Status: <span className="text-[#14866d] font-semibold">{activeAlarmsCount} active</span> ({totalAlarmsCount} total)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onQuickTestSound}
            title="Test audio synthesizer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#202122] bg-[#f8f9fa] hover:bg-[#eaecf0] border border-[#c8ccd1] rounded-sm transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#3366cc]" />
            <span className="hidden xs:inline">Test Audio</span>
          </button>

          <button
            onClick={onOpenApkGuide}
            title="View GitHub Actions Android APK configuration"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#202122] bg-[#f8f9fa] hover:bg-[#eaecf0] border border-[#c8ccd1] rounded-sm transition-colors"
          >
            <Github className="w-3.5 h-3.5 text-[#202122]" />
            <span>GitHub APK (.yml)</span>
          </button>

          <PWAInstallButton />
        </div>
      </div>

      {/* Main Wikipedia Header Brand Area */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-[#f0f2f5]">
        <div className="flex items-start gap-3">
          {/* Wikipedia-styled emblem badge */}
          <div className="w-11 h-11 shrink-0 bg-[#f8f9fa] border border-[#a2a9b1] rounded-xs flex items-center justify-center text-[#202122] shadow-2xs">
            <div className="relative">
              <span className="font-wiki-serif text-2xl font-bold leading-none select-none">W</span>
              <Bell className="w-3 h-3 text-[#3366cc] absolute -top-1 -right-2" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl sm:text-3xl font-normal font-wiki-serif tracking-tight text-[#202122]">
                Alarmatron
              </h1>
              <span className="text-xs text-[#54595d] font-sans italic hidden sm:inline">
                /əˈlɑːrm.ə.trɒn/
              </span>
            </div>
            <p className="text-xs text-[#54595d] mt-0.5 font-sans">
              From Wikipedia, the free encyclopedia of timekeeping and scheduled wakefulness
            </p>
          </div>
        </div>

        {/* Clean Wikipedia search box */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#72777d]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search alarms (label, time)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#a2a9b1] rounded-sm focus:outline-none focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc] placeholder-[#72777d]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-[#72777d] hover:text-[#202122]"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Classic Wikipedia Article Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between border-t border-[#c8ccd1] bg-[#f8f9fa]">
        <div className="flex items-center">
          <button className="px-3 py-2 text-xs font-semibold text-[#202122] border-b-2 border-[#3366cc] bg-white -mb-px">
            Article
          </button>
          <button
            onClick={onOpenApkGuide}
            className="px-3 py-2 text-xs text-[#54595d] hover:text-[#3366cc] border-b-2 border-transparent transition-colors"
          >
            APK Build Spec
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('wiki-infobox');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-2 text-xs text-[#54595d] hover:text-[#3366cc] border-b-2 border-transparent transition-colors hidden sm:block"
          >
            Infobox Data
          </button>
        </div>

        <div className="text-[11px] text-[#72777d] py-1 hidden md:block">
          Page last modified: <span className="font-mono text-[#202122]">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </header>
  );
};
