import React, { useState, useEffect } from 'react';
import { storage as StorageService } from './services/storage';
import {
  AppNotification,
  AppSettings,
  Category,
  InventoryCountSession,
  InventoryItem,
  Store,
  SyncState,
  TruckOrder,
  User,
  WasteEntry,
} from './types';
import { TimeSkyBackground } from './components/layout/TimeSkyBackground';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNavigation, NavTab } from './components/layout/BottomNavigation';
import { LoginView } from './components/auth/LoginView';
import { InventoryDashboard } from './components/dashboard/InventoryDashboard';
import { InventoryList } from './components/inventory/InventoryList';
import { CountMode } from './components/count/CountMode';
import { BarcodeScannerView } from './components/scanner/BarcodeScannerView';
import { WasteTrackerView } from './components/waste/WasteTrackerView';
import { TruckOrderView } from './components/orders/TruckOrderView';
import { TruckDayReceivingView } from './components/orders/TruckDayReceivingView';
import { ReportsView } from './components/reports/ReportsView';
import { AdminDevPanel } from './components/admin/AdminDevPanel';
import { FoxGuideDialog } from './components/fox/FoxGuideDialog';
import { SettingsModal } from './components/settings/SettingsModal';
import { SettingsView } from './components/settings/SettingsView';
import { ItemDetailModal } from './components/inventory/ItemDetailModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { BuildNumberFooter } from './components/common/BuildNumberFooter';
import { DevTweaksModal } from './components/admin/DevTweaksModal';
import { SoundPlayer } from './utils/audio';

export function App() {
  // App State from StorageService
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>(() => StorageService.getUsers());
  const [allStores, setAllStores] = useState<Store[]>(() => StorageService.getStores());
  const [activeStoreId, setActiveStoreId] = useState<string>(() => {
    const user = StorageService.getCurrentUser();
    return user?.activeStoreId || 'store-harrogate-01';
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => StorageService.getInventory(activeStoreId));
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>(() => StorageService.getWasteEntries(activeStoreId));
  const [truckOrders, setTruckOrders] = useState<TruckOrder[]>(() => StorageService.getTruckOrders(activeStoreId));
  const [countSessions, setCountSessions] = useState<InventoryCountSession[]>(() => StorageService.getCountSessions(activeStoreId));
  const [activeCountSession, setActiveCountSession] = useState<InventoryCountSession | null>(() => StorageService.getActiveCountSession());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => StorageService.getNotifications());
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [syncState, setSyncState] = useState<SyncState>(() => StorageService.getSyncState());
  const [auditLogs, setAuditLogs] = useState(() => StorageService.getAuditLogs());

  // UI Nav & Dialog States
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [inspectedItem, setInspectedItem] = useState<InventoryItem | null>(null);
  const [wastePreselectedItem, setWastePreselectedItem] = useState<InventoryItem | null>(null);

  // Hidden Developer Mode (Unlocked via 7-tap build number)
  const [isDevUnlocked, setIsDevUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('lunatory_dev_mode_unlocked') === 'true';
  });
  const [isDevTweaksOpen, setIsDevTweaksOpen] = useState(false);

  // Subscribe to StorageService for real-time local mutations & P2P Mesh sync updates
  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setInventory(StorageService.getInventory(activeStoreId));
      setWasteEntries(StorageService.getWasteEntries(activeStoreId));
      setTruckOrders(StorageService.getTruckOrders(activeStoreId));
      setCountSessions(StorageService.getCountSessions(activeStoreId));
      setActiveCountSession(StorageService.getActiveCountSession());
      setNotifications(StorageService.getNotifications());
      setSettings(StorageService.getSettings());
      setSyncState(StorageService.getSyncState());
      setAuditLogs(StorageService.getAuditLogs());
      setAllStores(StorageService.getStores());
      setAllUsers(StorageService.getUsers());
    });
    return () => unsubscribe();
  }, [activeStoreId]);

  // Initialize audio engine settings on load
  useEffect(() => {
    SoundPlayer.setSettings(!settings.soundEnabled, settings.soundVolume);
  }, [settings]);

  // Refresh inventory whenever store changes
  useEffect(() => {
    setInventory(StorageService.getInventory(activeStoreId));
    setWasteEntries(StorageService.getWasteEntries(activeStoreId));
    setTruckOrders(StorageService.getTruckOrders(activeStoreId));
    setCountSessions(StorageService.getCountSessions(activeStoreId));
    setActiveCountSession(StorageService.getActiveCountSession());
  }, [activeStoreId]);

  const activeStore = allStores.find((s) => s.id === activeStoreId) || allStores[0];

  // Auth Handlers
  const handleLoginSuccess = (user: User, storeId: string) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    setActiveStoreId(storeId);
    setInventory(StorageService.getInventory(storeId));
    setWasteEntries(StorageService.getWasteEntries(storeId));
    setTruckOrders(StorageService.getTruckOrders(storeId));
    SoundPlayer.playSuccessFanfare();
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    SoundPlayer.playFoxChirp();
  };

  const handleSelectStore = (storeId: string) => {
    setActiveStoreId(storeId);
    if (currentUser) {
      const updated = { ...currentUser, activeStoreId: storeId };
      StorageService.updateUser(updated);
      setCurrentUser(updated);
    }
  };

  // Inventory Handlers
  const handleUpdateQuantity = (itemId: string, newQty: number, reason: string) => {
    StorageService.updateItemQuantity(itemId, newQty, reason);
    setInventory(StorageService.getInventory(activeStoreId));
  };

  const handleSaveItem = (item: InventoryItem) => {
    StorageService.saveItem(item);
    setInventory(StorageService.getInventory(activeStoreId));
  };

  const handleAddItem = (item: InventoryItem) => {
    StorageService.saveItem(item);
    setInventory(StorageService.getInventory(activeStoreId));
  };

  const handleDeleteItem = (itemId: string) => {
    StorageService.deleteItem(itemId);
    setInventory(StorageService.getInventory(activeStoreId));
  };

  // Count Session Handlers
  const handleSubmitCountSession = (session: InventoryCountSession) => {
    StorageService.saveCountSession(session);
    setCountSessions(StorageService.getCountSessions(activeStoreId));
    setActiveCountSession(null);
    setInventory(StorageService.getInventory(activeStoreId));
    setCurrentTab('dashboard');
  };

  // Waste Handlers
  const handleLogWaste = (entry: WasteEntry) => {
    StorageService.logWaste(entry);
    setWasteEntries(StorageService.getWasteEntries(activeStoreId));
    setInventory(StorageService.getInventory(activeStoreId));
  };

  const handleOpenWasteForItem = (item: InventoryItem) => {
    setWastePreselectedItem(item);
    setCurrentTab('waste');
  };

  // Truck Orders Handlers
  const handleCreateOrder = (order: TruckOrder) => {
    StorageService.saveTruckOrder(order);
    setTruckOrders(StorageService.getTruckOrders(activeStoreId));
  };

  const handleFinalizeReceiving = (orderId: string, receivedMap: Record<string, number>, notes: string) => {
    StorageService.receiveTruckOrder(orderId, receivedMap, currentUser?.name || 'Staff', notes);
    setTruckOrders(StorageService.getTruckOrders(activeStoreId));
    setInventory(StorageService.getInventory(activeStoreId));
    setCurrentTab('dashboard');
  };

  // Settings & Sync Handlers
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = StorageService.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleToggleOfflineSim = () => {
    const current = StorageService.getSyncState().isOnline;
    StorageService.setOnlineStatus(!current);
    setSyncState(StorageService.getSyncState());
    SoundPlayer.playCountBeep();
  };

  const handleTriggerSync = () => {
    StorageService.triggerSync();
    setSyncState(StorageService.getSyncState());
  };

  // Admin DB Handlers
  const handleResetFactoryData = () => {
    StorageService.resetToFactoryData();
    setInventory(StorageService.getInventory(activeStoreId));
    setAllStores(StorageService.getStores());
    setAllUsers(StorageService.getUsers());
    setWasteEntries(StorageService.getWasteEntries(activeStoreId));
    setTruckOrders(StorageService.getTruckOrders(activeStoreId));
    setCountSessions(StorageService.getCountSessions(activeStoreId));
    setAuditLogs(StorageService.getAuditLogs());
  };

  // CSV Export Utility
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInventoryCSV = () => {
    const headers = 'SKU,Name,Category,Storage Location,Current Qty,Unit,Par Level,Reorder Threshold,Unit Cost,Valuation,Vendor\n';
    const rows = inventory
      .map((i) => {
        const cat = categories.find((c) => c.id === i.categoryId)?.name || '';
        const valuation = ((i.currentQuantity || 0) * (i.costPerUnit || 0)).toFixed(2);
        return `"${i.sku}","${i.name}","${cat}","${i.storageLocation}",${i.currentQuantity ?? 0},"${i.unitType}",${i.parLevel ?? 0},${i.reorderThreshold ?? 0},${i.costPerUnit ?? 0},${valuation},"${i.vendor}"`;
      })
      .join('\n');
    downloadCSV(`Lunatory_Hardees_Inventory_${new Date().toISOString().split('T')[0]}.csv`, headers + rows);
  };

  const handleExportWasteCSV = () => {
    const headers = 'Date,Item Name,Quantity,Unit,Unit Cost,Total Loss,Reason,Logged By,Notes\n';
    const rows = wasteEntries
      .map((w) => `"${w.timestamp}","${w.itemName}",${w.quantity ?? 0},"${w.unitType || ''}",${w.unitCost ?? 0},${(w.totalCost || 0).toFixed(2)},"${w.reason}","${w.loggedBy?.userName || ''}","${w.notes || ''}"`)
      .join('\n');
    downloadCSV(`Lunatory_Waste_Log_${new Date().toISOString().split('T')[0]}.csv`, headers + rows);
  };

  const handleExportCountsCSV = () => {
    const headers = 'Session ID,Date,Completed By,Role,Location,Total Items\n';
    const rows = countSessions
      .map((c) => `"${c.id}","${c.completedAt}","${c.countedBy.userName}","${c.countedBy.role}","${c.location}",${c.totalItemsCounted}`)
      .join('\n');
    downloadCSV(`Lunatory_Count_Audits_${new Date().toISOString().split('T')[0]}.csv`, headers + rows);
  };

  const handleExportDatabaseJSON = () => {
    const jsonStr = StorageService.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lunatory_Database_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    SoundPlayer.playSuccessFanfare();
  };

  const handleImportDatabaseJSON = (jsonStr: string) => {
    StorageService.importDatabaseJSON(jsonStr);
    setInventory(StorageService.getInventory(activeStoreId));
    setAllStores(StorageService.getStores());
    setAllUsers(StorageService.getUsers());
    setWasteEntries(StorageService.getWasteEntries(activeStoreId));
    setTruckOrders(StorageService.getTruckOrders(activeStoreId));
  };

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen relative font-sans text-slate-100 antialiased selection:bg-amber-400 selection:text-slate-950">
        <TimeSkyBackground themeMode={settings.themeMode} reducedMotion={settings.reducedMotion} />
        <LoginView
          allUsers={allUsers}
          allStores={allStores}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  const lowStockCount = inventory.filter((i) => i.currentQuantity <= i.reorderThreshold).length;

  return (
    <div className="min-h-screen relative font-sans text-slate-100 antialiased selection:bg-amber-400 selection:text-slate-950 flex flex-col">
      {/* 1. Dynamic Time-of-Day Sky Canvas Background */}
      <TimeSkyBackground themeMode={settings.themeMode} reducedMotion={settings.reducedMotion} />

      {/* 2. Top Application Header */}
      <AppHeader
        currentUser={currentUser}
        activeStore={activeStore}
        allStores={allStores}
        settings={settings}
        syncState={syncState}
        notifications={notifications}
        onSelectStore={handleSelectStore}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onLogout={handleLogout}
        onNotificationClick={() => {}}
        onMarkAllNotificationsRead={() => {
          StorageService.markAllNotificationsRead();
          setNotifications(StorageService.getNotifications());
        }}
        onTriggerSync={handleTriggerSync}
      />

      {/* 3. Navigation Controls (Top Desktop & Mobile Bottom Bar) */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userRole={currentUser.role}
        lowStockCount={lowStockCount}
        peersCount={syncState.connectedPeersCount || 0}
      />

      {/* 4. Main Active Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-5 pb-20">
        {currentTab === 'dashboard' && (
          <InventoryDashboard
            currentUser={currentUser}
            activeStore={activeStore}
            inventory={inventory}
            categories={categories}
            wasteEntries={wasteEntries}
            truckOrders={truckOrders}
            activeCountSession={activeCountSession}
            syncState={syncState}
            onNavigate={setCurrentTab}
            onOpenItemDetail={setInspectedItem}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryList
            storeId={activeStoreId}
            activeStore={activeStore}
            inventory={inventory}
            categories={categories}
            userRole={currentUser.role}
            onUpdateQuantity={handleUpdateQuantity}
            onSaveItem={handleSaveItem}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onExportCSV={handleExportInventoryCSV}
          />
        )}

        {currentTab === 'count' && (
          <CountMode
            storeId={activeStoreId}
            currentUser={currentUser}
            inventory={inventory}
            categories={categories}
            activeSession={activeCountSession}
            onSaveActiveSession={setActiveCountSession}
            onSubmitCountSession={handleSubmitCountSession}
            onUpdateItemQuantity={(id, qty) => handleUpdateQuantity(id, qty, 'Walk-Around Count')}
            onOpenItemDetail={setInspectedItem}
          />
        )}

        {currentTab === 'scan' && (
          <BarcodeScannerView
            inventory={inventory}
            categories={categories}
            onAddItem={handleAddItem}
            userRole={currentUser.role}
            activeStore={activeStore}
            currentUser={currentUser}
            onOpenItemDetail={setInspectedItem}
            onQuickCountAdd={(itemId) => {
              const item = inventory.find((i) => i.id === itemId);
              if (item) {
                handleUpdateQuantity(itemId, item.currentQuantity + 1, 'Barcode Scan (+1)');
              }
            }}
            onOpenWasteForItem={handleOpenWasteForItem}
            onApplyScannedOrder={(order) => {
              handleCreateOrder(order);
              setCurrentTab('truck_day');
            }}
          />
        )}

        {currentTab === 'waste' && (
          <WasteTrackerView
            storeId={activeStoreId}
            currentUser={currentUser}
            inventory={inventory}
            categories={categories}
            wasteEntries={wasteEntries}
            onLogWaste={handleLogWaste}
            preselectedItem={wastePreselectedItem}
          />
        )}

        {currentTab === 'orders' && (
          <TruckOrderView
            activeStore={activeStore}
            currentUser={currentUser}
            inventory={inventory}
            truckOrders={truckOrders}
            onCreateOrder={handleCreateOrder}
            onUpdateOrderStatus={() => {}}
            onNavigateToTruckDay={() => setCurrentTab('truck_day')}
          />
        )}

        {currentTab === 'truck_day' && (
          <TruckDayReceivingView
            activeStore={activeStore}
            currentUser={currentUser}
            truckOrders={truckOrders}
            inventory={inventory}
            onFinalizeReceiving={handleFinalizeReceiving}
            onBackToOrders={() => setCurrentTab('orders')}
            onImportScannedOrder={(order) => {
              handleCreateOrder(order);
            }}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            activeStore={activeStore}
            inventory={inventory}
            categories={categories}
            wasteEntries={wasteEntries}
            countSessions={countSessions}
            onExportInventoryCSV={handleExportInventoryCSV}
            onExportWasteCSV={handleExportWasteCSV}
            onExportCountsCSV={handleExportCountsCSV}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDevPanel
            allStores={allStores}
            allUsers={allUsers}
            auditLogs={auditLogs}
            onAddUser={(u) => {
              StorageService.saveUser(u);
              setAllUsers(StorageService.getUsers());
            }}
            onUpdateUser={(u) => {
              StorageService.updateUser(u);
              setAllUsers(StorageService.getUsers());
            }}
            onDeleteUser={(uid) => {
              StorageService.deleteUser(uid);
              setAllUsers(StorageService.getUsers());
            }}
            onAddStore={(s) => {
              StorageService.saveStore(s);
              setAllStores(StorageService.getStores());
            }}
            onSaveStore={(s) => {
              StorageService.saveStore(s);
              setAllStores(StorageService.getStores());
            }}
            onDeleteStore={(sid) => {
              StorageService.deleteStore(sid);
              setAllStores(StorageService.getStores());
              if (activeStoreId === sid) {
                const remaining = StorageService.getStores();
                if (remaining.length > 0) {
                  setActiveStoreId(remaining[0].id);
                }
              }
            }}
            onResetFactoryData={handleResetFactoryData}
            onExportDatabaseJSON={handleExportDatabaseJSON}
            onImportDatabaseJSON={handleImportDatabaseJSON}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            activeStore={activeStore}
            settings={settings}
            syncState={syncState}
            onUpdateSettings={handleUpdateSettings}
            onLogout={handleLogout}
            onOpenGuide={() => setIsGuideOpen(true)}
            onToggleOfflineSim={handleToggleOfflineSim}
            isDevUnlocked={isDevUnlocked}
            onOpenDevTweaks={() => setIsDevTweaksOpen(true)}
          />
        )}
      </main>

      {/* 5. Modals & Companions */}
      <FoxGuideDialog
        currentView={currentTab}
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        userRole={currentUser.role}
        storeName={activeStore.name}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        activeStore={activeStore}
        settings={settings}
        syncState={syncState}
        onUpdateSettings={handleUpdateSettings}
        onLogout={handleLogout}
        onOpenGuide={() => {
          setIsSettingsOpen(false);
          setIsGuideOpen(true);
        }}
        onToggleOfflineSim={handleToggleOfflineSim}
      />

      <ItemDetailModal
        item={inspectedItem}
        categories={categories}
        userRole={currentUser.role}
        isOpen={Boolean(inspectedItem)}
        onClose={() => setInspectedItem(null)}
        onUpdateQuantity={handleUpdateQuantity}
        onSaveItem={(updated) => {
          handleSaveItem(updated);
          setInspectedItem(updated);
        }}
        onDeleteItem={(id) => {
          handleDeleteItem(id);
          setInspectedItem(null);
        }}
      />

      {currentUser && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          allUsers={allUsers}
          activeStore={activeStore}
          inventory={inventory}
          wasteEntries={wasteEntries}
          countSessions={countSessions}
          onUpdateUser={(updated) => {
            StorageService.updateUser(updated);
            setCurrentUser(updated);
            setAllUsers(StorageService.getUsers());
          }}
          onSwitchUser={(user) => {
            StorageService.setCurrentUser(user);
            setCurrentUser(user);
          }}
          onSelectInventoryItem={(item) => {
            setInspectedItem(item);
          }}
        />
      )}

      {/* Developer Tweaks & Master Simulator Window */}
      <DevTweaksModal
        isOpen={isDevTweaksOpen}
        onClose={() => setIsDevTweaksOpen(false)}
        inventory={inventory}
        allStores={allStores}
        activeStore={activeStore}
        allUsers={allUsers}
        currentUser={currentUser}
        settings={settings}
        onUpdateInventory={(updated) => {
          setInventory(updated);
        }}
        onUpdateSettings={handleUpdateSettings}
        onSelectUser={(u) => {
          StorageService.setCurrentUser(u);
          setCurrentUser(u);
        }}
        onResetFactoryData={handleResetFactoryData}
        onLockDevMode={() => {
          setIsDevUnlocked(false);
          localStorage.removeItem('lunatory_dev_mode_unlocked');
        }}
      />

      {/* Persistent Build Number in the Bottom Right with 7-Tap Easter Egg Unlocker */}
      <BuildNumberFooter
        isDevUnlocked={isDevUnlocked}
        onUnlockDevMode={() => {
          setIsDevUnlocked(true);
          localStorage.setItem('lunatory_dev_mode_unlocked', 'true');
        }}
        onOpenDevTweaks={() => setIsDevTweaksOpen(true)}
      />
    </div>
  );
}
export default App;
