import React, { useState } from 'react';
import { ArrowLeft, Clock, Moon, Smartphone, Volume2, RotateCcw, Info, ShieldAlert } from 'lucide-react';
import { AppSettings } from '../types';
import { playDefaultChime } from '../utils/audioEngine';
import { requestDisplayOverOtherApps, requestDeviceAdministrator } from '../utils/androidUtils';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetAlarms: () => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAlarms,
  onBack,
}) => {
  const [showAdminNotice, setShowAdminNotice] = useState(false);

  const handleRequestOverlay = async () => {
    await requestDisplayOverOtherApps();
    onUpdateSettings({ ...settings, overlayPermissionGranted: true });
  };

  const handleToggleAdmin = async () => {
    if (!settings.deviceAdminEnabled) {
      setShowAdminNotice(true);
    } else {
      onUpdateSettings({ ...settings, deviceAdminEnabled: false });
    }
  };

  const confirmAdmin = async () => {
    setShowAdminNotice(false);
    await requestDeviceAdministrator();
    onUpdateSettings({ ...settings, deviceAdminEnabled: true });
  };

  return (
    <div className="max-w-md mx-auto pb-20">
      {/* Header */}
      <div className="border-b border-[#a2a9b1] pb-3 mb-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#3366cc] hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Alarms
        </button>
        <h2 className="text-xl font-normal font-wiki-serif text-[#202122]">
          Settings
        </h2>
        <div className="w-16" />
      </div>

      <div className="space-y-4">
        {/* Time Format */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs">
          <h3 className="font-wiki-serif text-sm font-bold text-[#202122] mb-2 pb-1.5 border-b border-[#eaecf0] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#3366cc]" />
            Time Format
          </h3>
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-[#202122]">
                24-Hour Clock
              </div>
              <div className="text-[11px] text-[#54595d]">
                Show 14:30 instead of 2:30 PM
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  use24HourFormat: !settings.use24HourFormat,
                })
              }
              className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${
                settings.use24HourFormat ? 'bg-[#14866d]' : 'bg-[#c8ccd1]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                  settings.use24HourFormat ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Android Permissions & Device Administrator */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs space-y-3">
          <h3 className="font-wiki-serif text-sm font-bold text-[#202122] pb-1.5 border-b border-[#eaecf0] flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#3366cc]" />
            Android Permissions & Anti-Uninstall
          </h3>

          {/* Display Over Other Apps */}
          <div className="flex items-center justify-between py-1">
            <div className="pr-2">
              <div className="text-xs font-semibold text-[#202122]">
                Display Over Other Apps
              </div>
              <div className="text-[11px] text-[#54595d]">
                Allow full-screen alarm ringing over lock screen or apps
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestOverlay}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors shrink-0 ${
                settings.overlayPermissionGranted
                  ? 'bg-[#e8f6f3] border-[#14866d] text-[#14866d]'
                  : 'bg-white border-[#a2a9b1] text-[#3366cc] hover:bg-[#eaecf0]'
              }`}
            >
              {settings.overlayPermissionGranted ? 'Allowed' : 'Grant'}
            </button>
          </div>

          {/* Device Admin */}
          <div className="flex items-center justify-between py-1 border-t border-[#eaecf0]">
            <div className="pr-2">
              <div className="text-xs font-semibold text-[#202122] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#78350f]" />
                Device Administrator
              </div>
              <div className="text-[11px] text-[#54595d]">
                Prevents quickly uninstalling the app in the morning
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleAdmin}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors shrink-0 ${
                settings.deviceAdminEnabled
                  ? 'bg-[#14866d] text-white border-[#14866d]'
                  : 'bg-white border-[#a2a9b1] text-[#202122] hover:bg-[#eaecf0]'
              }`}
            >
              {settings.deviceAdminEnabled ? 'Active' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Snooze & Sound Defaults */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs space-y-3">
          <h3 className="font-wiki-serif text-sm font-bold text-[#202122] pb-1.5 border-b border-[#eaecf0] flex items-center gap-2">
            <Moon className="w-4 h-4 text-[#3366cc]" />
            Alarm Defaults
          </h3>

          {/* Snooze duration */}
          <div>
            <div className="text-xs font-semibold text-[#202122] mb-1.5">
              Default Snooze
            </div>
            <div className="flex items-center gap-1.5">
              {[5, 10, 15, 20].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      defaultSnoozeMinutes: mins,
                    })
                  }
                  className={`flex-1 py-1 text-xs font-medium border rounded-xs transition-colors ${
                    settings.defaultSnoozeMinutes === mins
                      ? 'border-[#3366cc] bg-[#3366cc] text-white'
                      : 'border-[#c8ccd1] bg-[#f8f9fa] text-[#202122] hover:bg-[#eaecf0]'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Vibrate */}
          <div className="flex items-center justify-between py-1 border-t border-[#eaecf0]">
            <div>
              <div className="text-xs font-semibold text-[#202122]">
                Vibrate on Alarm
              </div>
              <div className="text-[11px] text-[#54595d]">
                Haptic vibration when ringing
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  vibrateByDefault: !settings.vibrateByDefault,
                })
              }
              className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${
                settings.vibrateByDefault ? 'bg-[#14866d]' : 'bg-[#c8ccd1]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                  settings.vibrateByDefault ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound test */}
          <div className="flex items-center justify-between py-1 border-t border-[#eaecf0]">
            <div>
              <div className="text-xs font-semibold text-[#202122]">
                Test Sound Output
              </div>
              <div className="text-[11px] text-[#54595d]">
                Play tone to test device volume
              </div>
            </div>
            <button
              type="button"
              onClick={() => playDefaultChime()}
              className="px-3 py-1.5 text-xs font-semibold text-[#3366cc] bg-[#f0f4fc] hover:bg-[#e1ecfc] border border-[#c0d4f6] rounded-xs flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Play
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="border border-[#a2a9b1] bg-white p-4 shadow-2xs">
          <h3 className="font-wiki-serif text-sm font-bold text-[#202122] mb-2 pb-1.5 border-b border-[#eaecf0] flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#54595d]" />
            Data Management
          </h3>
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-[#202122]">
                Reset Default Alarms
              </div>
              <div className="text-[11px] text-[#54595d]">
                Restore initial sample alarms
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all alarms to defaults?')) {
                  onResetAlarms();
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-[#202122] bg-[#f8f9fa] hover:bg-[#eaecf0] border border-[#c8ccd1] rounded-xs"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Minimal About */}
        <div className="border border-[#c8ccd1] bg-[#f8f9fa] p-3 text-xs text-[#54595d] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#3366cc] shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-[#202122]">Alarmatron v1.0</div>
            <div className="text-[11px] text-[#72777d]">
              Wikipedia-styled alarm clock with local audio selection and anti-uninstall device administration.
            </div>
          </div>
        </div>
      </div>

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
                onClick={confirmAdmin}
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
