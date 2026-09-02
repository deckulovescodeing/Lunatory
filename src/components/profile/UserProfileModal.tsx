import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  Briefcase,
  Shield,
  Phone,
  Mail,
  Clock,
  KeyRound,
  Star,
  Sparkles,
  Save,
  CheckCircle2,
  Users,
  Timer,
  AlertCircle,
  FileText,
  HeartHandshake,
  Coffee,
  Check,
  ChevronRight,
  Package,
} from 'lucide-react';
import { User, UserRole, Store, InventoryItem, WasteEntry, InventoryCountSession } from '../../types';
import { SoundPlayer } from '../../utils/audio';
import { StorageService } from '../../services/storage';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  activeStore: Store;
  inventory: InventoryItem[];
  wasteEntries: WasteEntry[];
  countSessions: InventoryCountSession[];
  onUpdateUser: (updatedUser: User) => void;
  onSwitchUser: (user: User) => void;
  onSelectInventoryItem?: (item: InventoryItem) => void;
}

const AVATAR_EMOJIS = ['👑', '⭐', '🍳', '🍔', '🦊', '📦', '✨', '⚡', '🍟', '🥤', '☕', '🔥'];
const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#14b8a6', // Teal
];

const JOB_TITLE_PRESETS = [
  'General Manager',
  'Assistant General Manager',
  'Shift Leader',
  'Kitchen Prep Lead',
  'Biscuit Specialist & Baker',
  'Grill Master / Fry Cook',
  'Inventory Specialist & Auditor',
  'Drive-Thru / Front Lead',
  'Team Member',
];

const DEPARTMENT_PRESETS = [
  'Store Management & Operations',
  'Kitchen Prep & Bakery',
  'Grill, Fryer & Assembly Line',
  'Drive-Thru & Front Counter',
  'Inventory & Receiving',
];

const SHIFT_PRESETS = [
  'Morning Opening (5:00 AM - 1:30 PM)',
  'Day / Mid-Shift (10:00 AM - 6:30 PM)',
  'Evening Closing (4:00 PM - 12:30 AM)',
  'Overnight / Deep Clean (11:00 PM - 7:00 AM)',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  activeStore,
  inventory,
  wasteEntries,
  countSessions,
  onUpdateUser,
  onSwitchUser,
  onSelectInventoryItem,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'shift' | 'notes' | 'favorites' | 'switch'>('profile');

  // Profile Form State
  const [name, setName] = useState(currentUser.name);
  const [title, setTitle] = useState(currentUser.title || 'Team Member');
  const [role, setRole] = useState<UserRole>(currentUser.role);
  const [email, setEmail] = useState(currentUser.email);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [department, setDepartment] = useState(currentUser.department || DEPARTMENT_PRESETS[0]);
  const [preferredShift, setPreferredShift] = useState(currentUser.preferredShift || SHIFT_PRESETS[0]);
  const [emergencyContact, setEmergencyContact] = useState(currentUser.emergencyContact || '');
  const [avatarEmoji, setAvatarEmoji] = useState(currentUser.avatarEmoji || '⭐');
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || '#6366f1');
  const [pinCode, setPinCode] = useState(currentUser.pinCode);
  const [shiftNotes, setShiftNotes] = useState(currentUser.shiftNotes || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Break / Shift Timer State
  const [breakTimerSec, setBreakTimerSec] = useState<number | null>(null);
  const [isBreakRunning, setIsBreakRunning] = useState(false);

  // Sync state when currentUser prop changes
  useEffect(() => {
    setName(currentUser.name);
    setTitle(currentUser.title || (currentUser.role === 'admin' ? 'General Manager' : currentUser.role === 'manager' ? 'Shift Leader' : 'Team Member'));
    setRole(currentUser.role);
    setEmail(currentUser.email);
    setPhoneNumber(currentUser.phoneNumber || '');
    setDepartment(currentUser.department || DEPARTMENT_PRESETS[0]);
    setPreferredShift(currentUser.preferredShift || SHIFT_PRESETS[0]);
    setEmergencyContact(currentUser.emergencyContact || '');
    setAvatarEmoji(currentUser.avatarEmoji || '⭐');
    setAvatarColor(currentUser.avatarColor || '#6366f1');
    setPinCode(currentUser.pinCode);
    setShiftNotes(currentUser.shiftNotes || '');
  }, [currentUser]);

  // Break timer countdown
  useEffect(() => {
    let interval: any;
    if (isBreakRunning && breakTimerSec !== null && breakTimerSec > 0) {
      interval = setInterval(() => {
        setBreakTimerSec((prev) => {
          if (prev !== null && prev <= 1) {
            setIsBreakRunning(false);
            SoundPlayer.playSuccessFanfare();
            return 0;
          }
          return (prev || 0) - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreakRunning, breakTimerSec]);

  if (!isOpen) return null;

  // Calculate Today's User Activity Stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const myCountsToday = countSessions.filter(
    (s) => s.countedBy?.userId === currentUser.id && (s.date === todayStr || s.startedAt?.startsWith(todayStr))
  ).length;

  const myWasteToday = wasteEntries.filter(
    (w) => w.loggedBy?.userId === currentUser.id && w.timestamp?.startsWith(todayStr)
  );
  const myWasteCostToday = myWasteToday.reduce((sum, w) => sum + (w.totalCost || 0), 0);

  // Favorite Items list
  const favoriteItems = (currentUser.favoriteItemIds || [])
    .map((id) => inventory.find((i) => i.id === id))
    .filter(Boolean) as InventoryItem[];

  const handleToggleFavorite = (itemId: string) => {
    const currentFavs = currentUser.favoriteItemIds || [];
    let updatedFavs: string[];
    if (currentFavs.includes(itemId)) {
      updatedFavs = currentFavs.filter((id) => id !== itemId);
    } else {
      updatedFavs = [...currentFavs, itemId];
    }
    const updated = { ...currentUser, favoriteItemIds: updatedFavs };
    onUpdateUser(updated);
    SoundPlayer.playCountBeep();
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      alert('Name cannot be empty.');
      return;
    }
    if (pinCode.length !== 4 || isNaN(Number(pinCode))) {
      alert('PIN must be a 4-digit number.');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      title: title.trim(),
      role,
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      department,
      preferredShift,
      emergencyContact: emergencyContact.trim(),
      avatarEmoji,
      avatarColor,
      pinCode,
      shiftNotes: shiftNotes.trim(),
    };

    onUpdateUser(updatedUser);
    SoundPlayer.playSuccessFanfare();
    setSaveSuccessMsg('Profile saved successfully!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleStartBreak = (minutes: number) => {
    setBreakTimerSec(minutes * 60);
    setIsBreakRunning(true);
    SoundPlayer.playCountBeep();
  };

  const handleAppendStamp = (stampText: string) => {
    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const line = `\n[${timeStamp}] ${stampText}`;
    const newNotes = shiftNotes + line;
    setShiftNotes(newNotes);
    const updated = { ...currentUser, shiftNotes: newNotes };
    onUpdateUser(updated);
    SoundPlayer.playCountBeep();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-4xl bg-[#0F141F] border border-slate-700/80 rounded-3xl shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Top Header */}
          <div className="px-6 py-4 bg-[#0B0E14] border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/20"
                style={{ backgroundColor: avatarColor }}
              >
                {avatarEmoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white leading-none">
                    {currentUser.name}
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {currentUser.title || 'Staff Profile'} • {activeStore.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {saveSuccessMsg && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 pb-2 bg-[#0B0E14]/60 border-b border-slate-800/80 overflow-x-auto">
            {[
              { id: 'profile' as const, label: 'Profile & Title', icon: UserIcon },
              { id: 'shift' as const, label: 'Shift Stats & Timer', icon: Clock },
              { id: 'notes' as const, label: 'Shift Handover Notes', icon: FileText },
              { id: 'favorites' as const, label: 'Pinned Items', icon: Star, count: favoriteItems.length },
              { id: 'switch' as const, label: 'Switch Crew Member', icon: Users },
            ].map(({ id, label, icon: Icon, count }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                    SoundPlayer.playCountBeep();
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {count !== undefined && count > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Body Content Container */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {/* 1. PROFILE & TITLE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Visual Avatar & Color Customizer */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Avatar Emoji & Theme Accent
                    </span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/30"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {avatarEmoji}
                    </div>
                  </div>

                  {/* Emoji selection */}
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1.5">Select Profile Icon</span>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setAvatarEmoji(emoji);
                            SoundPlayer.playCountBeep();
                          }}
                          className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all ${
                            avatarEmoji === emoji
                              ? 'bg-indigo-600 ring-2 ring-amber-400 scale-110 shadow-md'
                              : 'bg-slate-800/80 hover:bg-slate-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color selection */}
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-400 block mb-1.5">Select Badge Accent Color</span>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setAvatarColor(color);
                            SoundPlayer.playCountBeep();
                          }}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            avatarColor === color ? 'ring-2 ring-white scale-125 shadow-lg' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Staff Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                      required
                    />
                  </div>

                  {/* Job Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Job Title</span>
                      <span className="text-[10px] text-indigo-400">Presets Available</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. General Manager, Biscuit Specialist"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {JOB_TITLE_PRESETS.slice(0, 4).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setTitle(p);
                            SoundPlayer.playCountBeep();
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* System Role */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Access Level / Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="crew">Crew Member (Counting, Waste, Basic Scans)</option>
                      <option value="manager">Shift Manager (Approve Counts, Waste, Orders)</option>
                      <option value="gm">General Manager (GM) — Full Operational Control</option>
                      <option value="admin">System Admin — Master Server & Local Full Control</option>
                    </select>
                  </div>

                  {/* 4-Digit PIN */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>4-Digit Quick PIN</span>
                      <span className="text-[10px] text-amber-400 font-bold">Terminal Kiosk Login</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        maxLength={4}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-amber-300 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Department / Station</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      {DEPARTMENT_PRESETS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preferred Shift */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Shift Assignment</label>
                    <select
                      value={preferredShift}
                      onChange={(e) => setPreferredShift(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                    >
                      {SHIFT_PRESETS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Work Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Mobile Phone</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="(423) 555-0192"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Emergency Contact Information</label>
                    <div className="relative">
                      <HeartHandshake className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Spouse / Parent Name - (423) 555-0193"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button Bar */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* 2. SHIFT STATS & TIMER TAB */}
            {activeTab === 'shift' && (
              <div className="space-y-6">
                {/* Live Shift Activity Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                        Active Shift Overview
                      </div>
                      <div className="text-lg font-bold text-white mt-0.5">
                        {currentUser.name} • {currentUser.title || 'Shift Leader'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {preferredShift} • {activeStore.name}
                      </div>
                    </div>

                    {/* Break Tracker Timer */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[160px]">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">
                        Break Timer
                      </div>
                      <div className="text-xl font-bold font-mono text-amber-300 my-0.5">
                        {breakTimerSec !== null
                          ? `${Math.floor(breakTimerSec / 60)
                              .toString()
                              .padStart(2, '0')}:${(breakTimerSec % 60).toString().padStart(2, '0')}`
                          : '--:--'}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => handleStartBreak(15)}
                          className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-[10px] text-indigo-200 font-semibold"
                        >
                          15m Break
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartBreak(30)}
                          className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-[10px] text-indigo-200 font-semibold"
                        >
                          30m Meal
                        </button>
                        {breakTimerSec !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setBreakTimerSec(null);
                              setIsBreakRunning(false);
                            }}
                            className="px-2 py-0.5 rounded bg-rose-600/30 text-[10px] text-rose-300 font-semibold"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400 font-medium">Counts Logged Today</div>
                    <div className="text-2xl font-bold text-indigo-300 mt-1">{myCountsToday}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Physical audit sessions</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400 font-medium">Waste Entries Today</div>
                    <div className="text-2xl font-bold text-rose-400 mt-1">
                      {myWasteToday.length}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ${myWasteCostToday.toFixed(2)} recorded loss
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400 font-medium">Station / Assigned Line</div>
                    <div className="text-sm font-bold text-amber-300 mt-1 truncate">
                      {department}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Harrogate Kitchen Line</div>
                  </div>
                </div>

                {/* Recent Shift Activity Log */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-indigo-400" />
                      Shift Activity History
                    </span>
                    <span className="text-[11px] text-slate-400">Today ({todayStr})</span>
                  </div>

                  {myWasteToday.length === 0 && myCountsToday === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No logs submitted yet during this active shift. Start a count or record waste to see activity.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myWasteToday.map((w) => (
                        <div
                          key={w.id}
                          className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">{w.itemName}</span>
                            <span className="text-slate-400 ml-2">
                              {w.quantity} {w.unitType || 'unit'} ({w.reason})
                            </span>
                          </div>
                          <span className="text-rose-400 font-bold">-${w.totalCost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. SHIFT HANDOVER NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      Shift Handover Scratchpad
                    </h3>
                    <p className="text-xs text-slate-400">
                      Quick reminders, freezer temp checks, and handover notes for the incoming shift lead.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveProfile()}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Notes</span>
                  </button>
                </div>

                {/* Quick One-Tap Stamp Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold self-center mr-1">
                    Quick Stamps:
                  </span>
                  {[
                    'Walk-in temp checked: 36°F (Normal)',
                    'Freezer temp checked: -5°F (Normal)',
                    '14 biscuit sheet pans baked & ready',
                    'Chicken tenders thawed in cooler',
                    'Truck delivery received & verified',
                    'Prep station wiped & sanitized',
                  ].map((stamp) => (
                    <button
                      key={stamp}
                      type="button"
                      onClick={() => handleAppendStamp(stamp)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-indigo-300 transition-colors"
                    >
                      + {stamp}
                    </button>
                  ))}
                </div>

                {/* Notes Textarea */}
                <textarea
                  rows={8}
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="Type notes for the next shift (e.g. prep quantities, equipment status, stock levels)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-400 leading-relaxed resize-y"
                />
              </div>
            )}

            {/* 4. PINNED FAVORITE ITEMS TAB */}
            {activeTab === 'favorites' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      My Pinned Quick-Count Items ({favoriteItems.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Star high-velocity products for instant stock inspection and rapid counts during rush hours.
                    </p>
                  </div>
                </div>

                {favoriteItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                    <Star className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <div className="text-xs text-slate-300 font-semibold">No items pinned yet</div>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Choose from common items below to pin them to your personal quick-access toolbar.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {favoriteItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between group hover:border-indigo-500/40 transition-colors"
                      >
                        <div
                          className="cursor-pointer flex-1 mr-2"
                          onClick={() => {
                            if (onSelectInventoryItem) {
                              onSelectInventoryItem(item);
                              onClose();
                            }
                          }}
                        >
                          <div className="font-bold text-xs text-white group-hover:text-indigo-300">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Stock: <strong className="text-slate-200">{item.currentQuantity} {item.unitType}s</strong> (Par: {item.parLevel}) • {item.storageLocation}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(item.id)}
                          className="p-1.5 rounded-lg text-amber-400 hover:bg-white/5"
                          title="Unpin Item"
                        >
                          <Star className="w-4 h-4 fill-amber-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Add Suggestions from Inventory */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Add Common Hardee’s Items to Favorites:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {inventory.slice(0, 6).map((item) => {
                      const isFav = (currentUser.favoriteItemIds || []).includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleFavorite(item.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isFav
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold">{item.name}</div>
                            <div className="text-[10px] text-slate-400">{item.storageLocation}</div>
                          </div>
                          <Star className={`w-4 h-4 ${isFav ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 5. SWITCH CREW MEMBER TAB */}
            {activeTab === 'switch' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Fast Crew Terminal Switcher
                  </h3>
                  <p className="text-xs text-slate-400">
                    Switch active staff session without logging out from the kiosk.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allUsers.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    return (
                      <div
                        key={u.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          isCurrent
                            ? 'bg-indigo-600/20 border-indigo-400/50 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shadow-md"
                            style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                          >
                            {u.avatarEmoji || u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-indigo-300 font-medium">
                              {u.title || u.role}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              PIN: {u.pinCode} • {u.department || 'Store Staff'}
                            </div>
                          </div>
                        </div>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              onSwitchUser(u);
                              SoundPlayer.playSuccessFanfare();
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                          >
                            Switch To
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
