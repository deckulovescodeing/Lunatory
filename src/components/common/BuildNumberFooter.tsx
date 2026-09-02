import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ShieldAlert, Sparkles, Terminal, Wrench } from 'lucide-react';
import { SoundPlayer } from '../../utils/audio';

interface BuildNumberFooterProps {
  isDevUnlocked: boolean;
  onUnlockDevMode: () => void;
  onOpenDevTweaks: () => void;
}

export const BuildNumberFooter: React.FC<BuildNumberFooterProps> = ({
  isDevUnlocked,
  onUnlockDevMode,
  onOpenDevTweaks,
}) => {
  const [tapCount, setTapCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const BUILD_VERSION = 'v2.4.0';
  const BUILD_NUMBER = 'Build 2026.09.02-r7';

  const handleTap = () => {
    // If already unlocked, tapping opens dev tweaks modal or gives feedback
    if (isDevUnlocked) {
      SoundPlayer.playCountBeep();
      onOpenDevTweaks();
      return;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    // Audio click feedback
    SoundPlayer.playCountBeep(1 + nextCount * 0.1);

    if (nextCount >= 7) {
      // 7th tap -> UNLOCK!
      setTapCount(0);
      onUnlockDevMode();
      SoundPlayer.playSuccessFanfare();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.9, x: 0.85 },
        });
      } catch (e) {
        // Safe fallback if canvas-confetti is not rendered
      }

      setToastMessage('🚀 Developer Options Unlocked! Now available in Settings.');
      setTimeout(() => setToastMessage(null), 4000);
    } else if (nextCount >= 4) {
      const remaining = 7 - nextCount;
      setToastMessage(`🛠️ You are ${remaining} tap${remaining > 1 ? 's' : ''} away from Developer Options!`);
      setTimeout(() => setToastMessage(null), 2500);

      // Reset counter after 3.5 seconds of inactivity
      resetTimerRef.current = setTimeout(() => {
        setTapCount(0);
        setToastMessage(null);
      }, 3500);
    } else {
      // Gentle counter reset
      resetTimerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 3500);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-4 z-50 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-black shadow-2xl flex items-center gap-2 border border-amber-300"
          >
            <Wrench className="w-4 h-4 text-slate-950 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Build Number in Bottom-Right Corner */}
      <div className="fixed bottom-2 right-3 z-30 select-none pointer-events-auto">
        <button
          onClick={handleTap}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium transition-all backdrop-blur-md border ${
            isDevUnlocked
              ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30 hover:scale-105 shadow-md'
              : 'bg-black/40 text-slate-500 hover:text-slate-300 border-white/5 hover:border-white/10'
          }`}
          title={isDevUnlocked ? 'Developer Mode Active (Tap to open Tweaks)' : 'Tap 7 times to unlock Developer Options'}
        >
          {isDevUnlocked && <Terminal className="w-3 h-3 text-amber-400 animate-pulse" />}
          <span>{BUILD_VERSION} ({BUILD_NUMBER})</span>
          {isDevUnlocked && (
            <span className="px-1 py-0.2 rounded text-[8px] font-extrabold uppercase bg-amber-400 text-slate-950">
              DEV
            </span>
          )}
        </button>
      </div>
    </>
  );
};
