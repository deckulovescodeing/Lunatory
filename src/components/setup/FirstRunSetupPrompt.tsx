import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Store as StoreIcon,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Truck,
  KeyRound,
  Layers,
  Building2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Category, Store, User, UserRole } from '../../types';
import { SoundPlayer } from '../../utils/audio';
import { LunaFox } from '../fox/LunaFox';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const AVATAR_EMOJIS = ['👑', '⚡', '⭐', '🍳', '🦊', '📋', '🎯', '🚀', '🛠️', '💼'];
const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#14b8a6', '#ef4444'];

export const DEFAULT_STARTER_CATEGORIES: Category[] = [
  {
    id: 'cat-meats',
    name: 'Meats & Proteins',
    iconName: 'Beef',
    color: '#EF4444',
    sortOrder: 1,
    description: 'Patties, chicken, bacon, sausages, steaks, deli meats',
  },
  {
    id: 'cat-bakery',
    name: 'Breads & Bakery',
    iconName: 'Wheat',
    color: '#F59E0B',
    sortOrder: 2,
    description: 'Buns, biscuit mixes, sandwich breads, tortillas, crusts',
  },
  {
    id: 'cat-dairy',
    name: 'Dairy & Eggs',
    iconName: 'Milk',
    color: '#3B82F6',
    sortOrder: 3,
    description: 'Cheese slices, milk, butter, liquid eggs, creamers',
  },
  {
    id: 'cat-frozen-sides',
    name: 'Frozen Foods & Sides',
    iconName: 'Utensils',
    color: '#10B981',
    sortOrder: 4,
    description: 'French fries, onion rings, appetizers, frozen sides',
  },
  {
    id: 'cat-produce',
    name: 'Fresh Produce',
    iconName: 'Carrot',
    color: '#84CC16',
    sortOrder: 5,
    description: 'Lettuce, tomatoes, onions, pickles, fresh vegetables',
  },
  {
    id: 'cat-sauces',
    name: 'Sauces & Condiments',
    iconName: 'Droplet',
    color: '#EC4899',
    sortOrder: 6,
    description: 'Signature sauces, dressings, ketchup, mayo, spices',
  },
  {
    id: 'cat-beverage',
    name: 'Beverages & Syrups',
    iconName: 'CupSoda',
    color: '#06B6D4',
    sortOrder: 7,
    description: 'BIB fountain syrups, tea, coffee grounds, shake bases',
  },
  {
    id: 'cat-packaging',
    name: 'Paper & Packaging',
    iconName: 'Package',
    color: '#8B5CF6',
    sortOrder: 8,
    description: 'Cups, lids, bags, sandwich wraps, napkins, boxes',
  },
  {
    id: 'cat-chemicals',
    name: 'Chemicals & Cleaning',
    iconName: 'Sparkles',
    color: '#64748B',
    sortOrder: 9,
    description: 'Sanitizers, degreasers, soap, grill cleaners, trash bags',
  },
];

interface FirstRunSetupPromptProps {
  onComplete: (data: {
    store: Store;
    user: User;
    categories: Category[];
  }) => void;
}

export const FirstRunSetupPrompt: React.FC<FirstRunSetupPromptProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Store Information State
  const [storeName, setStoreName] = useState('');
  const [storeNumber, setStoreNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [truckDays, setTruckDays] = useState<string[]>(['Monday', 'Thursday']);
  const [cutoffTimeStr, setCutoffTimeStr] = useState('14:00');
  const [cutoffDay, setCutoffDay] = useState('Sunday (for Monday delivery)');
  const [vendorNotes, setVendorNotes] = useState('');

  // Primary User / Administrator State
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [title, setTitle] = useState('General Manager / Administrator');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pinCode, setPinCode] = useState('1234');
  const [avatarEmoji, setAvatarEmoji] = useState('👑');
  const [avatarColor, setAvatarColor] = useState('#6366f1');

  // Starter Categories Option
  const [includeStarterCategories, setIncludeStarterCategories] = useState(true);

  const [validationError, setValidationError] = useState('');

  const toggleTruckDay = (day: string) => {
    if (truckDays.includes(day)) {
      if (truckDays.length > 1) {
        setTruckDays(truckDays.filter((d) => d !== day));
      }
    } else {
      setTruckDays([...truckDays, day]);
    }
  };

  const handleNextStep = () => {
    setValidationError('');
    if (activeStep === 1) {
      if (!storeName.trim()) {
        setValidationError('Please enter a restaurant or store name.');
        SoundPlayer.playAlertChime();
        return;
      }
      if (!storeNumber.trim()) {
        setValidationError('Please enter a store or unit number (e.g. 101).');
        SoundPlayer.playAlertChime();
        return;
      }
      if (truckDays.length === 0) {
        setValidationError('Please select at least one delivery day.');
        SoundPlayer.playAlertChime();
        return;
      }
      SoundPlayer.playCountBeep();
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!userName.trim()) {
        setValidationError('Please enter your name.');
        SoundPlayer.playAlertChime();
        return;
      }
      if (!pinCode.trim() || pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
        setValidationError('Please choose a 4-digit numeric security PIN.');
        SoundPlayer.playAlertChime();
        return;
      }
      SoundPlayer.playCountBeep();
      setActiveStep(3);
    }
  };

  const handleFinishSetup = () => {
    const newStoreId = 'store-' + (storeNumber.trim() ? storeNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') : 'main') + '-' + Date.now().toString(36);
    const newUserId = 'user-admin-' + Date.now().toString(36);

    const newStore: Store = {
      id: newStoreId,
      storeNumber: storeNumber.trim() || '101',
      name: storeName.trim() || 'Main Store',
      brand: brand.trim() || 'Restaurant',
      address: address.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zip: zip.trim(),
      phone: phone.trim(),
      truckDays: truckDays.length > 0 ? truckDays : ['Monday', 'Thursday'],
      orderCutoffHours: 14,
      cutoffHour: 14,
      cutoffDay: cutoffDay.trim() || 'Sunday',
      cutoffTimeStr: cutoffTimeStr || '14:00',
      defaultParMultiplier: 1.15,
      leadTimeDays: 2,
      notes: vendorNotes.trim() || 'Primary restaurant location.',
    };

    const newUser: User = {
      id: newUserId,
      name: userName.trim() || 'Administrator',
      title: title.trim() || (role === 'admin' ? 'System Administrator' : 'General Manager'),
      email: email.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      role: role,
      employeeId: 'EMP-' + (storeNumber.trim() || '01') + '-01',
      pinCode: pinCode.trim() || '1234',
      avatarEmoji: avatarEmoji,
      avatarColor: avatarColor,
      department: 'Management & Operations',
      preferredShift: 'Morning Opening',
      favoriteItemIds: [],
      shiftNotes: 'Initial setup account.',
      shiftStartTime: new Date().toISOString(),
      storeIds: [newStoreId],
      lastLogin: new Date().toISOString(),
    };

    const chosenCategories = includeStarterCategories ? DEFAULT_STARTER_CATEGORIES : [];

    SoundPlayer.playSuccessFanfare();
    onComplete({
      store: newStore,
      user: newUser,
      categories: chosenCategories,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900/80 via-purple-900/60 to-slate-900 p-6 border-b border-white/10 relative overflow-hidden">
          <div className="absolute right-3 -bottom-4 opacity-20 pointer-events-none">
            <LunaFox mood="happy" size="md" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Clean Slate • First-Time Setup</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome to Lunatory
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Set up your store and manager profile to get started with a fresh, blank inventory.
              </p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-5">
            {[
              { num: 1, label: 'Store Profile' },
              { num: 2, label: 'Manager & PIN' },
              { num: 3, label: 'Preferences' },
            ].map((step) => {
              const isDone = activeStep > step.num;
              const isCurrent = activeStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`flex-1 flex items-center gap-2 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800/40 border-white/5 text-slate-500'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-indigo-500 text-white'
                        : isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : step.num}
                  </span>
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-semibold flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </motion.div>
          )}

          {/* STEP 1: STORE PROFILE */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <StoreIcon className="w-4 h-4" />
                <span>Restaurant & Store Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Restaurant / Store Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hardee's - Harrogate, Downtown Bistro, Store #101"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Store # / Unit ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1102"
                    value={storeNumber}
                    onChange={(e) => setStoreNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Brand / Concept
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hardee's, Quick Service, Franchise"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Store Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Harrogate"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    State / ZIP
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="TN"
                      maxLength={4}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-16 bg-slate-950 border border-white/15 rounded-xl px-2 py-2.5 text-sm text-center text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                    />
                    <input
                      type="text"
                      placeholder="37752"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-2.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Schedule */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Truck Delivery Days (Select all that apply)</span>
                  </span>
                  <span className="text-[11px] text-indigo-300 font-normal">
                    {truckDays.length} day{truckDays.length !== 1 ? 's' : ''} selected
                  </span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = truckDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleTruckDay(day)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                            : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Order Cutoff Time</span>
                  </label>
                  <input
                    type="time"
                    value={cutoffTimeStr}
                    onChange={(e) => setCutoffTimeStr(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cutoff Day Schedule</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sunday (for Tuesday delivery)"
                    value={cutoffDay}
                    onChange={(e) => setCutoffDay(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: USER PROFILE & PIN */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <UserIcon className="w-4 h-4" />
                <span>Primary Manager Account & Security PIN</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Your Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera, Jordan Hayes"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>4-Digit PIN</span> <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="1234"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-amber-400/40 rounded-xl px-3.5 py-2.5 text-sm text-center tracking-widest font-mono text-amber-300 focus:outline-none focus:border-amber-400 font-bold"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Your Role & Permissions</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'admin' as UserRole,
                      label: 'System Administrator (Root)',
                      desc: 'Full local & sync control, store configuration, package releases',
                    },
                    {
                      id: 'gm' as UserRole,
                      label: 'General Manager (GM)',
                      desc: 'Full store operations, truck ordering, team PIN roster management',
                    },
                    {
                      id: 'manager' as UserRole,
                      label: 'Store / Shift Manager',
                      desc: 'Count audits, inventory item updates, waste logging, receiving',
                    },
                    {
                      id: 'lead' as UserRole,
                      label: 'Shift Leader',
                      desc: 'Count submissions, food prep, waste tracker, barcode scanning',
                    },
                  ].map((r) => {
                    const isSelected = role === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-400 shadow-md shadow-indigo-600/20'
                            : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{r.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{r.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Job Title / Position
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. General Manager, Store Owner"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. manager@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium"
                  />
                </div>
              </div>

              {/* Avatar Emoji & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Avatar Emoji
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatarEmoji(emoji)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-base border transition-all ${
                          avatarEmoji === emoji
                            ? 'bg-indigo-600/40 border-indigo-400 scale-110'
                            : 'bg-slate-950 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Avatar Color
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setAvatarColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-8 h-8 rounded-xl border transition-all ${
                          avatarColor === col
                            ? 'border-white ring-2 ring-indigo-400 scale-110'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREFERENCES & INVENTORY CATEGORIES */}
          {activeStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <Layers className="w-4 h-4" />
                <span>Inventory Categories & Confirmation</span>
              </div>

              {/* Starter Categories Option */}
              <div
                onClick={() => setIncludeStarterCategories(!includeStarterCategories)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  includeStarterCategories
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                    : 'bg-slate-950/60 border-white/10'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border mt-0.5 shrink-0 ${
                    includeStarterCategories
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {includeStarterCategories && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Load 9 Standard Restaurant Category Groups
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Includes standard food service categories (Meats, Breads & Bakery, Dairy & Eggs, Frozen Sides, Fresh Produce, Sauces, Beverages, Packaging, Chemicals).
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {DEFAULT_STARTER_CATEGORIES.map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-lg text-white"
                        style={{ backgroundColor: c.color }}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clean Slate Notice */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100% Clean Slate Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  Your application will launch completely blank with <strong>0 inventory items</strong>, <strong>0 sample waste entries</strong>, and <strong>0 dummy orders</strong>. You can immediately add your own items or scan barcodes to build your inventory.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Setup Summary
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Store Name:</span>
                  <strong className="text-white">{storeName || 'Main Store'} (#{storeNumber || '101'})</strong>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Primary Manager:</span>
                  <strong className="text-white">{userName || 'Administrator'} ({role.toUpperCase()})</strong>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Login PIN:</span>
                  <strong className="text-amber-400 font-mono tracking-widest">{pinCode || '1234'}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Delivery Days:</span>
                  <strong className="text-indigo-300">{truckDays.join(', ')}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-5 sm:p-6 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={() => {
                setValidationError('');
                setActiveStep((prev) => (prev - 1) as any);
                SoundPlayer.playDecrementSound();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Back
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 font-medium">
              Step 1 of 3: Store Information
            </div>
          )}

          {activeStep < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 ml-auto"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishSetup}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-black tracking-wide transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 ml-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Complete Setup & Launch App</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
