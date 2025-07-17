// PWA and offline utilities

/**
 * Enhanced Service Worker management
 */
export class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.onUpdateCallback = null;
  }

  /**
   * Initialize service worker
   */
  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        
        // Check for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              if (this.onUpdateCallback) {
                this.onUpdateCallback();
              }
            }
          });
        });

        // Listen for controlling service worker changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

        console.log('✅ Service Worker registered successfully');
        return this.registration;
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
    return null;
  }

  /**
   * Set callback for when update is available
   */
  onUpdateAvailable(callback) {
    this.onUpdateCallback = callback;
  }

  /**
   * Apply pending update
   */
  applyUpdate() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Check for updates manually
   */
  async checkForUpdates() {
    if (this.registration) {
      await this.registration.update();
    }
  }
}

/**
 * Offline detection and management
 */
export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = {
      online: [],
      offline: []
    };
    this.init();
  }

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerCallbacks('online');
      this.showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.triggerCallbacks('offline');
      this.showConnectionStatus('offline');
    });

    // Initial status check
    this.showConnectionStatus(this.isOnline ? 'online' : 'offline');
  }

  /**
   * Add callback for online/offline events
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  /**
   * Remove callback
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Trigger callbacks for event
   */
  triggerCallbacks(event) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(this.isOnline);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * Show connection status banner
   */
  showConnectionStatus(status) {
    // Remove existing banner
    const existingBanner = document.querySelector('.connection-status-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    // Don't show banner if online
    if (status === 'online') {
      return;
    }

    // Create offline banner
    const banner = document.createElement('div');
    banner.className = 'connection-status-banner offline-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <span class="banner-icon">📡</span>
        <span class="banner-text">Você está offline. Algumas funcionalidades podem estar limitadas.</span>
        <button class="banner-dismiss" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  }

  /**
   * Test connection quality
   */
  async testConnectionQuality() {
    if (!this.isOnline) {
      return { quality: 'offline', speed: 0 };
    }

    try {
      const startTime = performance.now();
      const response = await fetch('/favicon.ico?' + Date.now(), {
        method: 'HEAD',
        cache: 'no-cache'
      });
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      let quality = 'excellent';
      if (responseTime > 2000) quality = 'poor';
      else if (responseTime > 1000) quality = 'fair';
      else if (responseTime > 500) quality = 'good';
      
      return {
        quality,
        speed: responseTime,
        online: response.ok
      };
    } catch (error) {
      return { quality: 'poor', speed: 0, online: false };
    }
  }
}

/**
 * Local storage management with fallbacks
 */
export class StorageManager {
  constructor() {
    this.storage = this.getAvailableStorage();
    this.prefix = 'gamification_';
  }

  /**
   * Detect available storage
   */
  getAvailableStorage() {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return localStorage;
      }
    } catch (e) {
      console.warn('localStorage not available, using memory storage');
    }
    
    // Fallback to memory storage
    const memoryStorage = {};
    return {
      setItem: (key, value) => memoryStorage[key] = value,
      getItem: (key) => memoryStorage[key] || null,
      removeItem: (key) => delete memoryStorage[key],
      clear: () => Object.keys(memoryStorage).forEach(key => delete memoryStorage[key])
    };
  }

  /**
   * Set item with error handling
   */
  set(key, value) {
    try {
      const prefixedKey = this.prefix + key;
      const serializedValue = JSON.stringify({
        value,
        timestamp: Date.now()
      });
      
      this.storage.setItem(prefixedKey, serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      return false;
    }
  }

  /**
   * Get item with error handling
   */
  get(key, defaultValue = null) {
    try {
      const prefixedKey = this.prefix + key;
      const item = this.storage.getItem(prefixedKey);
      
      if (!item) {
        return defaultValue;
      }
      
      const parsed = JSON.parse(item);
      return parsed.value;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return defaultValue;
    }
  }

  /**
   * Remove item
   */
  remove(key) {
    try {
      const prefixedKey = this.prefix + key;
      this.storage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error('Error removing from storage:', error);
      return false;
    }
  }

  /**
   * Clear all app data
   */
  clear() {
    try {
      // Only clear items with our prefix
      const keys = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
      
      keys.forEach(key => this.storage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  getUsageInfo() {
    try {
      let totalSize = 0;
      let appSize = 0;
      let itemCount = 0;

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        const value = this.storage.getItem(key);
        const size = (key + value).length;
        
        totalSize += size;
        
        if (key.startsWith(this.prefix)) {
          appSize += size;
          itemCount++;
        }
      }

      return {
        totalSize,
        appSize,
        itemCount,
        usagePercentage: totalSize > 0 ? Math.round((appSize / totalSize) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { totalSize: 0, appSize: 0, itemCount: 0, usagePercentage: 0 };
    }
  }
}

/**
 * Background sync management
 */
export class BackgroundSyncManager {
  constructor() {
    this.pendingActions = [];
    this.storageKey = 'pending_sync_actions';
    this.loadPendingActions();
  }

  /**
   * Add action to sync queue
   */
  addAction(action) {
    const syncAction = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      action,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    };

    this.pendingActions.push(syncAction);
    this.savePendingActions();
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncPendingActions();
    }

    return syncAction.id;
  }

  /**
   * Process pending sync actions
   */
  async syncPendingActions() {
    if (!navigator.onLine || this.pendingActions.length === 0) {
      return;
    }

    const actionsToSync = [...this.pendingActions];
    
    for (const syncAction of actionsToSync) {
      try {
        await this.executeAction(syncAction.action);
        this.removeAction(syncAction.id);
      } catch (error) {
        console.error('Sync action failed:', error);
        syncAction.retries++;
        
        if (syncAction.retries >= syncAction.maxRetries) {
          console.error('Action exceeded max retries, removing:', syncAction);
          this.removeAction(syncAction.id);
        }
      }
    }

    this.savePendingActions();
  }

  /**
   * Execute sync action
   */
  async executeAction(action) {
    // This would integrate with your API layer
    // For now, just a placeholder
    console.log('Executing sync action:', action);
    
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Sync failed'));
        }
      }, 1000);
    });
  }

  /**
   * Remove action from queue
   */
  removeAction(actionId) {
    this.pendingActions = this.pendingActions.filter(action => action.id !== actionId);
  }

  /**
   * Load pending actions from storage
   */
  loadPendingActions() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.pendingActions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
      this.pendingActions = [];
    }
  }

  /**
   * Save pending actions to storage
   */
  savePendingActions() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  /**
   * Get sync queue status
   */
  getStatus() {
    return {
      pendingCount: this.pendingActions.length,
      actions: this.pendingActions.map(action => ({
        id: action.id,
        timestamp: action.timestamp,
        retries: action.retries,
        type: action.action.type
      }))
    };
  }
}

/**
 * Global PWA utilities instance
 */
export const pwaUtils = {
  serviceWorker: new ServiceWorkerManager(),
  offline: new OfflineManager(),
  storage: new StorageManager(),
  backgroundSync: new BackgroundSyncManager()
};

// Auto-initialize service worker
pwaUtils.serviceWorker.init();

// Auto-sync when coming back online
pwaUtils.offline.on('online', () => {
  pwaUtils.backgroundSync.syncPendingActions();
});

// Show update notification when available
pwaUtils.serviceWorker.onUpdateAvailable(() => {
  if (window.UIManager && window.UIManager.showToast) {
    window.UIManager.showToast(
      'Nova versão disponível! Clique para atualizar.',
      'info',
      {
        duration: 0, // Don't auto-hide
        action: {
          text: 'Atualizar',
          callback: () => pwaUtils.serviceWorker.applyUpdate()
        }
      }
    );
  }
});
