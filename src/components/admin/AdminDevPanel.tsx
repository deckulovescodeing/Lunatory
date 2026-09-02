import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  Plus,
  CheckCircle2,
  FileCode2,
} from 'lucide-react';
import { AuditLog, Store, User, UserRole } from '../../types';
import { SoundPlayer } from '../../utils/audio';

interface AdminDevPanelProps {
  allStores: Store[];
  allUsers: User[];
  auditLogs: AuditLog[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddStore: (store: Store) => void;
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
  onResetFactoryData,
  onExportDatabaseJSON,
  onImportDatabaseJSON,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'stores' | 'database' | 'audit'>('users');

  // Add User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('crew');
  const [newUserPin, setNewUserPin] = useState('1234');
  const [showAddUser, setShowAddUser] = useState(false);

  // Add Store Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreNum, setNewStoreNum] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [showAddStore, setShowAddStore] = useState(false);

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

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const newStore: Store = {
      id: 'store-' + Date.now(),
      name: newStoreName.trim(),
      storeNumber: newStoreNum.trim() || '1899',
      address: '100 Main St',
      city: newStoreCity.trim() || 'Tazewell',
      state: 'TN',
      zipCode: '37879',
      phoneNumber: '(423) 555-0100',
      truckDays: ['Tuesday', 'Friday'],
      leadTimeDays: 3,
      cutoffHour: 14,
      currencySymbol: '$',
    };

    onAddStore(newStore);
    SoundPlayer.playSuccessFanfare();
    setNewStoreName('');
    setNewStoreNum('');
    setNewStoreCity('');
    setShowAddStore(false);
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
                    <option value="admin">General Manager / Admin</option>
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
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Franchise Store Locations ({allStores.length})
            </h2>
            <button
              onClick={() => setShowAddStore(!showAddStore)}
              className="px-3 py-1.5 bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Location
            </button>
          </div>

          {showAddStore && (
            <form onSubmit={handleCreateStore} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="e.g. Hardee’s - Middlesboro, KY"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Store Number</label>
                  <input
                    type="text"
                    value={newStoreNum}
                    onChange={(e) => setNewStoreNum(e.target.value)}
                    placeholder="e.g. 1820"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">City, State</label>
                  <input
                    type="text"
                    value={newStoreCity}
                    onChange={(e) => setNewStoreCity(e.target.value)}
                    placeholder="Middlesboro, KY"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStore(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 bg-white/5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 rounded-lg"
                >
                  Save Store
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {allStores.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white text-sm">{s.name} (#{s.storeNumber})</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {s.address}, {s.city}, {s.state} • Truck Days: {s.truckDays.join(' & ')}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Active
                </span>
              </div>
            ))}
          </div>
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
