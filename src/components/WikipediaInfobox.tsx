import React from 'react';
import { Clock, ShieldAlert, Cpu, Smartphone, FileCode2, Volume2, CheckCircle2 } from 'lucide-react';
import { Alarm } from '../types';
import { findEarliestAlarm, formatTime12h, formatTimeUntil } from '../utils/alarmUtils';
import { playChimeNote } from '../utils/audioEngine';

interface WikipediaInfoboxProps {
  alarms: Alarm[];
  currentTime: Date;
  onOpenApkGuide: () => void;
  onTriggerTestAlarm: (alarm: Alarm) => void;
}

export const WikipediaInfobox: React.FC<WikipediaInfoboxProps> = ({
  alarms,
  currentTime,
  onOpenApkGuide,
  onTriggerTestAlarm,
}) => {
  const earliest = findEarliestAlarm(alarms, currentTime);
  const activeCount = alarms.filter((a) => a.enabled).length;

  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();
  const currentPeriod = currentHours >= 12 ? 'PM' : 'AM';
  const displayHours = currentHours % 12 === 0 ? 12 : currentHours % 12;
  const timeFormatted = `${displayHours < 10 ? '0' : ''}${displayHours}:${
    currentMinutes < 10 ? '0' : ''
  }${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;

  return (
    <aside
      id="wiki-infobox"
      className="w-full lg:w-80 shrink-0 border border-[#a2a9b1] bg-[#f8f9fa] text-xs text-[#202122] shadow-2xs self-start"
    >
      {/* Infobox Header */}
      <div className="bg-[#eaecf0] border-b border-[#a2a9b1] px-3 py-2 text-center">
        <h2 className="text-sm font-bold font-wiki-serif text-[#202122] tracking-wide">
          Alarmatron
        </h2>
        <p className="text-[11px] text-[#54595d] italic">Temporal Notification Engine</p>
      </div>

      {/* Live Master Clock Display */}
      <div className="p-3 bg-white border-b border-[#c8ccd1] text-center">
        <div className="text-[11px] uppercase tracking-wider text-[#54595d] font-semibold mb-1">
          Current System Time
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-wiki-serif tabular-nums text-[#202122] flex items-center justify-center gap-1">
          <span>{timeFormatted}</span>
          <span className="text-sm font-sans font-medium text-[#54595d]">{currentPeriod}</span>
        </div>
        <div className="text-[11px] text-[#54595d] mt-1">
          {currentTime.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Next Alarm Banner */}
      <div className="p-3 bg-[#f8f9fa] border-b border-[#c8ccd1]">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#54595d] mb-1.5 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-[#3366cc]" />
          Next Alarm Status
        </div>
        {earliest ? (
          <div className="bg-white border border-[#c8ccd1] p-2.5 rounded-xs">
            <div className="flex items-baseline justify-between">
              <span className="font-wiki-serif text-lg font-bold text-[#202122] tabular-nums">
                {formatTime12h(earliest.alarm.hour, earliest.alarm.minute).timeStr}{' '}
                <span className="text-xs font-sans font-normal text-[#54595d]">
                  {formatTime12h(earliest.alarm.hour, earliest.alarm.minute).period}
                </span>
              </span>
              <span className="text-[11px] font-medium text-[#14866d] bg-[#e8f6f3] px-1.5 py-0.5 border border-[#a2d8ce]">
                {formatTimeUntil(earliest.nextDate, currentTime)}
              </span>
            </div>
            <div className="text-xs font-medium text-[#202122] mt-1 truncate">
              {earliest.alarm.label || 'Alarm'}
            </div>
            <div className="mt-2 pt-2 border-t border-[#f0f2f5] flex items-center justify-between">
              <span className="text-[10px] text-[#54595d]">
                Sound: {earliest.alarm.sound.toUpperCase()}
              </span>
              <button
                onClick={() => onTriggerTestAlarm(earliest.alarm)}
                className="text-[11px] text-[#3366cc] hover:underline font-medium"
              >
                Test Ring Now →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#c8ccd1] p-2.5 rounded-xs text-[#54595d] text-center italic">
            No active alarms scheduled. Toggle an alarm on below or press '+' to create one.
          </div>
        )}
      </div>

      {/* Wikipedia Infobox Data Table */}
      <table className="w-full text-left border-collapse">
        <tbody>
          <tr className="border-b border-[#eaecf0]">
            <th className="px-3 py-1.5 font-bold text-[#54595d] w-28 bg-[#f8f9fa] align-top text-[11px]">
              Active Count
            </th>
            <td className="px-3 py-1.5 bg-white text-[11px]">
              <span className="font-semibold text-[#14866d]">{activeCount}</span> of {alarms.length} alarms
            </td>
          </tr>
          <tr className="border-b border-[#eaecf0]">
            <th className="px-3 py-1.5 font-bold text-[#54595d] bg-[#f8f9fa] align-top text-[11px]">
              Audio Engine
            </th>
            <td className="px-3 py-1.5 bg-white text-[11px]">
              Web Audio Synthesizer (100% offline)
            </td>
          </tr>
          <tr className="border-b border-[#eaecf0]">
            <th className="px-3 py-1.5 font-bold text-[#54595d] bg-[#f8f9fa] align-top text-[11px]">
              Target OS
            </th>
            <td className="px-3 py-1.5 bg-white text-[11px]">
              Android (APK) & Mobile Web
            </td>
          </tr>
          <tr className="border-b border-[#eaecf0]">
            <th className="px-3 py-1.5 font-bold text-[#54595d] bg-[#f8f9fa] align-top text-[11px]">
              Build Tool
            </th>
            <td className="px-3 py-1.5 bg-white text-[11px]">
              Capacitor 6 + Gradle
            </td>
          </tr>
          <tr className="border-b border-[#eaecf0]">
            <th className="px-3 py-1.5 font-bold text-[#54595d] bg-[#f8f9fa] align-top text-[11px]">
              GitHub Workflow
            </th>
            <td className="px-3 py-1.5 bg-white text-[11px]">
              <button
                onClick={onOpenApkGuide}
                className="text-[#3366cc] hover:underline font-mono text-[10px] break-all text-left"
              >
                build-debug-apk.yml
              </button>
            </td>
          </tr>
          <tr>
            <th className="px-3 py-1.5 font-bold text-[#54595d] bg-[#f8f9fa] align-top text-[11px]">
              Output Format
            </th>
            <td className="px-3 py-1.5 bg-white text-[11px]">
              <code>app-debug.apk</code> (Current)<br />
              <span className="text-[#54595d]">Signed APK & AAB (Phase 2)</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Infobox Quick Actions */}
      <div className="p-2.5 bg-[#eaecf0] border-t border-[#a2a9b1] flex flex-col gap-1.5">
        <button
          onClick={onOpenApkGuide}
          className="w-full py-1.5 px-2 bg-white hover:bg-[#f8f9fa] border border-[#a2a9b1] text-xs font-medium text-[#202122] rounded-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
        >
          <FileCode2 className="w-3.5 h-3.5 text-[#3366cc]" />
          View GitHub APK Pipeline (.yml)
        </button>
      </div>
    </aside>
  );
};
