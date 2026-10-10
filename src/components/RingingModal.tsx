import React, { useEffect, useState } from 'react';
import { Bell, Volume2, Moon, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alarm } from '../types';
import { formatTime12h } from '../utils/alarmUtils';
import { startAlarmAudioLoop } from '../utils/audioEngine';

interface RingingModalProps {
  alarm: Alarm;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const RingingModal: React.FC<RingingModalProps> = ({
  alarm,
  onDismiss,
  onSnooze,
}) => {
  const [now, setNow] = useState(new Date());

  // Trigger audio loop on mount and cleanup on unmount
  useEffect(() => {
    const stopAudio = startAlarmAudioLoop(alarm.sound, alarm.vibrate);
    const timer = setInterval(() => setNow(new Date()), 1000);

    return () => {
      stopAudio();
      clearInterval(timer);
    };
  }, [alarm.sound, alarm.vibrate]);

  const { timeStr, period } = formatTime12h(now.getHours(), now.getMinutes());
  const seconds = now.getSeconds();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#202122]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-white border-2 border-[#d33d33] shadow-2xl overflow-hidden">
        {/* Wikipedia Urgent Notification Bar */}
        <div className="bg-[#d33d33] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 animate-bounce" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Urgent Notice: Alarm Triggered
            </span>
          </div>
          <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded-xs">
            {alarm.sound.toUpperCase()}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 text-center space-y-6">
          {/* Wikipedia Encyclopedia Article citation style */}
          <div className="text-[11px] text-[#54595d] uppercase tracking-widest font-semibold border-b border-[#a2a9b1] pb-1">
            Alarmatron Scheduled Event
          </div>

          {/* Time Display */}
          <div>
            <div className="font-wiki-serif text-5xl sm:text-6xl font-bold text-[#202122] tabular-nums tracking-tight">
              {timeStr}
              <span className="text-2xl font-sans font-medium text-[#54595d] ml-2">
                :{seconds < 10 ? `0${seconds}` : seconds} {period}
              </span>
            </div>
            <div className="mt-2 text-xs text-[#54595d]">
              {now.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* Alarm Label */}
          <div className="bg-[#f8f9fa] border border-[#a2a9b1] p-4 rounded-xs">
            <div className="text-xs text-[#54595d] uppercase tracking-wider mb-1">
              Active Reminder
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-wiki-serif text-[#202122]">
              {alarm.label || 'Scheduled Alarm'}
            </h2>
          </div>

          {/* Audio Indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-[#14866d]">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Chime tone ringing continuously · Press Dismiss or Snooze</span>
          </div>

          {/* Action Buttons: Snooze and Dismiss */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onSnooze(alarm.snoozeMinutes || 10)}
              className="py-3 px-4 bg-[#f8f9fa] hover:bg-[#eaecf0] active:bg-[#c8ccd1] text-[#202122] border border-[#a2a9b1] rounded-xs font-semibold text-sm flex items-center justify-center gap-2 transition-colors min-h-[48px]"
            >
              <Moon className="w-4 h-4 text-[#3366cc]" />
              Snooze ({alarm.snoozeMinutes || 10} min)
            </button>

            <button
              onClick={onDismiss}
              className="py-3 px-4 bg-[#d33d33] hover:bg-[#b32424] active:bg-[#8f1919] text-white rounded-xs font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm min-h-[48px]"
            >
              <CheckCircle className="w-4 h-4" />
              Dismiss Alarm
            </button>
          </div>
        </div>

        {/* Footer info note */}
        <div className="bg-[#eaecf0] px-4 py-2 border-t border-[#c8ccd1] text-[11px] text-[#54595d] text-center">
          Tap anywhere or use the buttons above to control this temporal event.
        </div>
      </div>
    </div>
  );
};
