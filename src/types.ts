export type SoundType = 'bell' | 'digital' | 'marimba' | 'harp' | 'radar';

export interface Alarm {
  id: string;
  hour: number;          // 0 - 23 (24h internal storage)
  minute: number;        // 0 - 59
  label: string;         // e.g. "Morning Wake Up"
  days: number[];        // 0 = Sun, 1 = Mon, ..., 6 = Sat. Empty array = Once
  enabled: boolean;
  sound: SoundType;
  vibrate: boolean;
  snoozeMinutes: number; // 5, 10, 15
  createdAt: number;
  lastDismissedDate?: string; // YYYY-MM-DD
}

export interface SnoozedAlarm {
  alarmId: string;
  triggerTimestamp: number; // epoch ms
}
