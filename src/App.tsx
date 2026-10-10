/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppHeader } from './components/AppHeader';
import { AlarmCard } from './components/AlarmCard';
import { SetAlarmView } from './components/SetAlarmView';
import { SettingsView } from './components/SettingsView';
import { RingingModal } from './components/RingingModal';
import { FloatingAddButton } from './components/FloatingAddButton';
import { Alarm, SnoozedAlarm, AppSettings } from './types';
import {
  loadStoredAlarms,
  saveStoredAlarms,
  loadStoredSettings,
  saveStoredSettings,
  DEFAULT_ALARMS,
} from './utils/alarmUtils';
import { Clock } from 'lucide-react';

export default function App() {
  const [alarms, setAlarms] = useState<Alarm[]>(() => loadStoredAlarms());
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());
  const [currentView, setCurrentView] = useState<'list' | 'set-alarm' | 'settings'>('list');
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const [snoozedList, setSnoozedList] = useState<SnoozedAlarm[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const lastTriggeredMinuteRef = useRef<string>('');

  // Save alarms on change
  useEffect(() => {
    saveStoredAlarms(alarms);
  }, [alarms]);

  // Save settings on change
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Master Clock & Alarm Trigger Interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const minuteKey = `${currentDay}-${currentHour}-${currentMinute}`;

      // 1. Check snoozed alarms
      const nowMs = now.getTime();
      const dueSnoozed = snoozedList.filter((s) => s.triggerTimestamp <= nowMs);
      if (dueSnoozed.length > 0) {
        const firstDue = dueSnoozed[0];
        const targetAlarm = alarms.find((a) => a.id === firstDue.alarmId);
        if (targetAlarm) {
          setSnoozedList((prev) => prev.filter((s) => s.alarmId !== firstDue.alarmId));
          setRingingAlarm(targetAlarm);
          return;
        }
      }

      // 2. Check scheduled alarms
      if (lastTriggeredMinuteRef.current !== minuteKey) {
        for (const alarm of alarms) {
          if (!alarm.enabled) continue;

          if (alarm.hour === currentHour && alarm.minute === currentMinute) {
            const isToday =
              alarm.days.length === 0 || alarm.days.includes(currentDay);

            if (isToday) {
              lastTriggeredMinuteRef.current = minuteKey;
              setRingingAlarm(alarm);
              break;
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, snoozedList]);

  // Toggle alarm on/off (same button)
  const handleToggle = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleEdit = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setCurrentView('set-alarm');
  };

  const handleDelete = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDismissRinging = () => {
    if (ringingAlarm) {
      if (!ringingAlarm.days || ringingAlarm.days.length === 0) {
        setAlarms((prev) =>
          prev.map((a) => (a.id === ringingAlarm.id ? { ...a, enabled: false } : a))
        );
      }
    }
    setRingingAlarm(null);
  };

  const handleSnoozeRinging = (minutes: number) => {
    if (ringingAlarm) {
      const triggerTimestamp = Date.now() + minutes * 60 * 1000;
      setSnoozedList((prev) => [
        ...prev.filter((s) => s.alarmId !== ringingAlarm.id),
        { alarmId: ringingAlarm.id, triggerTimestamp },
      ]);
    }
    setRingingAlarm(null);
  };

  const handleSaveAlarm = (
    alarmData: Omit<Alarm, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setAlarms((prev) =>
        prev.map((a) => (a.id === existingId ? { ...a, ...alarmData } : a))
      );
    } else {
      const newAlarm: Alarm = {
        ...alarmData,
        id: `alarm-${Date.now()}`,
        createdAt: Date.now(),
      };
      setAlarms((prev) => [...prev, newAlarm]);
    }
    setEditingAlarm(null);
    setCurrentView('list');
  };

  const handleResetAlarms = () => {
    setAlarms(DEFAULT_ALARMS);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#202122] selection:bg-[#c0d4f6] selection:text-[#202122]">
      {/* App Header on Homepage */}
      {currentView === 'list' && (
        <AppHeader onOpenSettings={() => setCurrentView('settings')} />
      )}

      {/* Main Body */}
      <main className="flex-1 w-full mx-auto px-4 py-4 sm:py-5">
        {currentView === 'list' && (
          /* Reduced width for alarm log/bars: max-w-md */
          <div className="max-w-md mx-auto space-y-3 pb-24">
            {/* Alarm List */}
            {alarms.length > 0 ? (
              <div className="space-y-2.5">
                {alarms.map((alarm) => (
                  <AlarmCard
                    key={alarm.id}
                    alarm={alarm}
                    use24h={settings.use24HourFormat}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            ) : (
              /* Clean Empty State */
              <div className="border border-[#c8ccd1] bg-[#f8f9fa] p-8 text-center space-y-2 mt-4">
                <Clock className="w-7 h-7 text-[#54595d] mx-auto" />
                <h3 className="font-wiki-serif text-base font-bold text-[#202122]">
                  No alarms set
                </h3>
                <p className="text-xs text-[#54595d]">
                  Click the "Add Alarm" button below to set an alarm.
                </p>
              </div>
            )}

            {/* Floating Add Alarm Button */}
            <FloatingAddButton
              onClick={() => {
                setEditingAlarm(null);
                setCurrentView('set-alarm');
              }}
            />
          </div>
        )}

        {currentView === 'set-alarm' && (
          <SetAlarmView
            initialAlarm={editingAlarm}
            use24h={settings.use24HourFormat}
            defaultSnooze={settings.defaultSnoozeMinutes}
            defaultVibrate={settings.vibrateByDefault}
            settings={settings}
            onUpdateSettings={setSettings}
            onSave={handleSaveAlarm}
            onCancel={() => {
              setEditingAlarm(null);
              setCurrentView('list');
            }}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onResetAlarms={handleResetAlarms}
            onBack={() => setCurrentView('list')}
          />
        )}
      </main>

      {/* Ringing Modal */}
      {ringingAlarm && (
        <RingingModal
          alarm={ringingAlarm}
          use24h={settings.use24HourFormat}
          onDismiss={handleDismissRinging}
          onSnooze={handleSnoozeRinging}
        />
      )}
    </div>
  );
}
