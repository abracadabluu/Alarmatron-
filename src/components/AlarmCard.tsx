import React from 'react';
import { Alarm } from '../types';
import { formatRepetition, formatTimeDisplay } from '../utils/alarmUtils';

interface AlarmCardProps {
  alarm: Alarm;
  use24h: boolean;
  onToggle: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
}

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  use24h,
  onToggle,
  onEdit,
}) => {
  const { timeStr, period } = formatTimeDisplay(alarm.hour, alarm.minute, use24h);
  const repetitionText = formatRepetition(alarm.days);

  return (
    <div
      className={`border transition-all duration-150 flex items-center justify-between px-4 py-3 sm:py-3.5 bg-white select-none ${
        alarm.enabled
          ? 'border-[#a2a9b1] shadow-2xs'
          : 'border-[#c8ccd1] bg-[#fafafa] opacity-80'
      }`}
    >
      {/* Information area: time, label, repetition */}
      <div
        onClick={() => onEdit(alarm)}
        className="flex-1 min-w-0 pr-3 cursor-pointer space-y-0.5"
      >
        {/* Time */}
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-wiki-serif text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
              alarm.enabled ? 'text-[#202122]' : 'text-[#72777d]'
            }`}
          >
            {timeStr}
          </span>
          {period && (
            <span
              className={`text-xs font-sans font-medium uppercase tracking-wider ${
                alarm.enabled ? 'text-[#202122]' : 'text-[#72777d]'
              }`}
            >
              {period}
            </span>
          )}
        </div>

        {/* Label */}
        <div
          className={`font-wiki-serif text-sm font-semibold truncate ${
            alarm.enabled ? 'text-[#202122]' : 'text-[#54595d]'
          }`}
        >
          {alarm.label || 'Alarm'}
        </div>

        {/* Repetition */}
        <div className="text-xs text-[#54595d] font-sans truncate">
          {repetitionText}
        </div>
      </div>

      {/* On / Off Button on horizontal level */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(alarm.id);
          }}
          className={`min-w-[64px] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs border transition-colors select-none text-center ${
            alarm.enabled
              ? 'bg-[#14866d] text-white border-[#14866d] hover:bg-[#0f6c58] active:bg-[#0c5344]'
              : 'bg-white text-[#202122] border-[#a2a9b1] hover:bg-[#f8f9fa] active:bg-[#eaecf0]'
          }`}
        >
          {alarm.enabled ? 'on' : 'off'}
        </button>
      </div>
    </div>
  );
};
