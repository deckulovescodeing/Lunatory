import React from 'react';
import { motion } from 'motion/react';

export type FoxMood = 
  | 'idle'
  | 'happy'
  | 'greeting'
  | 'counting'
  | 'scanning'
  | 'celebrating'
  | 'worried'
  | 'sleepy'
  | 'tech'
  | 'teaching';

interface LunaFoxProps {
  mood?: FoxMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
  showSparkles?: boolean;
}

export const LunaFox: React.FC<LunaFoxProps> = ({
  mood = 'idle',
  size = 'md',
  animated = true,
  className = '',
  onClick,
  showSparkles = true,
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-28 h-28',
    xl: 'w-40 h-40',
  };

  const badgeSizeMap = {
    sm: 'text-[9px] -bottom-1 -right-1 px-1',
    md: 'text-[11px] -bottom-1.5 -right-1.5 px-1.5 py-0.5',
    lg: 'text-xs -bottom-2 -right-2 px-2 py-0.5',
    xl: 'text-sm -bottom-2.5 -right-2.5 px-2.5 py-1',
  };

  // Expression variations
  const isWorried = mood === 'worried';
  const isHappy = mood === 'happy' || mood === 'celebrating' || mood === 'greeting';
  const isSleepy = mood === 'sleepy';
  const isCounting = mood === 'counting';
  const isScanning = mood === 'scanning';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none ${sizeMap[size]} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
      title="Luna - The Inventory Celestial Mascot"
    >
      {/* Background Celestial Aura */}
      {(mood === 'celebrating' || mood === 'happy' || showSparkles) && (
        <div className="absolute inset-0 bg-indigo-500/25 rounded-2xl blur-lg animate-pulse pointer-events-none" />
      )}

      {/* Sparkles on celebrating/happy/idle */}
      {showSparkles && (
        <>
          <motion.div
            animate={animated ? { y: [-2, 2, -2], opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] } : {}}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-1.5 -right-1.5 text-amber-300 pointer-events-none text-xs z-20"
          >
            ✦
          </motion.div>
          <motion.div
            animate={animated ? { y: [2, -2, 2], opacity: [0.3, 0.9, 0.3], scale: [0.9, 1.3, 0.9] } : {}}
            transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-1 -left-1.5 text-indigo-300 pointer-events-none text-[10px] z-20"
          >
            ★
          </motion.div>
        </>
      )}

      {/* Mascot Image Container with Smooth Animation */}
      <motion.div
        className="w-full h-full relative rounded-2xl overflow-hidden border border-indigo-400/30 shadow-md bg-indigo-950/60"
        animate={
          animated
            ? mood === 'celebrating'
              ? { y: [0, -6, 0, -3, 0], rotate: [0, -2, 2, -1, 0] }
              : mood === 'greeting'
              ? { rotate: [0, 3, -3, 1, 0], y: [0, -2, 0] }
              : isWorried
              ? { x: [-1, 1, -1, 1, 0] }
              : { y: [0, -2.5, 0] }
            : {}
        }
        transition={
          animated
            ? mood === 'celebrating'
              ? { duration: 1.2, repeat: Infinity, repeatDelay: 1 }
              : isWorried
              ? { duration: 0.5, repeat: Infinity }
              : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
      >
        <img
          src="/luna-icon.jpg"
          alt="Luna Mascot"
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />

        {/* Dynamic Mood Overlays */}
        {isSleepy && (
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-[0.5px] flex items-center justify-center">
            <span className="text-indigo-200 font-bold text-xs animate-pulse">zzz...</span>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 bg-sky-500/20 flex flex-col justify-center items-center">
            <div className="w-full h-0.5 bg-sky-300 shadow-[0_0_8px_#38bdf8] animate-pulse" />
          </div>
        )}

        {isWorried && (
          <div className="absolute top-1 right-1 text-sky-400 text-xs animate-bounce">
            💧
          </div>
        )}
      </motion.div>

      {/* Mood Emoji / Activity Badge */}
      {mood !== 'idle' && (
        <span
          className={`absolute rounded-full font-bold shadow-md z-20 flex items-center justify-center ${badgeSizeMap[size]} ${
            mood === 'celebrating'
              ? 'bg-amber-400 text-slate-950 border border-amber-300'
              : mood === 'counting'
              ? 'bg-indigo-500 text-white border border-indigo-400'
              : mood === 'scanning'
              ? 'bg-sky-500 text-white border border-sky-400'
              : mood === 'worried'
              ? 'bg-rose-500 text-white border border-rose-400'
              : mood === 'sleepy'
              ? 'bg-purple-600 text-white border border-purple-400'
              : 'bg-indigo-600 text-white border border-indigo-400'
          }`}
        >
          {mood === 'celebrating' && '🎉'}
          {mood === 'counting' && '📋'}
          {mood === 'scanning' && '🔍'}
          {mood === 'worried' && '⚠️'}
          {mood === 'sleepy' && '🌙'}
          {mood === 'greeting' && '✨'}
          {mood === 'happy' && '⭐'}
          {mood === 'tech' && '⚡'}
          {mood === 'teaching' && '💡'}
        </span>
      )}
    </div>
  );
};
