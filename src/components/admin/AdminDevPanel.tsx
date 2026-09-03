import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Database,
  Users,
  Store as StoreIcon,
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  KeyRound,
  Trash2,
  Edit2,
  Plus,
  CheckCircle2,
  FileCode2,
  MapPin,
  Clock,
  Calendar,
  X,
  AlertTriangle,
  Check,
  Package,
} from 'lucide-react';
import { AuditLog, Store, User, UserRole } from '../../types';
import { SoundPlayer } from '../../utils/audio';
import { storage } from '../../services/storage';
import { CompanionAppDownloadSection } from '../settings/CompanionAppDownloadSection';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface AdminDevPanelProps {
  allStores: Store[];
  allUsers: User[];
  auditLogs: AuditLog[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddStore: (store: Store) => void;
  onSaveStore?: (store: Store) => void;
  onDeleteStore?: (storeId: string) => void;
  onResetFactoryData: () => void;
  onExportDatabaseJSON: () => void;
  onImportDatabaseJSON: (jsonStr: string) => void;
}

export const AdminDevPanel: React.FC<AdminDevPanelProps> = ({
  allStores,
  allUsers,
  auditLogs,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddStore,
  onSaveStore,
  onDeleteStore,
  onResetFactoryData,
  onExportDatabaseJSON,
  onImportDatabaseJSON,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'stores' | 'packages' | 'database' | 'audit'>('users');

  // Add User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('crew');
  const [newUserPin, setNewUserPin] = useState('1234');
  const [showAddUser, setShowAddUser] = useState(false);

  // Edit / Delete Store State
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [showAddStore, setShowAddStore] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // Store Form State
  const [storeFormData, setStoreFormData] = useState<Partial<Store>>({
    name: '',
    storeNumber: '',
    brand: "Hardee's / CKE Restaurants",
    address: '',
    city: '',
    state: 'TN',
    zip: '',
    phone: '',
    truckDays: ['Tuesday', 'Friday'],
    cutoffTimeStr: '14:00',
    cutoffDay: 'Sunday',
    leadTimeDays: 2,
    defaultParMultiplier: 1.15,
    notes: '',
  });

  // JSON Import
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const user: User = {
      id: 'user-' + Date.now(),
      name: newUserName.trim(),
      email: newUserEmail.trim() || `${newUserName.toLowerCase().replace(/\s+/g, '')}@hardees.com`,
      role: newUserRole,
      pinCode: newUserPin || '1234',
      storeIds: [allStores[0]?.id || 'store-harrogate-01'],
      activeStoreId: allStores[0]?.id || 'store-harrogate-01',
    };

    onAddUser(user);
    SoundPlayer.playSuccessFanfare();
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUser(false);
  };

  const handleOpenCreateStore = () => {
    setEditingStore(null);
    setStoreFormData({
      id: 'store-' + Date.now(),
      name: "Hardee's - New Branch",
      storeNumber: String(Math.floor(1000 + Math.random() * 9000)),
      brand: "Hardee's / CKE Restaurants",
      address: '100 Highway 25E',
      city: 'Tazewell',
      state: 'TN',
      zip: '37879',
      phone: '(423) 555-0150',
      truckDays: ['Tuesday', 'Friday'],
      cutoffTimeStr: '14:00',
      cutoffDay: 'Sunday',
      leadTimeDays: 2,
      defaultParMultiplier: 1.15,
      notes: '',
    });
    setShowAddStore(true);
    SoundPlayer.playCountBeep();
  };

  const handleOpenEditStore = (store: Store) => {
    setEditingStore(store);
    setStoreFormData({
      ...store,
      truckDays: store.truckDays || ['Tuesday', 'Friday'],
      cutoffTimeStr: store.cutoffTimeStr || '14:00',
      cutoffDay: store.cutoffDay || 'Sunday',
      leadTimeDays: store.leadTimeDays || 2,
    });
    setShowAddStore(true);
    SoundPlayer.playCountBeep();
  };

  const handleToggleTruckDay = (day: string) => {
    const current = storeFormData.truckDays || [];
    let next: string[];
    if (current.includes(day)) {
      if (current.length === 1) return;
      next = current.filter((d) => d !== day);
    } else {
      next = [...current, day];
    }
    setStoreFormData({ ...storeFormData, truckDays: next });
    SoundPlayer.playCountBeep();
  };

  const handleSaveStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeFormData.name?.trim() || !storeFormData.storeNumber?.trim()) return;

    const storeObj: Store = {
      id: storeFormData.id || (editingStore ? editingStore.id : 'store-' + Date.now()),
      name: storeFormData.name.trim(),
      storeNumber: storeFormData.storeNumber.trim(),
      brand: storeFormData.brand || "Hardee's / CKE Restaurants",
      address: storeFormData.address?.trim() || '6301 Cumberland Gap Pkwy',
      city: storeFormData.city?.trim() || 'Harrogate',
      state: storeFormData.state?.trim() || 'TN',
      zip: storeFormData.zip?.trim() || '37752',
      phone: storeFormData.phone?.trim() || '',
      truckDays: storeFormData.truckDays && storeFormData.truckDays.length > 0 ? storeFormData.truckDays : ['Tuesday', 'Friday'],
      cutoffTimeStr: storeFormData.cutoffTimeStr || '14:00',
      cutoffDay: storeFormData.cutoffDay || 'Sunday',
      leadTimeDays: Number(storeFormData.leadTimeDays) || 2,
      defaultParMultiplier: Number(storeFormData.defaultParMultiplier) || 1.15,
      notes: storeFormData.notes || '',
    };

    if (onSaveStore) {
      onSaveStore(storeObj);
    } else {
      onAddStore(storeObj);
    }

    SoundPlayer.playSuccessFanfare();
    setNoticeMsg(`Store "${storeObj.name}" (#${storeObj.storeNumber}) saved!`);
    setShowAddStore(false);
    setEditingStore(null);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const handleConfirmDeleteStore = () => {
    if (!storeToDelete) return;
    if (allStores.length <= 1) {
      alert('Cannot delete the only remaining store location.');
      return;
    }

    const name = storeToDelete.name;
    if (onDeleteStore) {
      onDeleteStore(storeToDelete.id);
    }
    setStoreToDelete(null);
    SoundPlayer.playDecrementSound();
    setNoticeMsg(`Store "${name}" deleted.`);
    setTimeout(() => setNoticeMsg(null), 3500);
  };

  const handleImportSubmit = () => {
    try {
      onImportDatabaseJSON(importText);
      setImportMsg('Database restored successfully!');
      SoundPlayer.playSuccessFanfare();
      setTimeout(() => setImportMsg(''), 4000);
    } catch (e: any) {
      setImportMsg('Failed to parse JSON: ' + e.message);
      SoundPlayer.playAlertChime();
    }
  };

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* 1. Header */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white font-heading">
              Admin & Developer Control Center
            </h1>
            <p className="text-xs text-slate-400">
              Staff roles, multi-store management, database backups & offline diagnostics
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset to Hardee’s Harrogate initial factory data?')) {
              onResetFactoryData();
              SoundPlayer.playSuccessFanfare();
            }
          }}
          className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Factory Reset Seed Data</span>
        </button>
      </div>

      {/* 2. Sub Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'users', label: 'Staff & PIN Codes', icon: Users },
          { id: 'stores', label: 'Store Locations', icon: StoreIcon },
          { id: 'packages', label: 'Native Packages & Releases', icon: Package },
          { id: 'database', label: 'JSON Backup & Restore', icon: Database },
          { id: 'audit', label: 'Audit Security Log', icon: FileCode2 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setActiveSubTab(id as any);
              SoundPlayer.playCountBeep();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === id
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* 3. Sub Tab Content */}
      {/* 3A. Users & PINs */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Staff Members & Shift Access ({allUsers.length})
            </h2>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-3 py-1.5 bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Staff Member
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleCreateUser} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Taylor Swift"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="name@hardees.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="crew">Crew Member</option>
                    <option value="manager">Shift Manager</option>
                    <option value="gm">General Manager (Full Control)</option>
                    <option value="admin">Administrator (Master Control)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">4-Digit PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 bg-white/5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 rounded-lg"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 font-bold flex items-center justify-center text-white text-xs">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded uppercase font-bold text-[9px] bg-amber-500/20 text-amber-300">
                      {u.role}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      PIN: {u.pinCode}
                    </div>
                  </div>
                  {allUsers.length > 1 && (
                    <button
                      onClick={() => onDeleteUser(u.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3B. Multi-Store Locations */}
      {activeSubTab === 'stores' && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Franchise Store Locations ({allStores.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Manage restaurant stores, delivery truck days, cutoff times, and franchise info
              </p>
            </div>
            <button
              onClick={handleOpenCreateStore}
              className="px-3 py-1.5 bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-amber-300 transition-colors shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Add Location
            </button>
          </div>

          {noticeMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{noticeMsg}</span>
            </div>
          )}

          {/* Store Locations List */}
          <div className="space-y-3">
            {allStores.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{s.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      #{s.storeNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{s.address}, {s.city}, {s.state} {s.zipCode || s.zip || ''}</span>
                    {s.phoneNumber && <span>• {s.phoneNumber}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1 text-indigo-300">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Truck Days: <strong>{(s.truckDays || []).join(' & ') || 'None'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Order Cutoff: <strong>{s.cutoffTimeStr || '14:00'} ({s.cutoffDay || 'Sunday'})</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleOpenEditStore(s)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    title="Edit Store Location & Truck Schedules"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>
                  {allStores.length > 1 && (
                    <button
                      onClick={() => setStoreToDelete(s)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                      title="Delete Store Location"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Store Modal */}
          <AnimatePresence>
            {showAddStore && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl">
                        <StoreIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">
                          {editingStore ? 'Edit Store Location' : 'Add Store Location'}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Configure store identity, delivery dates, and cutoff deadlines
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddStore(false)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveStoreSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Store Name</label>
                        <input
                          type="text"
                          value={storeFormData.name || ''}
                          onChange={(e) => setStoreFormData({ ...storeFormData, name: e.target.value })}
                          placeholder="e.g. Hardee’s - Harrogate, TN"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Store Number</label>
                        <input
                          type="text"
                          value={storeFormData.storeNumber || ''}
                          onChange={(e) => setStoreFormData({ ...storeFormData, storeNumber: e.target.value })}
                          placeholder="e.g. 1820"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Address</label>
                        <input
                          type="text"
                          value={storeFormData.address || ''}
                          onChange={(e) => setStoreFormData({ ...storeFormData, address: e.target.value })}
                          placeholder="6301 Cumberland Gap Pkwy"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">City, State</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={storeFormData.city || ''}
                            onChange={(e) => setStoreFormData({ ...storeFormData, city: e.target.value })}
                            placeholder="Harrogate"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={storeFormData.state || ''}
                            onChange={(e) => setStoreFormData({ ...storeFormData, state: e.target.value })}
                            placeholder="TN"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Truck Delivery Days Multi-Select */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-300">
                        Delivery Truck Days (Select days deliveries arrive)
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = (storeFormData.truckDays || []).includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleToggleTruckDay(day)}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cutoff Time and Order Completion Deadline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-amber-300 mb-1">
                          Order Cutoff Time
                        </label>
                        <input
                          type="time"
                          value={storeFormData.cutoffTimeStr || '14:00'}
                          onChange={(e) => setStoreFormData({ ...storeFormData, cutoffTimeStr: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-amber-300 mb-1">
                          Order Cutoff Day
                        </label>
                        <select
                          value={storeFormData.cutoffDay || 'Sunday'}
                          onChange={(e) => setStoreFormData({ ...storeFormData, cutoffDay: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowAddStore(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-colors"
                      >
                        {editingStore ? 'Save Store Changes' : 'Create Store Location'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Delete Store Confirmation Dialog */}
          <AnimatePresence>
            {storeToDelete && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-rose-400">
                    <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Delete Store Location</h3>
                      <p className="text-xs text-slate-400">This action cannot be undone.</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    Are you sure you want to permanently delete{' '}
                    <strong className="text-white">{storeToDelete.name} (#{storeToDelete.storeNumber})</strong>?
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setStoreToDelete(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDeleteStore}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg transition-colors"
                    >
                      Confirm Delete Store
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3B. Stores */}
      {/* 3B.5. Native Packages & Releases */}
      {activeSubTab === 'packages' && (
        <div>
          <CompanionAppDownloadSection />
        </div>
      )}

      {/* 3C. Database JSON Backup / Restore */}
      {activeSubTab === 'database' && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Database Snapshot & Portability
              </h2>
              <p className="text-xs text-slate-400">
                Export or restore entire Lunatory inventory state as a standalone JSON file
              </p>
            </div>
            <button
              onClick={onExportDatabaseJSON}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Restore from JSON String:
            </label>
            <textarea
              rows={4}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste JSON database backup here..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600"
            />
            {importMsg && (
              <div className="text-xs font-semibold text-amber-300 p-2 rounded-lg bg-amber-500/20">
                {importMsg}
              </div>
            )}
            <button
              onClick={handleImportSubmit}
              disabled={!importText.trim()}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Import & Restore Database</span>
            </button>
          </div>

          {/* Clean Slate Wipe */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Wipe Database & Return to Blank Setup Wizard</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Prepares the application to be shared or exported as a clean slate with zero personal data.
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Wipe all local data and return to the First-Run Setup Wizard?')) {
                  storage.resetToBlankSetup();
                  SoundPlayer.playSuccessFanfare();
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Wipe & Restart Blank Setup</span>
            </button>
          </div>
        </div>
      )}

      {/* 3D. Audit Logs */}
      {activeSubTab === 'audit' && (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-md space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            System & User Audit Trail ({auditLogs.length})
          </h2>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300 uppercase">
                      {log.action}
                    </span>
                    <span>{log.details}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    By: <strong className="text-slate-200">{log.userName}</strong> • {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
