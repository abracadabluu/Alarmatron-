/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WikipediaHeader } from './components/WikipediaHeader';
import { WikipediaInfobox } from './components/WikipediaInfobox';
import { AlarmCard } from './components/AlarmCard';
import { SetAlarmView } from './components/SetAlarmView';
import { RingingModal } from './components/RingingModal';
import { ApkGuideModal } from './components/ApkGuideModal';
import { FloatingAddButton } from './components/FloatingAddButton';
import { Alarm, SnoozedAlarm, SoundType } from './types';
import { loadStoredAlarms, saveStoredAlarms, formatTime12h } from './utils/alarmUtils';
import { playChimeNote } from './utils/audioEngine';
import { Clock, Plus, Bell, AlertCircle, Sparkles, Filter } from 'lucide-react';

export default function App() {
  const [alarms, setAlarms] = useState<Alarm[]>(() => loadStoredAlarms());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);
  const [snoozedList, setSnoozedList] = useState<SnoozedAlarm[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isApkGuideOpen, setIsApkGuideOpen] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'inactive'>('all');

  // Track the last minute we triggered an alarm to avoid repeated firings in the same minute
  const lastTriggeredMinuteRef = useRef<string>('');

  // Save alarms whenever updated
  useEffect(() => {
    saveStoredAlarms(alarms);
  }, [alarms]);

  // Master Clock & Alarm Checker Interval (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const minuteKey = `${currentDay}-${currentHour}-${currentMinute}`;

      // Check snoozed alarms
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

      // If we haven't already fired an alarm this minute
      if (lastTriggeredMinuteRef.current !== minuteKey) {
        // Find if any enabled alarm matches the current hour and minute
        for (const alarm of alarms) {
          if (!alarm.enabled) continue;

          if (alarm.hour === currentHour && alarm.minute === currentMinute) {
            // Check day of week recurrence:
            // If alarm.days is empty, it's a one-shot alarm
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

  // Handlers for alarm state
  const handleToggle = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleEdit = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setCurrentView('edit');
  };

  const handleDuplicate = (alarm: Alarm) => {
    const duplicated: Alarm = {
      ...alarm,
      id: `alarm-${Date.now()}`,
      label: `${alarm.label} (Copy)`,
      createdAt: Date.now(),
    };
    setAlarms((prev) => [...prev, duplicated]);
  };

  const handleDelete = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveAlarm = (
    alarmData: Omit<Alarm, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === existingId
            ? { ...a, ...alarmData }
            : a
        )
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

  const handleTestRing = (alarm: Alarm) => {
    setRingingAlarm(alarm);
  };

  const handleDismissRinging = () => {
    if (ringingAlarm) {
      // If one-off alarm, disable it after dismissal
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

  // Filtered alarms
  const filteredAlarms = alarms.filter((alarm) => {
    const matchesSearch =
      alarm.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatTime12h(alarm.hour, alarm.minute)
        .timeStr.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterMode === 'active') return alarm.enabled;
    if (filterMode === 'inactive') return !alarm.enabled;
    return true;
  });

  const activeAlarmsCount = alarms.filter((a) => a.enabled).length;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#202122] selection:bg-[#c0d4f6] selection:text-[#202122]">
      {/* Wikipedia Classic Top Header */}
      <WikipediaHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenApkGuide={() => setIsApkGuideOpen(true)}
        onQuickTestSound={() => playChimeNote('bell')}
        activeAlarmsCount={activeAlarmsCount}
        totalAlarmsCount={alarms.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 sm:py-6">
        {currentView === 'list' ? (
          <div className="space-y-6">
            {/* Top Encyclopedic Lead & Layout Grid */}
            <div className="flex flex-col-reverse lg:flex-row gap-6 items-start">
              {/* Left Column: Wikipedia Article Body & Alarms List */}
              <div className="flex-1 min-w-0 w-full space-y-6">
                {/* Encyclopedic Article Introduction */}
                <div className="text-xs sm:text-[13px] text-[#202122] leading-relaxed space-y-2 border-b border-[#eaecf0] pb-4">
                  <p>
                    <strong>Alarmatron</strong> is an open-architecture temporal alerting apparatus designed for synchronized personal schedules and habitual reminders. Originally conceived as a distraction-free digital timepiece, it operates natively across Android hardware and mobile web environments.
                  </p>
                  <p className="text-[#54595d]">
                    Alerts utilize a zero-latency Web Audio frequency synthesizer simulating Westminster chime bells, digital oscillating pulses, and acoustic harmonic patterns. All configurations persist locally with full offline capability.
                  </p>
                </div>

                {/* Section Header with Wikipedia Hairline Rule */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#a2a9b1] pb-1.5">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl sm:text-2xl font-normal font-wiki-serif text-[#202122]">
                      Scheduled Alarms
                    </h2>
                    <span className="text-xs text-[#54595d]">
                      ({filteredAlarms.length} {filteredAlarms.length === 1 ? 'entry' : 'entries'})
                    </span>
                  </div>

                  {/* Filter Segmented Controls */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#54595d] text-[11px] mr-1 hidden sm:inline">Filter:</span>
                    <button
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 border rounded-xs transition-colors ${
                        filterMode === 'all'
                          ? 'bg-[#3366cc] text-white border-[#3366cc] font-semibold'
                          : 'bg-[#f8f9fa] text-[#54595d] border-[#c8ccd1] hover:bg-[#eaecf0]'
                      }`}
                    >
                      All ({alarms.length})
                    </button>
                    <button
                      onClick={() => setFilterMode('active')}
                      className={`px-2.5 py-1 border rounded-xs transition-colors ${
                        filterMode === 'active'
                          ? 'bg-[#14866d] text-white border-[#14866d] font-semibold'
                          : 'bg-[#f8f9fa] text-[#54595d] border-[#c8ccd1] hover:bg-[#eaecf0]'
                      }`}
                    >
                      Active ({activeAlarmsCount})
                    </button>
                    <button
                      onClick={() => setFilterMode('inactive')}
                      className={`px-2.5 py-1 border rounded-xs transition-colors ${
                        filterMode === 'inactive'
                          ? 'bg-[#54595d] text-white border-[#54595d] font-semibold'
                          : 'bg-[#f8f9fa] text-[#54595d] border-[#c8ccd1] hover:bg-[#eaecf0]'
                      }`}
                    >
                      Inactive ({alarms.length - activeAlarmsCount})
                    </button>
                  </div>
                </div>

                {/* Active Snooze Alert Notice if any */}
                {snoozedList.length > 0 && (
                  <div className="bg-[#fff8e7] border border-[#fbe199] p-3 rounded-xs text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#78350f]">
                      <Bell className="w-4 h-4 animate-bounce" />
                      <span>
                        <strong>Snoozed:</strong> {snoozedList.length} alarm(s) will re-ring shortly.
                      </span>
                    </div>
                    <button
                      onClick={() => setSnoozedList([])}
                      className="text-[#3366cc] hover:underline font-medium text-[11px]"
                    >
                      Clear Snoozes
                    </button>
                  </div>
                )}

                {/* List of Alarms */}
                {filteredAlarms.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAlarms.map((alarm) => (
                      <AlarmCard
                        key={alarm.id}
                        alarm={alarm}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                        onTestRing={handleTestRing}
                        currentTime={currentTime}
                      />
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="border border-[#c8ccd1] bg-[#f8f9fa] p-8 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto bg-white border border-[#a2a9b1] rounded-full flex items-center justify-center text-[#54595d]">
                      <Clock className="w-6 h-6 text-[#3366cc]" />
                    </div>
                    <h3 className="font-wiki-serif text-lg font-bold text-[#202122]">
                      No alarms matched this criteria
                    </h3>
                    <p className="text-xs text-[#54595d] max-w-sm mx-auto">
                      {searchQuery
                        ? `No alarm labels or times match "${searchQuery}". Clear your search or create a new alarm.`
                        : 'Your alarm directory is currently empty. Tap the floating add button below to set your first wake-up schedule.'}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterMode('all');
                        setEditingAlarm(null);
                        setCurrentView('create');
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#3366cc] hover:bg-[#2a4b8d] text-white text-xs font-semibold rounded-xs shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Set Alarm Now
                    </button>
                  </div>
                )}

                {/* Wikipedia Footnotes / Citation Section */}
                <div className="pt-6 border-t border-[#eaecf0] text-[11px] text-[#72777d] space-y-1">
                  <div className="font-bold text-[#54595d] uppercase tracking-wider text-[10px]">
                    Technical References & Protocol
                  </div>
                  <p>
                    1. <em>Chronometry Standard</em>: Synchronized with client host system clock via <code className="font-mono">Date.now()</code>.
                  </p>
                  <p>
                    2. <em>Packaging Pipeline</em>: Standalone Android compilation powered by <code className="font-mono">.github/workflows/build-debug-apk.yml</code>.
                  </p>
                </div>
              </div>

              {/* Right Column: Wikipedia Infobox */}
              <WikipediaInfobox
                alarms={alarms}
                currentTime={currentTime}
                onOpenApkGuide={() => setIsApkGuideOpen(true)}
                onTriggerTestAlarm={handleTestRing}
              />
            </div>

            {/* Floating Add Button */}
            <FloatingAddButton
              onClick={() => {
                setEditingAlarm(null);
                setCurrentView('create');
              }}
            />
          </div>
        ) : (
          /* Set / Edit Alarm View */
          <SetAlarmView
            initialAlarm={editingAlarm}
            onSave={handleSaveAlarm}
            onCancel={() => {
              setEditingAlarm(null);
              setCurrentView('list');
            }}
          />
        )}
      </main>

      {/* Fullscreen Ringing Modal */}
      {ringingAlarm && (
        <RingingModal
          alarm={ringingAlarm}
          onDismiss={handleDismissRinging}
          onSnooze={handleSnoozeRinging}
        />
      )}

      {/* GitHub APK Workflow & Keystore Guide Modal */}
      <ApkGuideModal
        isOpen={isApkGuideOpen}
        onClose={() => setIsApkGuideOpen(false)}
      />

      {/* Wikipedia-styled Footer */}
      <footer className="border-t border-[#a2a9b1] bg-[#f8f9fa] py-4 px-4 text-xs text-[#54595d] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="font-medium text-[#202122]">
              Alarmatron — Precision Scheduled Wakefulness
            </p>
            <p className="text-[11px]">
              Text is available under the Creative Commons Attribution-ShareAlike License · Developed with AI Studio, GitHub Actions & Android Phone.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsApkGuideOpen(true)}
              className="text-[#3366cc] hover:underline"
            >
              GitHub APK Specification
            </button>
            <span aria-hidden="true" className="text-[#c8ccd1]">·</span>
            <span className="font-mono text-[#202122]">v1.0.0-debug</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
