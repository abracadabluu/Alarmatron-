/**
 * Android helper for Overlay (Display Over Other Apps) & Device Administrator
 */

export function requestDisplayOverOtherApps(): Promise<boolean> {
  return new Promise((resolve) => {
    // Attempt to open Android Intent if on Android WebView / Chrome
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      try {
        window.location.href =
          'intent:#Intent;action=android.settings.action.MANAGE_OVERLAY_PERMISSION;package=org.alarmatron.app;end';
      } catch (e) {
        console.warn('Could not launch overlay intent directly:', e);
      }
    }

    // Also request Web Notifications if supported as a companion
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().catch(() => {});
    }

    resolve(true);
  });
}

export function requestDeviceAdministrator(): Promise<boolean> {
  return new Promise((resolve) => {
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      try {
        window.location.href =
          'intent:#Intent;action=android.app.action.ADD_DEVICE_ADMIN;component=org.alarmatron.app/.AlarmAdminReceiver;end';
      } catch (e) {
        console.warn('Could not launch device admin intent:', e);
      }
    }
    resolve(true);
  });
}
