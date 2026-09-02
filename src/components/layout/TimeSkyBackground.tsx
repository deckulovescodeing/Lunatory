import React, { useMemo } from 'react';
import { TimeTheme } from '../../types';

interface TimeSkyBackgroundProps {
  themeMode: TimeTheme;
  reducedMotion?: boolean;
}

export const TimeSkyBackground: React.FC<TimeSkyBackgroundProps> = ({
  themeMode,
  reducedMotion = false,
}) => {
  // Determine effective theme (real time vs manual override)
  const currentSky = useMemo(() => {
    if (themeMode !== 'auto_time') {
      return themeMode;
    }
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'sunset';
    return 'night';
  }, [themeMode]);

  // Generate deterministic stars for night sky
  const stars = useMemo(() => {
    const starList = [];
    for (let i = 0; i < 45; i++) {
      const top = ((i * 37 + 13) % 95);
      const left = ((i * 59 + 29) % 98);
      const size = (i % 3) + 1; // 1px, 2px, 3px
      const isTwinkleSlow = i % 2 === 0;
      const opacity = ((i % 5) + 4) / 10; // 0.4 to 0.8
      starList.push({ top, left, size, isTwinkleSlow, opacity });
    }
    return starList;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-colors duration-1000">
      {/* 1. Night Theme (Sophisticated Dark) */}
      {currentSky === 'night' && (
        <div
          className="absolute inset-0 bg-[#0B0E14]"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% -20%, #2D1B4E 0%, #0B0E14 70%)',
          }}
        >
          {/* Twinkling Stars */}
          {stars.map((star, idx) => (
            <div
              key={idx}
              className={`absolute rounded-full bg-white ${
                reducedMotion
                  ? ''
                  : star.isTwinkleSlow
                  ? 'animate-twinkle-slow'
                  : 'animate-twinkle-fast'
              }`}
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                boxShadow: star.size > 2 ? '0 0 6px rgba(255, 255, 255, 0.8)' : 'none',
              }}
            />
          ))}

          {/* Crescent Moon */}
          <div className="absolute top-10 right-14 w-20 h-20 opacity-80">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-[0_0_15px_rgba(253,230,138,0.4)]">
              <path
                d="M75 20 C50 25 35 50 45 80 C25 65 25 35 55 15 C62 16 69 17 75 20 Z"
                fill="#FEF08A"
              />
              <circle cx="56" cy="40" r="1.5" fill="#FDE047" opacity="0.6" />
              <circle cx="48" cy="55" r="2" fill="#FDE047" opacity="0.5" />
            </svg>
          </div>

          {/* Subtle cosmic nebulae glow */}
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* 2. Morning Sunrise Theme */}
      {currentSky === 'morning' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d3a6d] via-[#7e5782] to-[#fdba74]">
          {/* Morning Sunrise Sun */}
          <div className="absolute -bottom-16 left-1/3 w-64 h-64 bg-gradient-to-t from-amber-300 via-orange-300 to-transparent rounded-full blur-2xl opacity-60" />
          
          {/* Gentle morning clouds */}
          <div className="absolute top-20 left-10 w-72 h-20 bg-white/15 rounded-full blur-xl" />
          <div className="absolute top-36 right-20 w-96 h-24 bg-pink-200/20 rounded-full blur-xl" />
          <div className="absolute bottom-40 left-1/4 w-80 h-16 bg-amber-100/20 rounded-full blur-lg" />
        </div>
      )}

      {/* 3. Noon / Day Theme */}
      {currentSky === 'day' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e3a8a] via-[#2563eb] to-[#60a5fa]">
          {/* Radiant daytime sun */}
          <div className="absolute top-8 right-16 w-24 h-24 bg-amber-200 rounded-full blur-lg opacity-70" />
          <div className="absolute top-10 right-18 w-20 h-20 bg-amber-100 rounded-full shadow-[0_0_40px_rgba(253,230,138,0.8)]" />

          {/* Fluffy white clouds */}
          <div className="absolute top-16 left-12 w-64 h-16 bg-white/25 rounded-full blur-md" />
          <div className="absolute top-28 left-28 w-48 h-12 bg-white/30 rounded-full blur-md" />
          <div className="absolute top-44 right-28 w-80 h-20 bg-white/20 rounded-full blur-lg" />
        </div>
      )}

      {/* 4. Sunset / Evening Theme */}
      {currentSky === 'sunset' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e1b4b] via-[#831843] to-[#ea580c]">
          {/* Glowing Sunset Horizon */}
          <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-amber-500/40 via-rose-500/20 to-transparent blur-xl" />
          
          {/* Evening Star */}
          <div className="absolute top-14 left-1/3 text-amber-200 opacity-90 text-sm animate-pulse">
            ✦
          </div>

          {/* Sunset Cloud Streaks */}
          <div className="absolute top-32 left-10 w-96 h-12 bg-amber-300/20 rounded-full blur-md" />
          <div className="absolute top-48 right-16 w-80 h-10 bg-purple-300/20 rounded-full blur-md" />
        </div>
      )}

      {/* Global subtle vignette overlay for crisp card contrast */}
      <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />
    </div>
  );
};
