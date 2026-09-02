import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import { LunaFox, FoxMood } from './LunaFox';

interface FoxTipCardProps {
  mood?: FoxMood;
  greeting?: string;
  tip?: string;
  actionText?: string;
  onAction?: () => void;
  onOpenGuide?: () => void;
  badge?: string;
}

export const FoxTipCard: React.FC<FoxTipCardProps> = ({
  mood = 'greeting',
  greeting = 'Good day at Hardee’s!',
  tip = 'Remember to count walk-in freezer items before the evening rush to keep par levels accurate.',
  actionText,
  onAction,
  onOpenGuide,
  badge = 'Luna Assistant',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-indigo-600/20 border border-indigo-400/30 p-6 text-white shadow-xl backdrop-blur-md"
    >
      {/* Background celestial ambient glow */}
      <div className="absolute top-[-20px] right-[-20px] w-36 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              onClick={onOpenGuide}
              className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 cursor-pointer hover:border-indigo-400/60 transition-all shadow-inner"
              title="Tap to speak with Luna"
            >
              <LunaFox mood={mood} size="sm" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-indigo-300 tracking-wider">
                {badge}
              </p>
              <h3 className="text-sm font-semibold text-white font-heading">
                {greeting}
              </h3>
            </div>
          </div>

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Guide</span>
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed text-indigo-100">
          "{tip}"
        </p>

        {actionText && onAction && (
          <div className="mt-5">
            <button
              onClick={onAction}
              className="w-full sm:w-auto px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
