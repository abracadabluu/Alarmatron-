import React from 'react';
import { Bell, Volume2, Edit3, Trash2, Copy, Check, Clock } from 'lucide-react';
import { Alarm } from '../types';
import { formatRepetition, formatTime12h, getNextTriggerDate, formatTimeUntil } from '../utils/alarmUtils';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
  onDuplicate: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
  onTestRing: (alarm: Alarm) => void;
  currentTime: Date;
}

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
  onTestRing,
  currentTime,
}) => {
  const { timeStr, period } = formatTime12h(alarm.hour, alarm.minute);
  const repetitionText = formatRepetition(alarm.days);
  const nextTrigger = alarm.enabled ? getNextTriggerDate(alarm, currentTime) : null;

  return (
    <article
      className={`border transition-all duration-150 relative bg-white ${
        alarm.enabled
          ? 'border-[#a2a9b1] shadow-2xs'
          : 'border-[#eaecf0] bg-[#fafafa] opacity-75'
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Section: Time, Label & Unboxed Metadata */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-wiki-serif text-3xl sm:text-4xl font-bold tabular-nums tracking-tight ${
                alarm.enabled ? 'text-[#202122]' : 'text-[#72777d]'
              }`}
            >
              {timeStr}
            </span>
            <span
              className={`text-sm sm:text-base font-sans font-medium uppercase tracking-wider ${
                alarm.enabled ? 'text-[#202122]' : 'text-[#72777d]'
              }`}
            >
              {period}
            </span>

            {/* Next Ring Countdown if enabled */}
            {alarm.enabled && nextTrigger && (
              <span className="text-xs text-[#14866d] font-sans font-medium bg-[#e8f6f3] px-2 py-0.5 border border-[#a2d8ce] rounded-xs ml-2 hidden xs:inline-block">
                rings {formatTimeUntil(nextTrigger, currentTime)}
              </span>
            )}
          </div>

          {/* Alarm Label */}
          <div className="flex items-center gap-2">
            <h3
              className={`font-wiki-serif text-base sm:text-lg font-semibold truncate ${
                alarm.enabled ? 'text-[#202122]' : 'text-[#54595d]'
              }`}
            >
              {alarm.label || 'Alarm'}
            </h3>
          </div>

          {/* Unboxed Metadata (Zero-Pill Discipline) with Middot Separators */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#54595d]">
            <span className="font-medium text-[#202122]">{repetitionText}</span>
            <span aria-hidden="true" className="text-[#a2a9b1]">·</span>
            <span>Tone: <span className="capitalize">{alarm.sound}</span></span>
            <span aria-hidden="true" className="text-[#a2a9b1]">·</span>
            <span>Snooze: {alarm.snoozeMinutes}m</span>
            {alarm.vibrate && (
              <>
                <span aria-hidden="true" className="text-[#a2a9b1]">·</span>
                <span>Vibrate on</span>
              </>
            )}
          </div>

          {alarm.enabled && nextTrigger && (
            <div className="text-[11px] text-[#14866d] xs:hidden font-medium">
              Next trigger: {formatTimeUntil(nextTrigger, currentTime)}
            </div>
          )}
        </div>

        {/* Right Section: On/Off Toggle Button + Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0f2f5]">
          {/* Quick Action Icons */}
          <div className="flex items-center gap-1 text-[#54595d]">
            <button
              onClick={() => onTestRing(alarm)}
              title="Test this alarm ring now"
              className="p-2 hover:text-[#3366cc] hover:bg-[#f8f9fa] border border-transparent hover:border-[#c8ccd1] rounded-xs transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onEdit(alarm)}
              title="Edit alarm settings"
              className="p-2 hover:text-[#202122] hover:bg-[#f8f9fa] border border-transparent hover:border-[#c8ccd1] rounded-xs transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDuplicate(alarm)}
              title="Duplicate alarm"
              className="p-2 hover:text-[#202122] hover:bg-[#f8f9fa] border border-transparent hover:border-[#c8ccd1] rounded-xs transition-colors hidden xs:block"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDelete(alarm.id)}
              title="Delete alarm"
              className="p-2 hover:text-[#d33d33] hover:bg-[#fef6f6] border border-transparent hover:border-[#f5c2c2] rounded-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Dedicated On/Off Toggle (Same Button) */}
          <button
            type="button"
            role="switch"
            aria-checked={alarm.enabled}
            onClick={() => onToggle(alarm.id)}
            title={alarm.enabled ? 'Turn Alarm OFF' : 'Turn Alarm ON'}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-xs font-sans text-xs font-semibold transition-all select-none min-h-[44px] min-w-[90px] justify-center ${
              alarm.enabled
                ? 'bg-[#e8f6f3] border-[#14866d] text-[#14866d] hover:bg-[#daf0ec] active:bg-[#cbeae4]'
                : 'bg-[#f8f9fa] border-[#a2a9b1] text-[#72777d] hover:bg-[#eaecf0] active:bg-[#dfe2e6]'
            }`}
          >
            {/* Visual Slider Switch Indicator */}
            <div
              className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors ${
                alarm.enabled ? 'bg-[#14866d]' : 'bg-[#c8ccd1]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                  alarm.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="tracking-wide">
              {alarm.enabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
};
