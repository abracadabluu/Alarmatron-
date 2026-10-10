import React, { useState } from 'react';
import { ArrowLeft, Clock, Volume2, Bell, Check, Sparkles, Smartphone } from 'lucide-react';
import { Alarm, SoundType } from '../types';
import { DAY_NAMES, FULL_DAY_NAMES } from '../utils/alarmUtils';
import { playChimeNote } from '../utils/audioEngine';

interface SetAlarmViewProps {
  initialAlarm?: Alarm | null;
  onSave: (alarmData: Omit<Alarm, 'id' | 'createdAt'>, existingId?: string) => void;
  onCancel: () => void;
}

const SOUND_OPTIONS: { id: SoundType; name: string; description: string }[] = [
  { id: 'bell', name: 'Westminster Bell', description: 'Harmonic resonant bell chimes' },
  { id: 'digital', name: 'Digital Electronic', description: 'Classic dual-tone rapid alert pulses' },
  { id: 'marimba', name: 'Crystal Marimba', description: 'Warm wooden organic acoustic tones' },
  { id: 'harp', name: 'Gentle Harp', description: 'Soothing ascending acoustic arpeggio' },
  { id: 'radar', name: 'Radar Pulse', description: 'High-visibility frequency sweep' },
];

const PRESET_LABELS = [
  'Morning Awakening',
  'Daily Standup & Sync',
  'Medication Schedule',
  'Physical Exercise',
  'Deep Work Session',
  'Evening Wind Down',
];

export const SetAlarmView: React.FC<SetAlarmViewProps> = ({
  initialAlarm,
  onSave,
  onCancel,
}) => {
  // Convert 24h to 12h display state
  const initHour = initialAlarm ? initialAlarm.hour : 7;
  const initMinute = initialAlarm ? initialAlarm.minute : 0;
  const initPeriod: 'AM' | 'PM' = initHour >= 12 ? 'PM' : 'AM';
  const init12Hour = initHour % 12 === 0 ? 12 : initHour % 12;

  const [hour12, setHour12] = useState<number>(init12Hour);
  const [minute, setMinute] = useState<number>(initMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initPeriod);
  const [label, setLabel] = useState<string>(initialAlarm ? initialAlarm.label : '');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialAlarm ? [...initialAlarm.days] : [1, 2, 3, 4, 5] // default weekdays
  );
  const [sound, setSound] = useState<SoundType>(initialAlarm ? initialAlarm.sound : 'bell');
  const [vibrate, setVibrate] = useState<boolean>(initialAlarm ? initialAlarm.vibrate : true);
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(
    initialAlarm ? initialAlarm.snoozeMinutes : 10
  );

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort((a, b) => a - b));
    }
  };

  const setShortcut = (preset: 'all' | 'weekdays' | 'weekends' | 'none') => {
    switch (preset) {
      case 'all':
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
        break;
      case 'weekdays':
        setSelectedDays([1, 2, 3, 4, 5]);
        break;
      case 'weekends':
        setSelectedDays([0, 6]);
        break;
      case 'none':
        setSelectedDays([]);
        break;
    }
  };

  const handleSave = () => {
    // Convert 12h + period back to 24h
    let h24 = hour12 % 12;
    if (period === 'PM') {
      h24 += 12;
    }

    onSave(
      {
        hour: h24,
        minute,
        label: label.trim() || 'Alarm',
        days: selectedDays,
        enabled: true,
        sound,
        vibrate,
        snoozeMinutes,
      },
      initialAlarm ? initialAlarm.id : undefined
    );
  };

  const adjustHour = (delta: number) => {
    let next = hour12 + delta;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    setHour12(next);
  };

  const adjustMinute = (delta: number) => {
    let next = minute + delta;
    if (next >= 60) next = 0;
    if (next < 0) next = 59;
    setMinute(next);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-in fade-in duration-150">
      {/* Wikipedia Article-Style Navigation Header */}
      <div className="border-b border-[#a2a9b1] pb-3 mb-6">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs text-[#3366cc] hover:underline font-medium mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Alarms List
        </button>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl sm:text-3xl font-normal font-wiki-serif text-[#202122]">
            {initialAlarm ? 'Edit Alarm Configuration' : 'Set New Alarm'}
          </h2>
          <span className="text-xs text-[#54595d] font-sans">
            Section 1.1 · Alarmatron
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {/* Section 1: Time Selection */}
        <div className="border border-[#a2a9b1] bg-white p-5 sm:p-6 shadow-2xs">
          <div className="border-b border-[#eaecf0] pb-2 mb-5 flex items-center justify-between">
            <h3 className="font-wiki-serif text-base font-bold text-[#202122] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#3366cc]" />
              1. Scheduled Time
            </h3>
            <span className="text-xs text-[#54595d]">
              Target: {hour12 < 10 ? `0${hour12}` : hour12}:{minute < 10 ? `0${minute}` : minute} {period}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-4 bg-[#f8f9fa] border border-[#c8ccd1]">
            {/* Hour Block */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-1">
                Hours
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustHour(-1)}
                  className="w-8 h-8 rounded-xs border border-[#a2a9b1] bg-white text-[#202122] hover:bg-[#eaecf0] active:bg-[#c8ccd1] text-base font-bold flex items-center justify-center select-none"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={hour12}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 12) setHour12(val);
                  }}
                  className="w-16 h-14 text-3xl font-bold font-wiki-serif text-center bg-white border border-[#a2a9b1] rounded-xs tabular-nums text-[#202122] focus:outline-none focus:border-[#3366cc]"
                />
                <button
                  type="button"
                  onClick={() => adjustHour(1)}
                  className="w-8 h-8 rounded-xs border border-[#a2a9b1] bg-white text-[#202122] hover:bg-[#eaecf0] active:bg-[#c8ccd1] text-base font-bold flex items-center justify-center select-none"
                >
                  +
                </button>
              </div>
            </div>

            <span className="text-3xl font-bold font-wiki-serif text-[#a2a9b1] -mt-1 hidden sm:inline select-none">
              :
            </span>

            {/* Minute Block */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-1">
                Minutes
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustMinute(-1)}
                  className="w-8 h-8 rounded-xs border border-[#a2a9b1] bg-white text-[#202122] hover:bg-[#eaecf0] active:bg-[#c8ccd1] text-base font-bold flex items-center justify-center select-none"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minute < 10 ? `0${minute}` : minute}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 0 && val <= 59) setMinute(val);
                  }}
                  className="w-16 h-14 text-3xl font-bold font-wiki-serif text-center bg-white border border-[#a2a9b1] rounded-xs tabular-nums text-[#202122] focus:outline-none focus:border-[#3366cc]"
                />
                <button
                  type="button"
                  onClick={() => adjustMinute(1)}
                  className="w-8 h-8 rounded-xs border border-[#a2a9b1] bg-white text-[#202122] hover:bg-[#eaecf0] active:bg-[#c8ccd1] text-base font-bold flex items-center justify-center select-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* AM / PM Segmented Control */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-1">
                Period
              </span>
              <div className="flex rounded-xs border border-[#a2a9b1] overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setPeriod('AM')}
                  className={`px-4 h-14 text-sm font-bold tracking-wider transition-colors min-w-[54px] ${
                    period === 'AM'
                      ? 'bg-[#3366cc] text-white'
                      : 'text-[#202122] hover:bg-[#eaecf0]'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('PM')}
                  className={`px-4 h-14 text-sm font-bold tracking-wider transition-colors min-w-[54px] border-l border-[#a2a9b1] ${
                    period === 'PM'
                      ? 'bg-[#3366cc] text-white'
                      : 'text-[#202122] hover:bg-[#eaecf0]'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Quick minute offsets */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-[#54595d] text-[11px]">Quick adjustments:</span>
            {[0, 15, 30, 45].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinute(m)}
                className={`px-2 py-0.5 border text-xs rounded-xs transition-colors ${
                  minute === m
                    ? 'border-[#3366cc] bg-[#f0f4fc] text-[#3366cc] font-semibold'
                    : 'border-[#c8ccd1] bg-white text-[#54595d] hover:bg-[#eaecf0]'
                }`}
              >
                :{m < 10 ? `0${m}` : m}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Repetition Schedule */}
        <div className="border border-[#a2a9b1] bg-white p-5 sm:p-6 shadow-2xs">
          <div className="border-b border-[#eaecf0] pb-2 mb-4 flex items-center justify-between">
            <h3 className="font-wiki-serif text-base font-bold text-[#202122]">
              2. Repetition Schedule
            </h3>
            <span className="text-xs text-[#54595d]">
              {selectedDays.length === 0
                ? 'Plays Once'
                : selectedDays.length === 7
                ? 'Every Single Day'
                : `${selectedDays.length} days active`}
            </span>
          </div>

          {/* Day of Week Buttons */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-4">
            {DAY_NAMES.map((name, idx) => {
              const isSelected = selectedDays.includes(idx);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  title={FULL_DAY_NAMES[idx]}
                  className={`py-3 sm:py-3.5 border rounded-xs text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all select-none min-h-[48px] ${
                    isSelected
                      ? 'border-[#14866d] bg-[#e8f6f3] text-[#14866d] ring-1 ring-[#14866d]'
                      : 'border-[#c8ccd1] bg-[#f8f9fa] text-[#54595d] hover:bg-[#eaecf0]'
                  }`}
                >
                  <span className="text-sm font-bold font-wiki-serif">{name.charAt(0)}</span>
                  <span className="text-[10px] hidden xs:inline">{name}</span>
                </button>
              );
            })}
          </div>

          {/* Shortcut buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#eaecf0]">
            <span className="text-[11px] text-[#54595d]">Presets:</span>
            <button
              type="button"
              onClick={() => setShortcut('weekdays')}
              className="px-2.5 py-1 text-xs border border-[#c8ccd1] bg-[#f8f9fa] hover:bg-[#eaecf0] text-[#202122] rounded-xs"
            >
              Weekdays (Mon–Fri)
            </button>
            <button
              type="button"
              onClick={() => setShortcut('weekends')}
              className="px-2.5 py-1 text-xs border border-[#c8ccd1] bg-[#f8f9fa] hover:bg-[#eaecf0] text-[#202122] rounded-xs"
            >
              Weekends (Sat–Sun)
            </button>
            <button
              type="button"
              onClick={() => setShortcut('all')}
              className="px-2.5 py-1 text-xs border border-[#c8ccd1] bg-[#f8f9fa] hover:bg-[#eaecf0] text-[#202122] rounded-xs"
            >
              Every Day
            </button>
            <button
              type="button"
              onClick={() => setShortcut('none')}
              className="px-2.5 py-1 text-xs border border-[#c8ccd1] bg-[#f8f9fa] hover:bg-[#eaecf0] text-[#54595d] rounded-xs"
            >
              Once (No repeat)
            </button>
          </div>
        </div>

        {/* Section 3: Label & Purpose */}
        <div className="border border-[#a2a9b1] bg-white p-5 sm:p-6 shadow-2xs">
          <div className="border-b border-[#eaecf0] pb-2 mb-4">
            <h3 className="font-wiki-serif text-base font-bold text-[#202122]">
              3. Alarm Label & Identification
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5">
              Label Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Morning Awakening, Take Medicine, Standup"
              className="w-full px-3 py-2 text-sm bg-white border border-[#a2a9b1] rounded-xs focus:outline-none focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]"
            />
          </div>

          <div className="mt-3">
            <span className="text-[11px] text-[#54595d] block mb-1.5">Suggested encyclopedic titles:</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LABELS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLabel(preset)}
                  className="px-2 py-0.5 text-xs text-[#3366cc] bg-[#f0f4fc] hover:bg-[#e1ecfc] border border-[#c0d4f6] rounded-xs transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Sound, Vibration & Snooze */}
        <div className="border border-[#a2a9b1] bg-white p-5 sm:p-6 shadow-2xs">
          <div className="border-b border-[#eaecf0] pb-2 mb-4">
            <h3 className="font-wiki-serif text-base font-bold text-[#202122]">
              4. Acoustic Tone & Snooze Properties
            </h3>
          </div>

          <div className="space-y-4">
            {/* Sound options list */}
            <div>
              <label className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-2">
                Acoustic Tone Selection
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SOUND_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSound(opt.id)}
                    className={`p-3 border rounded-xs cursor-pointer flex items-center justify-between gap-2 transition-all ${
                      sound === opt.id
                        ? 'border-[#3366cc] bg-[#f0f4fc]'
                        : 'border-[#c8ccd1] bg-[#f8f9fa] hover:bg-[#eaecf0]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#202122] flex items-center gap-1.5">
                        {opt.name}
                        {sound === opt.id && (
                          <Check className="w-3.5 h-3.5 text-[#3366cc]" />
                        )}
                      </div>
                      <div className="text-[11px] text-[#54595d]">{opt.description}</div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playChimeNote(opt.id);
                      }}
                      title="Preview this sound tone"
                      className="p-1.5 text-[#3366cc] hover:bg-white rounded-xs border border-transparent hover:border-[#c0d4f6] transition-colors shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Vibration & Snooze Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#eaecf0]">
              {/* Vibration Toggle */}
              <div className="flex items-center justify-between p-3 border border-[#c8ccd1] bg-[#f8f9fa] rounded-xs">
                <div>
                  <div className="text-xs font-bold text-[#202122] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#54595d]" />
                    Haptic Vibration
                  </div>
                  <div className="text-[11px] text-[#54595d]">Vibrate phone while ringing</div>
                </div>
                <button
                  type="button"
                  onClick={() => setVibrate(!vibrate)}
                  className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${
                    vibrate ? 'bg-[#14866d]' : 'bg-[#c8ccd1]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                      vibrate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Snooze Interval */}
              <div className="p-3 border border-[#c8ccd1] bg-[#f8f9fa] rounded-xs">
                <div className="text-xs font-bold text-[#202122] mb-1.5">
                  Snooze Duration
                </div>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSnoozeMinutes(mins)}
                      className={`flex-1 py-1 text-xs font-medium border rounded-xs transition-colors ${
                        snoozeMinutes === mins
                          ? 'border-[#3366cc] bg-[#3366cc] text-white'
                          : 'border-[#c8ccd1] bg-white text-[#202122] hover:bg-[#eaecf0]'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#a2a9b1] p-4 flex items-center justify-end gap-3 z-30 shadow-lg">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-medium text-[#202122] bg-[#f8f9fa] hover:bg-[#eaecf0] border border-[#a2a9b1] rounded-xs transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#3366cc] hover:bg-[#2a4b8d] active:bg-[#1a3875] rounded-xs transition-colors shadow-xs flex items-center gap-2 min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            Save Alarm
          </button>
        </div>
      </div>
    </div>
  );
};
