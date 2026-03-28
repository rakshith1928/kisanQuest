import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { GameStateDB, SyncOperation } from './GameStateDB';
import { gameService } from '../services/gameService';

class Synchronizer {
  private isSyncing = false;
  private unsubscribeNetInfo: NetInfoSubscription | null = null;
  private isOnline = false;
  private is2G = false;
  private retryDelayMs = 2000;
  private maxRetryDelayMs = 60000;

  start() {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      this.isOnline = !!state.isConnected && !!state.isInternetReachable;

      // Determine if it's a slow 2G connection for bandwidth awareness
      if (state.type === 'cellular') {
        const cellularGeneration = state.details?.cellularGeneration;
        this.is2G = cellularGeneration === '2g';
      } else {
        this.is2G = false;
      }

      if (this.isOnline) {
        // Reset backoff delay on reconnect
        this.retryDelayMs = 2000;
        this.processQueue();
      }
    });
  }

  stop() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  async processQueue() {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;

    try {
      const queue: SyncOperation[] = await GameStateDB.getSyncQueue();

      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`[SyncManager] Processing queue of size: ${queue.length}. 2G Mode: ${this.is2G}`);

      for (const op of queue) {
        if (!this.isOnline) break; // Stop if connection dropped

        let payload = JSON.parse(op.payload);

        // Bandwidth awareness: delta sync / compression logic placeholder
        // In a real scenario, on 2G we might send a compressed payload or batched delta state
        if (this.is2G) {
          console.log(`[SyncManager] Using reduced payload size mode for 2G network`);
          // Strip out non-essential data...
        }

        let success = false;

        switch (op.type) {
          case 'SYNC_GAME_STATE':
            try {
              await gameService.syncGameState(payload);
              success = true;
            } catch (error) {
              console.error('[SyncManager] Failed to sync game state:', error);
            }
            break;

          default:
            console.warn(`[SyncManager] Unknown sync operation type: ${op.type}`);
            // Remove unknown operations to unblock queue
            success = true;
            break;
        }

        if (success) {
          await GameStateDB.removeSyncOperation(op.id);
          this.retryDelayMs = 2000; // Reset after success
        } else {
          // Break loop on failure to preserve order and retry later
          break;
        }
      }
    } catch (e) {
      console.error('[SyncManager] Error in processQueue:', e);
    } finally {
      this.isSyncing = false;

      // Keep checking if there are still operations left, using exponential backoff if failed
      this.scheduleNextSync();
    }
  }

  private async scheduleNextSync() {
    if (!this.isOnline) return;

    const queue = await GameStateDB.getSyncQueue();
    if (queue.length > 0) {
      console.log(`[SyncManager] Retrying sync in ${this.retryDelayMs}ms`);
      setTimeout(() => {
        this.processQueue();
      }, this.retryDelayMs);

      // Exponential backoff
      this.retryDelayMs = Math.min(this.retryDelayMs * 2, this.maxRetryDelayMs);
    }
  }
}

export const SyncManager = new Synchronizer();
