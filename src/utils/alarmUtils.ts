import { Alarm } from '../types';

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const DEFAULT_ALARMS: Alarm[] = [
  {
    id: 'alarm-1',
    hour: 7,
    minute: 0,
    label: 'Morning Awakening',
    days: [1, 2, 3, 4, 5], // Mon - Fri
    enabled: true,
    sound: 'bell',
    vibrate: true,
    snoozeMinutes: 10,
    createdAt: 1700000000000,
  },
  {
    id: 'alarm-2',
    hour: 8,
    minute: 30,
    label: 'Team Standup & Daily Sync',
    days: [1, 2, 3, 4, 5],
    enabled: true,
    sound: 'marimba',
    vibrate: false,
    snoozeMinutes: 5,
    createdAt: 1700000010000,
  },
  {
    id: 'alarm-3',
    hour: 9,
    minute: 45,
    label: 'Weekend Rest & Reading',
    days: [0, 6], // Sun, Sat
    enabled: false,
    sound: 'harp',
    vibrate: true,
    snoozeMinutes: 15,
    createdAt: 1700000020000,
  },
];

const STORAGE_KEY = 'alarmatron_alarms_v1';

export function loadStoredAlarms(): Alarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    console.warn('Failed to load alarms from storage:', err);
    return DEFAULT_ALARMS;
  }
}

export function saveStoredAlarms(alarms: Alarm[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch (err) {
    console.warn('Failed to save alarms to storage:', err);
  }
}

/**
 * Format hour and minute to standard 12-hour string (e.g. "07:30 AM")
 */
export function formatTime12h(hour: number, minute: number): { timeStr: string; period: 'AM' | 'PM' } {
  const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const hourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
  const minStr = minute < 10 ? `0${minute}` : `${minute}`;
  return {
    timeStr: `${hourStr}:${minStr}`,
    period,
  };
}

/**
 * Formats repetition days into clean Wikipedia-style metadata text
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
 * Computes the exact next trigger Date for a given alarm
 */
export function getNextTriggerDate(alarm: Alarm, fromDate: Date = new Date()): Date {
  const now = fromDate;
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // If one-off alarm
  if (!alarm.days || alarm.days.length === 0) {
    const candidate = new Date(now);
    candidate.setHours(alarm.hour, alarm.minute, 0, 0);

    // If time is later today, return today
    if (alarm.hour > currentHour || (alarm.hour === currentHour && alarm.minute > currentMinute)) {
      return candidate;
    }
    // Else tomorrow
    candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  // If recurring alarm
  for (let offset = 0; offset <= 7; offset++) {
    const checkDay = (currentDay + offset) % 7;
    if (alarm.days.includes(checkDay)) {
      if (offset === 0) {
        // Today: must be in the future
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

  // Fallback
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
    return `in ${diffMin} minute${diffMin === 1 ? '' : 's'}`;
  }
  return `in ${diffSec} second${diffSec === 1 ? '' : 's'}`;
}

/**
 * Finds the earliest next alarm among enabled alarms
 */
export function findEarliestAlarm(alarms: Alarm[], now: Date = new Date()): { alarm: Alarm; nextDate: Date } | null {
  const enabledAlarms = alarms.filter((a) => a.enabled);
  if (enabledAlarms.length === 0) return null;

  let earliest: { alarm: Alarm; nextDate: Date } | null = null;
  for (const alarm of enabledAlarms) {
    const nextDate = getNextTriggerDate(alarm, now);
    if (!earliest || nextDate.getTime() < earliest.nextDate.getTime()) {
      earliest = { alarm, nextDate };
    }
  }
  return earliest;
}
