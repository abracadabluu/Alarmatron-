import { Alarm, AppSettings } from '../types';

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  use24HourFormat: false,
  defaultSnoozeMinutes: 10,
  vibrateByDefault: true,
  overlayPermissionGranted: false,
  deviceAdminEnabled: false,
};

export const DEFAULT_ALARMS: Alarm[] = [
  {
    id: 'alarm-1',
    hour: 7,
    minute: 0,
    label: 'Morning Alarm',
    days: [1, 2, 3, 4, 5], // Mon - Fri
    enabled: true,
    toneName: 'Default Chime',
    vibrate: true,
    snoozeMinutes: 10,
    createdAt: 1700000000000,
  },
  {
    id: 'alarm-2',
    hour: 8,
    minute: 30,
    label: 'Work Standup',
    days: [1, 2, 3, 4, 5],
    enabled: true,
    toneName: 'Default Chime',
    vibrate: true,
    snoozeMinutes: 5,
    createdAt: 1700000010000,
  },
  {
    id: 'alarm-3',
    hour: 9,
    minute: 0,
    label: 'Weekend Rest',
    days: [0, 6], // Sun, Sat
    enabled: false,
    toneName: 'Default Chime',
    vibrate: true,
    snoozeMinutes: 15,
    createdAt: 1700000020000,
  },
];

const ALARMS_STORAGE_KEY = 'alarmatron_alarms_v2';
const SETTINGS_STORAGE_KEY = 'alarmatron_settings_v2';

export function loadStoredAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(ALARMS_STORAGE_KEY);
    if (!raw) {
      saveStoredAlarms(DEFAULT_ALARMS);
      return DEFAULT_ALARMS;
    }
    const parsed = JSON.parse(raw) as Alarm[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_ALARMS;
  } catch (err) {
    console.warn('Failed to load alarms:', err);
    return DEFAULT_ALARMS;
  }
}

export function saveStoredAlarms(alarms: Alarm[]): void {
  try {
    localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms));
  } catch (err) {
    console.warn('Failed to save alarms:', err);
  }
}

export function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings:', err);
  }
}

/**
 * Format time based on 12-hour or 24-hour setting
 */
export function formatTimeDisplay(hour: number, minute: number, use24h: boolean = false): { timeStr: string; period?: string } {
  const minStr = minute < 10 ? `0${minute}` : `${minute}`;
  if (use24h) {
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
    return { timeStr: `${hourStr}:${minStr}` };
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const hourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
  return { timeStr: `${hourStr}:${minStr}`, period };
}

/**
 * Formats repetition days into clean Wikipedia-style metadata
 */
export function formatRepetition(days: number[]): string {
  if (!days || days.length === 0) {
    return 'Once';
  }
  if (days.length === 7) {
    return 'Every day';
  }
  const sorted = [...days].sort((a, b) => a - b);
  const isWeekdays = sorted.length === 5 && sorted.every((d, i) => d === i + 1);
  if (isWeekdays) {
    return 'Weekdays (Mon–Fri)';
  }
  const isWeekends = sorted.length === 2 && sorted.includes(0) && sorted.includes(6);
  if (isWeekends) {
    return 'Weekends (Sat, Sun)';
  }
  return sorted.map((d) => DAY_NAMES[d]).join(', ');
}

/**
 * Computes next trigger Date for a given alarm
 */
export function getNextTriggerDate(alarm: Alarm, fromDate: Date = new Date()): Date {
  const now = fromDate;
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (!alarm.days || alarm.days.length === 0) {
    const candidate = new Date(now);
    candidate.setHours(alarm.hour, alarm.minute, 0, 0);
    if (alarm.hour > currentHour || (alarm.hour === currentHour && alarm.minute > currentMinute)) {
      return candidate;
    }
    candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  for (let offset = 0; offset <= 7; offset++) {
    const checkDay = (currentDay + offset) % 7;
    if (alarm.days.includes(checkDay)) {
      if (offset === 0) {
        if (alarm.hour > currentHour || (alarm.hour === currentHour && alarm.minute > currentMinute)) {
          const target = new Date(now);
          target.setHours(alarm.hour, alarm.minute, 0, 0);
          return target;
        }
      } else {
        const target = new Date(now);
        target.setDate(target.getDate() + offset);
        target.setHours(alarm.hour, alarm.minute, 0, 0);
        return target;
      }
    }
  }

  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(alarm.hour, alarm.minute, 0, 0);
  return fallback;
}

/**
 * Calculates human-readable countdown string to the next trigger
 */
export function formatTimeUntil(targetDate: Date, now: Date = new Date()): string {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) return 'due now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  const remainingHrs = diffHrs % 24;
  const remainingMins = diffMin % 60;

  if (diffDays > 0) {
    return `in ${diffDays}d ${remainingHrs}h ${remainingMins}m`;
  }
  if (diffHrs > 0) {
    return `in ${diffHrs}h ${remainingMins}m`;
  }
  if (diffMin > 0) {
    return `in ${diffMin}m`;
  }
  return `in ${diffSec}s`;
}
