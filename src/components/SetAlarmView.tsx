import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Clock,
  Music,
  FolderOpen,
  Play,
  Square,
  Check,
  Trash2,
  Delete,
  ShieldAlert,
  Smartphone,
  Sliders,
} from 'lucide-react';
import { Alarm, AppSettings } from '../types';
import { DAY_NAMES, FULL_DAY_NAMES } from '../utils/alarmUtils';
import { previewTone } from '../utils/audioEngine';
import { NumpadModal } from './NumpadModal';
import {
  requestDisplayOverOtherApps,
  requestDeviceAdministrator,
} from '../utils/androidUtils';

interface SetAlarmViewProps {
  initialAlarm?: Alarm | null;
  use24h: boolean;
  defaultSnooze: number;
  defaultVibrate: boolean;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onSave: (alarmData: Omit<Alarm, 'id' | 'createdAt'>, existingId?: string) => void;
  onCancel: () => void;
}

export const SetAlarmView: React.FC<SetAlarmViewProps> = ({
  initialAlarm,
  use24h,
  defaultSnooze,
  defaultVibrate,
  settings,
  onUpdateSettings,
  onSave,
  onCancel,
}) => {
  // 1. Time State
  const initHour = initialAlarm ? initialAlarm.hour : 7;
  const initMinute = initialAlarm ? initialAlarm.minute : 0;
  const initPeriod: 'AM' | 'PM' = initHour >= 12 ? 'PM' : 'AM';
  const init12Hour = initHour % 12 === 0 ? 12 : initHour % 12;

  const [hour12, setHour12] = useState<number>(init12Hour);
  const [hour24, setHour24] = useState<number>(initHour);
  const [minute, setMinute] = useState<number>(initMinute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initPeriod);

  // Active focus in numpad: 'hour' or 'minute'
  const [activeTimePart, setActiveTimePart] = useState<'hour' | 'minute'>('hour');

  // 2. Label State
  const [label, setLabel] = useState<string>(initialAlarm ? initialAlarm.label : '');

  // 3. Repetition State (7 days)
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialAlarm ? [...initialAlarm.days] : [1, 2, 3, 4, 5] // default weekdays
  );

  // 4. Snooze State & Numpad Modal
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(
    initialAlarm ? initialAlarm.snoozeMinutes : defaultSnooze
  );
  const [isSnoozeNumpadOpen, setIsSnoozeNumpadOpen] = useState<boolean>(false);

  // 5. Tone State (Local storage music)
  const [toneName, setToneName] = useState<string>(
    initialAlarm?.toneName || 'Default Chime'
  );
  const [toneData, setToneData] = useState<string | undefined>(
    initialAlarm?.toneData
  );
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const stopAudioRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 6. Android Permissions State
  const [overlayGranted, setOverlayGranted] = useState<boolean>(
    settings.overlayPermissionGranted
  );
  const [deviceAdminActive, setDeviceAdminActive] = useState<boolean>(
    settings.deviceAdminEnabled
  );
  const [showAdminNotice, setShowAdminNotice] = useState<boolean>(false);

  // Numpad key input for Time
  const handleNumpadDigit = (digit: string) => {
    const num = parseInt(digit, 10);
    if (activeTimePart === 'hour') {
      if (!use24h) {
        // 12h format (1-12)
        const currentStr = hour12.toString();
        let nextVal = parseInt(currentStr + digit, 10);
        if (nextVal > 12) nextVal = num;
        if (nextVal === 0) nextVal = 1;
        setHour12(nextVal);
        // If user typed 2 digits or typed a number >= 2, advance to minute
        if (nextVal >= 2 || currentStr.length === 1) {
          setActiveTimePart('minute');
        }
      } else {
        // 24h format (0-23)
        let nextVal = parseInt(hour24.toString() + digit, 10);
        if (nextVal > 23) nextVal = num;
        setHour24(nextVal);
        if (nextVal >= 3) {
          setActiveTimePart('minute');
        }
      }
    } else {
      // Minute (0-59)
      const currentStr = minute.toString();
      let nextVal = parseInt(currentStr + digit, 10);
      if (nextVal > 59) nextVal = num;
      setMinute(nextVal);
    }
  };

  const handleNumpadBackspace = () => {
    if (activeTimePart === 'minute') {
      const str = minute.toString();
      if (str.length > 1) {
        setMinute(parseInt(str.slice(0, -1), 10));
      } else {
        setMinute(0);
        setActiveTimePart('hour');
      }
    } else {
      if (!use24h) {
        const str = hour12.toString();
        if (str.length > 1) {
          setHour12(parseInt(str.slice(0, -1), 10));
        } else {
          setHour12(1);
        }
      } else {
        const str = hour24.toString();
        if (str.length > 1) {
          setHour24(parseInt(str.slice(0, -1), 10));
        } else {
          setHour24(0);
        }
      }
    }
  };

  const handleNumpadClear = () => {
    if (activeTimePart === 'hour') {
      if (!use24h) setHour12(1);
      else setHour24(0);
    } else {
      setMinute(0);
    }
  };

  // Day toggle
  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort((a, b) => a - b));
    }
  };

  const selectAllDays = () => {
    if (selectedDays.length === 7) {
      setSelectedDays([]); // deselect
    } else {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]); // make it daily
    }
  };

  // Tone file pick
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      setToneName(name);
      setToneData(reader.result as string);
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
        setIsPlayingPreview(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const togglePreview = () => {
    if (isPlayingPreview) {
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
      setIsPlayingPreview(false);
    } else {
      const stop = previewTone(toneData);
      stopAudioRef.current = stop;
      setIsPlayingPreview(true);
      setTimeout(() => setIsPlayingPreview(false), 8000);
    }
  };

  // Android Permission actions
  const handleRequestOverlay = async () => {
    await requestDisplayOverOtherApps();
    setOverlayGranted(true);
    onUpdateSettings({ ...settings, overlayPermissionGranted: true });
  };

  const handleToggleDeviceAdmin = async () => {
    if (!deviceAdminActive) {
      setShowAdminNotice(true);
    } else {
      setDeviceAdminActive(false);
      onUpdateSettings({ ...settings, deviceAdminEnabled: false });
    }
  };

  const confirmDeviceAdmin = async () => {
    setShowAdminNotice(false);
    await requestDeviceAdministrator();
    setDeviceAdminActive(true);
    onUpdateSettings({ ...settings, deviceAdminEnabled: true });
  };

  const handleSave = () => {
    if (stopAudioRef.current) stopAudioRef.current();

    let finalHour = 0;
    if (use24h) {
      finalHour = hour24;
    } else {
      finalHour = hour12 % 12;
      if (period === 'PM') finalHour += 12;
    }

    onSave(
      {
        hour: finalHour,
        minute,
        label: label.trim() || 'Alarm',
        days: selectedDays,
        enabled: true,
        toneName,
        toneData,
        vibrate: initialAlarm ? initialAlarm.vibrate : defaultVibrate,
        snoozeMinutes,
      },
      initialAlarm?.id
    );
  };

  const handleCancel = () => {
    if (stopAudioRef.current) stopAudioRef.current();
    onCancel();
  };

  // Repetition text summary
  const repetitionStatus =
    selectedDays.length === 7
      ? 'Daily (All 7 days)'
      : selectedDays.length === 0
      ? 'Once (No repeat)'
      : `Weekly (${selectedDays.map((d) => DAY_NAMES[d]).join(', ')})`;

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Top Header */}
      <div className="border-b border-[#a2a9b1] pb-3 mb-5 flex items-center justify-between">
        <button
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 text-xs text-[#3366cc] hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Alarms
        </button>
        <h2 className="text-xl font-normal font-wiki-serif text-[#202122]">
          {initialAlarm ? 'Edit Alarm' : 'Set Alarm'}
        </h2>
        <div className="w-16" />
      </div>

      <div className="space-y-4">
        {/* 1. Time Configuration with Numpad */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#3366cc]" />
              Time
            </span>
            <span className="text-[11px] font-normal text-[#72777d]">
              Tap digits on numpad to set
            </span>
          </div>

          {/* Time Readout */}
          <div className="flex items-center justify-center gap-3 py-3 bg-[#f8f9fa] border border-[#c8ccd1] mb-3">
            {/* Hour Block */}
            <button
              type="button"
              onClick={() => setActiveTimePart('hour')}
              className={`px-3 py-1 text-3xl font-bold font-wiki-serif rounded-xs tabular-nums transition-all border ${
                activeTimePart === 'hour'
                  ? 'border-[#3366cc] bg-white text-[#3366cc] ring-2 ring-[#3366cc]/20'
                  : 'border-transparent text-[#202122] hover:bg-white'
              }`}
            >
              {!use24h
                ? hour12 < 10
                  ? `0${hour12}`
                  : hour12
                : hour24 < 10
                ? `0${hour24}`
                : hour24}
            </button>

            <span className="text-2xl font-bold font-wiki-serif text-[#a2a9b1] select-none">
              :
            </span>

            {/* Minute Block */}
            <button
              type="button"
              onClick={() => setActiveTimePart('minute')}
              className={`px-3 py-1 text-3xl font-bold font-wiki-serif rounded-xs tabular-nums transition-all border ${
                activeTimePart === 'minute'
                  ? 'border-[#3366cc] bg-white text-[#3366cc] ring-2 ring-[#3366cc]/20'
                  : 'border-transparent text-[#202122] hover:bg-white'
              }`}
            >
              {minute < 10 ? `0${minute}` : minute}
            </button>

            {/* AM / PM Segmented Control */}
            {!use24h && (
              <div className="flex rounded-xs border border-[#a2a9b1] overflow-hidden bg-white ml-2">
                <button
                  type="button"
                  onClick={() => setPeriod('AM')}
                  className={`px-2.5 py-1 text-xs font-bold transition-colors ${
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
                  className={`px-2.5 py-1 text-xs font-bold transition-colors border-l border-[#a2a9b1] ${
                    period === 'PM'
                      ? 'bg-[#3366cc] text-white'
                      : 'text-[#202122] hover:bg-[#eaecf0]'
                  }`}
                >
                  PM
                </button>
              </div>
            )}
          </div>

          {/* Interactive Numpad for Setting Time */}
          <div className="bg-[#f8f9fa] border border-[#c8ccd1] p-2.5 rounded-xs">
            <div className="grid grid-cols-3 gap-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadDigit(digit)}
                  className="h-10 bg-white hover:bg-[#eaecf0] active:bg-[#c8ccd1] border border-[#c8ccd1] rounded-xs text-base font-bold font-wiki-serif text-[#202122] select-none transition-colors"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleNumpadClear}
                className="h-10 bg-white hover:bg-[#eaecf0] active:bg-[#c8ccd1] border border-[#c8ccd1] rounded-xs text-xs font-medium text-[#54595d] select-none"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleNumpadDigit('0')}
                className="h-10 bg-white hover:bg-[#eaecf0] active:bg-[#c8ccd1] border border-[#c8ccd1] rounded-xs text-base font-bold font-wiki-serif text-[#202122] select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleNumpadBackspace}
                className="h-10 bg-white hover:bg-[#eaecf0] active:bg-[#c8ccd1] border border-[#c8ccd1] rounded-xs flex items-center justify-center text-[#54595d] select-none"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Label Input (written after setting time) */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs">
          <label className="block text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-1.5">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Morning Alarm"
            className="w-full px-3 py-2 text-sm bg-white border border-[#a2a9b1] rounded-xs focus:outline-none focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]"
          />
        </div>

        {/* 3. Repetition in a Vertical Bar (Seven Weekdays) */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#54595d] uppercase tracking-wider">
              Repetition
            </span>
            <span className="text-xs text-[#3366cc] font-medium">
              {repetitionStatus}
            </span>
          </div>

          {/* Vertical Bar layout with Seven weekday buttons */}
          <div className="border border-[#c8ccd1] bg-[#f8f9fa] p-3 rounded-xs space-y-2">
            <div className="grid grid-cols-7 gap-1">
              {DAY_NAMES.map((name, idx) => {
                const isSelected = selectedDays.includes(idx);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    title={FULL_DAY_NAMES[idx]}
                    className={`py-2.5 border rounded-xs text-xs font-semibold flex flex-col items-center justify-center transition-all select-none min-h-[44px] ${
                      isSelected
                        ? 'border-[#14866d] bg-[#e8f6f3] text-[#14866d] ring-1 ring-[#14866d]'
                        : 'border-[#c8ccd1] bg-white text-[#54595d] hover:bg-[#eaecf0]'
                    }`}
                  >
                    <span className="text-sm font-bold font-wiki-serif">{name.charAt(0)}</span>
                    <span className="text-[9px]">{name}</span>
                  </button>
                );
              })}
            </div>

            {/* Shortcut button to make it daily or clear */}
            <div className="pt-2 border-t border-[#eaecf0] flex items-center justify-between text-xs">
              <span className="text-[#54595d] text-[11px]">Select days weekly:</span>
              <button
                type="button"
                onClick={selectAllDays}
                className="px-2.5 py-1 border border-[#a2a9b1] bg-white hover:bg-[#eaecf0] text-[#202122] rounded-xs text-xs font-medium"
              >
                {selectedDays.length === 7 ? 'Clear All' : 'Select All (Daily)'}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Vertical Bar with 'Snooze' and 'Set duration' on the right side */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            {/* Left: 'Snooze' text */}
            <div>
              <span className="text-[11px] font-semibold text-[#54595d] uppercase tracking-wider block">
                Snooze
              </span>
              <span className="text-sm font-medium text-[#202122]">
                {snoozeMinutes} minutes
              </span>
            </div>

            {/* Right: 'Set duration' button using numpad */}
            <button
              type="button"
              onClick={() => setIsSnoozeNumpadOpen(true)}
              className="px-3.5 py-2 text-xs font-medium text-[#3366cc] bg-[#f0f4fc] hover:bg-[#e1ecfc] border border-[#c0d4f6] rounded-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Set duration</span>
            </button>
          </div>
        </div>

        {/* 5. Tone Selection (Music from local storage) */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#54595d] uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#3366cc]" />
              Tone
            </span>
            <span className="text-xs text-[#54595d]">
              Local device storage
            </span>
          </div>

          <div className="bg-[#f8f9fa] border border-[#c8ccd1] p-3 rounded-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#202122] truncate max-w-[220px]">
                {toneName}
              </span>

              <button
                type="button"
                onClick={togglePreview}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border rounded-xs transition-colors shrink-0 ${
                  isPlayingPreview
                    ? 'bg-[#d33d33] text-white border-[#d33d33]'
                    : 'bg-white text-[#3366cc] border-[#a2a9b1] hover:bg-[#eaecf0]'
                }`}
              >
                {isPlayingPreview ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Preview</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />

            <div className="pt-2 border-t border-[#eaecf0] flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202122] bg-white hover:bg-[#eaecf0] border border-[#a2a9b1] rounded-xs shadow-2xs"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#3366cc]" />
                <span>Choose Music from Device...</span>
              </button>

              {toneData && (
                <button
                  type="button"
                  onClick={() => {
                    setToneName('Default Chime');
                    setToneData(undefined);
                  }}
                  className="p-1.5 text-[#72777d] hover:text-[#d33d33]"
                  title="Reset to default chime"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 6. Android Permissions & Anti-Uninstall (Device Administrator) */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs space-y-3">
          <div className="text-[11px] font-semibold text-[#54595d] uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#3366cc]" />
            Android Wakeup Protection
          </div>

          {/* Display Over Other Apps */}
          <div className="flex items-center justify-between p-2.5 bg-[#f8f9fa] border border-[#c8ccd1] rounded-xs">
            <div className="pr-2">
              <div className="text-xs font-bold text-[#202122]">
                Display over other apps
              </div>
              <div className="text-[11px] text-[#54595d]">
                Rings fullscreen even when using other apps or locked
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestOverlay}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors shrink-0 ${
                overlayGranted
                  ? 'bg-[#e8f6f3] border-[#14866d] text-[#14866d]'
                  : 'bg-white border-[#a2a9b1] text-[#3366cc] hover:bg-[#eaecf0]'
              }`}
            >
              {overlayGranted ? 'Allowed' : 'Grant'}
            </button>
          </div>

          {/* Device Administrator (Anti-Uninstall) */}
          <div className="flex items-center justify-between p-2.5 bg-[#f8f9fa] border border-[#c8ccd1] rounded-xs">
            <div className="pr-2">
              <div className="text-xs font-bold text-[#202122] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#78350f]" />
                Device Administrator
              </div>
              <div className="text-[11px] text-[#54595d]">
                Prevents quickly uninstalling the app in the morning
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleDeviceAdmin}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors shrink-0 ${
                deviceAdminActive
                  ? 'bg-[#14866d] text-white border-[#14866d]'
                  : 'bg-white border-[#a2a9b1] text-[#202122] hover:bg-[#eaecf0]'
              }`}
            >
              {deviceAdminActive ? 'Active' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-[#a2a9b1] pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2 text-xs font-medium text-[#202122] bg-[#f8f9fa] hover:bg-[#eaecf0] border border-[#a2a9b1] rounded-xs transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 text-xs font-bold text-white bg-[#3366cc] hover:bg-[#2a4b8d] active:bg-[#1a3875] rounded-xs transition-colors shadow-xs flex items-center gap-2 min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            Save Alarm
          </button>
        </div>
      </div>

      {/* Snooze Numpad Modal */}
      <NumpadModal
        isOpen={isSnoozeNumpadOpen}
        title="Set Snooze Duration"
        initialValue={snoozeMinutes}
        unit="minutes"
        min={1}
        max={60}
        onConfirm={(val) => {
          setSnoozeMinutes(val);
          setIsSnoozeNumpadOpen(false);
        }}
        onClose={() => setIsSnoozeNumpadOpen(false)}
      />

      {/* Device Admin Confirmation Notice */}
      {showAdminNotice && (
        <div className="fixed inset-0 z-50 bg-[#202122]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-[#a2a9b1] p-5 shadow-2xl">
            <h3 className="font-wiki-serif font-bold text-base text-[#202122] mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-[#78350f]" />
              Enable Device Administrator?
            </h3>
            <p className="text-xs text-[#54595d] leading-relaxed mb-4">
              Activating Device Administrator prevents morning uninstallation of Alarmatron until you explicitly deactivate it in Android Settings. This guarantees you wake up on schedule!
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdminNotice(false)}
                className="px-3 py-1.5 text-xs text-[#54595d] hover:bg-[#f8f9fa] border border-[#c8ccd1] rounded-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeviceAdmin}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#14866d] hover:bg-[#0f6c58] rounded-xs"
              >
                Confirm & Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
