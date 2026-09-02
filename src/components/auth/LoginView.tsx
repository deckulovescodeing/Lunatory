import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  KeyRound,
  Mail,
  Store as StoreIcon,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Users,
  Lock,
  Delete,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Store, User } from '../../types';
import { LunaFox } from '../fox/LunaFox';
import { SoundPlayer } from '../../utils/audio';

interface LoginViewProps {
  allUsers: User[];
  allStores: Store[];
  onLoginSuccess: (user: User, storeId: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  allUsers,
  allStores,
  onLoginSuccess,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(allStores[0]?.id || '');
  const [pinCode, setPinCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isPinMode, setIsPinMode] = useState<boolean>(true);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [showRoster, setShowRoster] = useState<boolean>(false);

  // Email/Password fields
  const [emailInput, setEmailInput] = useState<string>('admin@hardees-harrogate.com');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••');

  // Physical keyboard listener for tablet/workstation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPinMode) return;
      if (e.key >= '0' && e.key <= '9') {
        handleNumClick(e.key);
      } else if (e.key === 'Backspace') {
        handleDeleteDigit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinCode, isPinMode, allUsers, selectedStoreId]);

  const handleNumClick = (digit: string) => {
    if (pinCode.length < 4) {
      const next = pinCode + digit;
      setPinCode(next);
      setErrorMsg('');
      SoundPlayer.playCountBeep();

      if (next.length === 4) {
        verifyUniversalPin(next);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setErrorMsg('');
    SoundPlayer.playDecrementSound();
  };

  const handleClearPin = () => {
    setPinCode('');
    setErrorMsg('');
    SoundPlayer.playDecrementSound();
  };

  const verifyUniversalPin = (pin: string) => {
    // Scan all users to find who owns this PIN
    const found = allUsers.find((u) => u.pinCode === pin);
    if (found) {
      setMatchedUser(found);
      SoundPlayer.playSuccessFanfare();
      setTimeout(() => {
        onLoginSuccess(found, selectedStoreId);
      }, 500);
    } else {
      SoundPlayer.playAlertChime();
      setIsShaking(true);
      setErrorMsg(`PIN "${pin}" is not registered to any employee.`);
      setTimeout(() => {
        setPinCode('');
        setIsShaking(false);
      }, 900);
    }
  };

  const handleDirectUserClick = (user: User) => {
    setPinCode(user.pinCode);
    setMatchedUser(user);
    SoundPlayer.playSuccessFanfare();
    setTimeout(() => {
      onLoginSuccess(user, selectedStoreId);
    }, 400);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = allUsers.find((u) => u.email.toLowerCase() === emailInput.trim().toLowerCase());
    if (found) {
      SoundPlayer.playSuccessFanfare();
      onLoginSuccess(found, selectedStoreId);
    } else {
      SoundPlayer.playAlertChime();
      setErrorMsg('User not found. Please verify email address.');
    }
  };

  const selectedStore = allStores.find((s) => s.id === selectedStoreId) || allStores[0];

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 py-8 relative select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900/95 border border-indigo-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl text-white relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-block relative">
            <LunaFox mood={matchedUser ? 'happy' : 'greeting'} size="lg" className="mx-auto drop-shadow-lg" />
            <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 rounded-full shadow-sm">
              {matchedUser ? '👋 Hello!' : '✨ Work Tablet Kiosk'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading mt-2 tracking-tight">
            Lunatory Inventory Terminal
          </h1>
          <p className="text-xs text-indigo-200/80 font-medium">
            Shared Kitchen & Back-Office Staff Sign-In
          </p>
        </div>

        {/* Store Selection Header Bar */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-slate-300">Terminal Location:</span>
          </div>
          <select
            value={selectedStoreId}
            onChange={(e) => {
              setSelectedStoreId(e.target.value);
              SoundPlayer.playCountBeep();
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
          >
            {allStores.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name} (#{s.storeNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Success Match Banner */}
        {matchedUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-center flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/10"
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-sm"
              style={{ backgroundColor: matchedUser.avatarColor || '#10b981' }}
            >
              {matchedUser.avatarEmoji || '👤'}
            </div>
            <div className="text-left">
              <div className="font-extrabold text-white text-xs">
                Welcome back, {matchedUser.name}!
              </div>
              <div className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
                {matchedUser.title || matchedUser.role} • Unlocking App...
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-2.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs text-center flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* PIN Pad Mode */}
        {isPinMode ? (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs text-slate-300 font-medium">
                Enter your <strong className="text-amber-300 font-bold">4-digit Employee PIN</strong> to unlock your profile
              </span>

              {/* PIN circles indicator with shake animation on error */}
              <div
                className={`flex justify-center gap-4 mt-3 mb-2 transition-transform ${
                  isShaking ? 'animate-bounce text-rose-400' : ''
                }`}
              >
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pinCode.length > idx
                        ? 'bg-amber-400 border-amber-300 scale-125 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                        : isShaking
                        ? 'border-rose-500 bg-rose-950/50'
                        : 'border-slate-600 bg-slate-800/80'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Touch & Tablet Keypad */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[300px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleNumClick(digit)}
                  className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 active:scale-95 border border-slate-700 text-xl font-extrabold text-white transition-all shadow-md flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              {/* Clear / Reset */}
              <button
                onClick={handleClearPin}
                className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 border border-slate-700/60 text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center justify-center"
              >
                Clear
              </button>

              <button
                onClick={() => handleNumClick('0')}
                className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 active:scale-95 border border-slate-700 text-xl font-extrabold text-white transition-all shadow-md flex items-center justify-center"
              >
                0
              </button>

              <button
                onClick={handleDeleteDigit}
                className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 border border-slate-700/60 text-xs font-bold text-rose-300 hover:text-rose-200 flex items-center justify-center gap-1"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Collapsible Quick Roster Reference for Team Members */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowRoster(!showRoster);
                  SoundPlayer.playCountBeep();
                }}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-between px-3 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Team Staff Reference & Quick-Sign In</span>
                </span>
                {showRoster ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {showRoster && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-2 mt-2 pt-1"
                  >
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleDirectUserClick(u)}
                        className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-indigo-950/60 border border-slate-800 hover:border-amber-400/50 text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{u.avatarEmoji || '👤'}</span>
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                                {u.name}
                              </div>
                              <div className="text-[10px] text-slate-400 capitalize">
                                {u.title ? u.title.split(' ')[0] : u.role}
                              </div>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-slate-800 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300 border border-slate-700 transition-colors">
                            {u.pinCode}
                          </span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Switch to Email Login Option */}
            <div className="text-center pt-1">
              <button
                onClick={() => setIsPinMode(false)}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                Need manager email/password login? Tap here
              </button>
            </div>
          </div>
        ) : (
          /* Email / Password Mode */
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Company Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setIsPinMode(true)}
                className="text-amber-400 hover:underline font-bold flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Switch to 4-Digit PIN pad</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>Sign In with Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
