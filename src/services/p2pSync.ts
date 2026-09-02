import { NearbyPeer, SyncBundlePayload, UserRole } from '../types';
import QRCode from 'qrcode';

type SyncPayloadHandler = (payload: SyncBundlePayload) => void;
type PeerListChangeHandler = (peers: NearbyPeer[]) => void;

class P2PSyncService {
  private channel: BroadcastChannel | null = null;
  private peerId: string = '';
  private deviceName: string = 'Kitchen Device';
  private userName: string = 'Crew Member';
  private userRole: UserRole = 'crew';
  private activeStoreId: string = 'store-harrogate-1102';
  private peers: Map<string, NearbyPeer> = new Map();
  private syncHandlers: Set<SyncPayloadHandler> = new Set();
  private peerHandlers: Set<PeerListChangeHandler> = new Set();
  private heartbeatTimer: any = null;
  private isEnabled: boolean = true;

  constructor() {
    this.peerId = this.getOrCreatePeerId();
    this.initChannel();
    this.startHeartbeat();
  }

  private getOrCreatePeerId(): string {
    if (typeof window === 'undefined') return 'peer-server';
    let id = sessionStorage.getItem('lunatory_peer_id');
    if (!id) {
      id = 'peer-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      sessionStorage.setItem('lunatory_peer_id', id);
    }
    return id;
  }

  public init(deviceName: string, userName: string, role: UserRole, activeStoreId: string, enabled: boolean = true) {
    this.deviceName = deviceName || 'Kitchen Device';
    this.userName = userName || 'Crew Member';
    this.userRole = role || 'crew';
    this.activeStoreId = activeStoreId || 'store-harrogate-1102';
    this.isEnabled = enabled;

    if (enabled && !this.heartbeatTimer) {
      this.startHeartbeat();
    } else if (!enabled && this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private initChannel() {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    try {
      this.channel = new BroadcastChannel('lunatory_kitchen_mesh');
      this.channel.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }
  }

  private startHeartbeat() {
    if (typeof window === 'undefined') return;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    // Initial broadcast
    this.broadcastHeartbeat();

    // Heartbeat every 4 seconds
    this.heartbeatTimer = setInterval(() => {
      this.broadcastHeartbeat();
      this.pruneStalePeers();
    }, 4000);
  }

  public getPeerId(): string {
    return this.peerId;
  }

  public getNearbyPeers(): NearbyPeer[] {
    const list = Array.from(this.peers.values());
    // Filter peers seen in the last 15 seconds
    const now = Date.now();
    return list.filter((p) => now - p.lastSeen < 15000 && !p.isSelf);
  }

  private broadcastHeartbeat() {
    if (!this.isEnabled) return;
    const msg = {
      type: 'PEER_ANNOUNCE',
      peerId: this.peerId,
      deviceName: this.deviceName,
      userName: this.userName,
      role: this.userRole,
      activeStoreId: this.activeStoreId,
      timestamp: Date.now(),
    };
    this.postMessage(msg);
  }

  private pruneStalePeers() {
    const now = Date.now();
    let changed = false;
    this.peers.forEach((peer, id) => {
      if (now - peer.lastSeen > 15000) {
        this.peers.delete(id);
        changed = true;
      }
    });
    if (changed) {
      this.notifyPeerHandlers();
    }
  }

  private handleIncomingMessage(msg: any) {
    if (!msg || typeof msg !== 'object') return;

    // Ignore self messages
    if (msg.peerId === this.peerId || msg.sender?.peerId === this.peerId) {
      return;
    }

    if (msg.type === 'PEER_ANNOUNCE') {
      const peer: NearbyPeer = {
        peerId: msg.peerId,
        deviceName: msg.deviceName || 'Hardee’s Terminal',
        userName: msg.userName || 'Crew',
        role: msg.role || 'crew',
        activeStoreId: msg.activeStoreId,
        lastSeen: Date.now(),
        isSelf: false,
      };
      this.peers.set(msg.peerId, peer);
      this.notifyPeerHandlers();
    } else if (msg.type === 'SYNC_BUNDLE') {
      if (msg.payload && typeof msg.payload === 'object') {
        this.notifySyncHandlers(msg.payload);
      }
    }
  }

  private postMessage(msg: any) {
    if (!this.isEnabled) return;
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('Failed to post message to mesh channel', e);
      }
    }
  }

  /**
   * Broadcasts complete or partial store synchronization bundle to all nearby devices.
   */
  public broadcastSyncBundle(payload: SyncBundlePayload) {
    if (!this.isEnabled) return;
    const msg = {
      type: 'SYNC_BUNDLE',
      peerId: this.peerId,
      payload,
    };
    this.postMessage(msg);
  }

  /**
   * Subscribe to incoming synchronization payloads from nearby peers.
   */
  public onSyncReceived(handler: SyncPayloadHandler): () => void {
    this.syncHandlers.add(handler);
    return () => {
      this.syncHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to peer list changes.
   */
  public onPeersChanged(handler: PeerListChangeHandler): () => void {
    this.peerHandlers.add(handler);
    // Send immediate initial list
    handler(this.getNearbyPeers());
    return () => {
      this.peerHandlers.delete(handler);
    };
  }

  private notifySyncHandlers(payload: SyncBundlePayload) {
    this.syncHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (e) {
        console.error('Error in sync handler callback', e);
      }
    });
  }

  private notifyPeerHandlers() {
    const list = this.getNearbyPeers();
    this.peerHandlers.forEach((handler) => {
      try {
        handler(list);
      } catch (e) {
        console.error('Error in peer list handler callback', e);
      }
    });
  }

  /**
   * Generates a compressed QR Code Data URL from a sync payload for camera transfer.
   */
  public async generateQRCodeDataURL(payload: SyncBundlePayload): Promise<string> {
    const jsonStr = JSON.stringify(payload);
    return QRCode.toDataURL(jsonStr, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 380,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  }

  /**
   * Parses scanned QR code text into a validated SyncBundlePayload.
   */
  public parseScannedQRCode(text: string): { success: boolean; payload?: SyncBundlePayload; error?: string } {
    try {
      const parsed = JSON.parse(text);
      if (parsed.data && (parsed.data.inventory || parsed.data.countSessions || parsed.data.wasteEntries)) {
        return { success: true, payload: parsed as SyncBundlePayload };
      }
      return { success: false, error: 'Scanned QR code does not contain a valid Lunatory Sync Bundle.' };
    } catch (e: any) {
      return { success: false, error: 'Could not decode QR payload: ' + e.message };
    }
  }

  public destroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.channel) {
      this.channel.close();
    }
  }
}

export const p2pSync = new P2PSyncService();
