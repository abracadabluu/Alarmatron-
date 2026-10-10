import React, { useEffect, useState } from 'react';
import { Download, Check, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[#14866d] font-medium px-2 py-1 bg-[#e8f6f3] border border-[#a2d8ce] rounded-sm">
        <Check className="w-3.5 h-3.5" />
        Installed App
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General instructions fallback
      alert('To install Alarmatron: In Chrome on Android, tap the ⋮ menu and select "Install app" or "Add to Home screen".');
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install Alarmatron as Android PWA on your home screen"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#202122] bg-[#f8f9fa] hover:bg-[#eaecf0] active:bg-[#c8ccd1] border border-[#a2a9b1] rounded-sm transition-colors shadow-xs"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#3366cc]" />
        <span>Install PWA</span>
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-[#a2a9b1] p-5 shadow-xl text-left">
            <h3 className="text-base font-bold font-wiki-serif text-[#202122] mb-2 border-b border-[#a2a9b1] pb-1">
              Add to Home Screen
            </h3>
            <p className="text-xs text-[#54595d] leading-relaxed mb-4">
              1. Tap the <strong>Share</strong> button in Safari's toolbar.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Tap <strong>Add</strong> to use Alarmatron with offline alarms.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-1.5 text-xs font-medium bg-[#3366cc] text-white rounded-sm hover:bg-[#2a4b8d]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
