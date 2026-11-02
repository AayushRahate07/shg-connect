import React, { useEffect, useState } from 'react';
import { Smartphone, X, CheckCircle2 } from 'lucide-react';
import { SupportedLanguage } from '../types/shg';

interface InstallPromptProps {
  language: SupportedLanguage;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ language }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isMr = language === 'mr';

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem('installPromptDismissed')) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If on mobile browser and not standalone and not dismissed, show prompt after 3s
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('installPromptDismissed') && !isStandalone) {
        setIsVisible(true);
      }
    }, 3500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  if (!isVisible) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Manual fallback instructions for Chrome/Safari
      alert(
        isMr
          ? 'तुमच्या ब्राऊझर मेन्यूमधील (⋮ किंवा शेअर) "Add to Home Screen" / "स्क्रीनवर जोडा" पर्याय निवडा.'
          : 'Tap your browser menu (⋮ or Share) and select "Add to Home screen".'
      );
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  return (
    <div className="fixed bottom-18 sm:bottom-6 left-0 right-0 px-3 z-[100] pointer-events-none pb-safe animate-slideUp">
      <div className="max-w-md mx-auto bg-stone-900 text-white rounded-2xl p-4 flex items-center gap-3.5 pointer-events-auto shadow-2xl border border-stone-800">
        <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1.5">
            <span>{isMr ? 'अ‍ॅप मुख्य स्क्रीनवर ठेवा' : 'Add App to Home Screen'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </h3>
          <p className="text-[11px] text-stone-300 font-medium leading-tight mt-0.5">
            {isMr
              ? 'इंटरनेट नसले तरीही बचत वही व पासबुक सुरळीत चालेल.'
              : 'Works offline without internet. Quick 1-tap access.'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleDismiss}
            className="p-1.5 text-stone-400 hover:text-stone-200 transition text-xs font-semibold"
            title={isMr ? 'नंतर' : 'Later'}
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleInstall}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition"
          >
            {isMr ? 'स्क्रीनवर ठेवा' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  );
};
