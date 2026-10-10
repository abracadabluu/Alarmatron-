import React, { useEffect, useState } from 'react';
import { Bell, Volume2, Moon, CheckCircle, Music } from 'lucide-react';
import { Alarm } from '../types';
import { formatTimeDisplay } from '../utils/alarmUtils';
import { startAlarmLoop } from '../utils/audioEngine';

interface RingingModalProps {
  alarm: Alarm;
  use24h: boolean;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const RingingModal: React.FC<RingingModalProps> = ({
  alarm,
  use24h,
  onDismiss,
  onSnooze,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Start audio loop (plays custom audio or fallback chime) + vibration
    const stopAudio = startAlarmLoop(alarm.toneData, alarm.vibrate);
    const timer = setInterval(() => setNow(new Date()), 1000);

    return () => {
      stopAudio();
      clearInterval(timer);
    };
  }, [alarm.toneData, alarm.vibrate]);

  const { timeStr, period } = formatTimeDisplay(now.getHours(), now.getMinutes(), use24h);
  const seconds = now.getSeconds();
  const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#202122]/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white border border-[#a2a9b1] shadow-2xl overflow-hidden text-center">
        {/* Top Header */}
        <div className="bg-[#d33d33] text-white px-4 py-3 flex items-center justify-center gap-2">
          <Bell className="w-5 h-5 animate-bounce" />
          <span className="font-bold text-xs uppercase tracking-wider">
            Alarm Ringing
          </span>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Time Display */}
          <div>
            <div className="font-wiki-serif text-5xl sm:text-6xl font-bold text-[#202122] tabular-nums tracking-tight">
              {timeStr}
              {period ? (
                <span className="text-xl font-sans font-medium text-[#54595d] ml-2">
                  :{secondsStr} {period}
                </span>
              ) : (
                <span className="text-xl font-sans font-medium text-[#54595d] ml-2">
                  :{secondsStr}
                </span>
              )}
            </div>
          </div>

          {/* Label Card */}
          <div className="bg-[#f8f9fa] border border-[#c8ccd1] p-4 rounded-xs">
            <h2 className="text-xl font-bold font-wiki-serif text-[#202122]">
              {alarm.label || 'Alarm'}
            </h2>
            <div className="mt-1 text-xs text-[#54595d] flex items-center justify-center gap-1.5 truncate">
              <Music className="w-3.5 h-3.5 text-[#3366cc] shrink-0" />
              <span className="truncate">{alarm.toneName || 'Default Chime'}</span>
            </div>
          </div>

          {/* Action Buttons: Snooze & Dismiss */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onSnooze(alarm.snoozeMinutes || 10)}
              className="py-3 px-4 bg-[#f8f9fa] hover:bg-[#eaecf0] active:bg-[#c8ccd1] text-[#202122] border border-[#a2a9b1] rounded-xs font-semibold text-sm flex items-center justify-center gap-2 transition-colors min-h-[48px]"
            >
              <Moon className="w-4 h-4 text-[#3366cc]" />
              Snooze ({alarm.snoozeMinutes || 10}m)
            </button>

            <button
              onClick={onDismiss}
              className="py-3 px-4 bg-[#d33d33] hover:bg-[#b32424] active:bg-[#8f1919] text-white rounded-xs font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-xs min-h-[48px]"
            >
              <CheckCircle className="w-4 h-4" />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
