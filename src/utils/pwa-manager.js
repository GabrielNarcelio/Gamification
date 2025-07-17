// PWA Manager - Gerenciador de funcionalidades PWA
export class PWAManager {
  constructor() {
    this.swRegistration = null;
    this.isOnline = navigator.onLine;
    this.installPrompt = null;
    this.isInstalled = false;
    
    this.init();
  }

  async init() {
    console.log('🚀 PWA Manager inicializado');
    
    // Detectar se já está instalado
    this.checkIfInstalled();
    
    // Configurar listeners
    this.setupEventListeners();
    
    // Registrar Service Worker se suportado
    if ('serviceWorker' in navigator) {
      await this.registerServiceWorker();
    }
    
    // Configurar notificações
    this.setupNotifications();
    
    // Configurar background sync
    await this.setupBackgroundSync();
    
    // Configurar auto sync
    this.setupAutoSync();
    
    // Verificar atualizações
    this.checkForUpdates();
    
    console.log('✅ PWA Manager totalmente inicializado com todos os recursos!');
  }

  setupAutoSync() {
    // Sincronizar automaticamente quando ficar online
    window.addEventListener('online', () => {
      this.autoSyncPendingData();
    });
    
    // Sincronizar periodicamente se online
    setInterval(() => {
      if (this.isOnline) {
        this.autoSyncPendingData();
      }
    }, 30000); // A cada 30 segundos
  }

  checkIfInstalled() {
    // Verificar se está rodando como PWA instalada
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true;
    
    if (this.isInstalled) {
      console.log('📱 App rodando como PWA instalada');
      document.body.classList.add('pwa-installed');
    }
  }

  setupEventListeners() {
    // Online/Offline
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNotification('🌐 Conectado', 'success');
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNotification('🔌 Modo Offline', 'warning');
    });

    // Prompt de instalação
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallButton();
    });

    // App instalado
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallButton();
      this.showNotification('🎉 App instalado com sucesso!', 'success');
    });

    // Visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.checkForUpdates();
      }
    });
  }

  async registerServiceWorker() {
    try {
      // Forçar atualização do SW
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Forçar verificação de atualizações
      });
      
      console.log('✅ Service Worker registrado:', this.swRegistration.scope);

      // Verificar atualizações
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateAvailable();
          }
        });
      });

      return this.swRegistration;
    } catch (error) {
      console.error('❌ Falha ao registrar Service Worker:', error);
    }
  }

  setupNotifications() {
    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📬 Permissão de notificação:', permission);
        if (permission === 'granted') {
          this.showNotification('🔔 Notificações ativadas!', 'success');
        }
      });
    }
  }

  // Criar notificação nativa do sistema
  async createSystemNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200],
        tag: 'gamification-app',
        renotify: true,
        ...options
      });

      // Auto-close após 5 segundos
      setTimeout(() => notification.close(), 5000);
      
      return notification;
    }
  }

  // Notificar conquista desbloqueada
  notifyAchievementUnlocked(achievementName) {
    this.createSystemNotification('🏆 Nova Conquista!', {
      body: `Você desbloqueou: ${achievementName}`,
      icon: '/icon.svg'
    });
    
    this.showNotification(`🏆 Conquista desbloqueada: ${achievementName}`, 'success', 5000);
  }

  // Notificar tarefa concluída
  notifyTaskCompleted(taskName, points) {
    this.createSystemNotification('✅ Tarefa Concluída!', {
      body: `${taskName} - +${points} pontos`,
      icon: '/icon.svg'
    });
  }

  // Notificar nova tarefa atribuída
  notifyTaskAssigned(taskName) {
    this.createSystemNotification('📋 Nova Tarefa!', {
      body: `Nova tarefa atribuída: ${taskName}`,
      icon: '/icon.svg'
    });
  }

  async checkForUpdates() {
    if (!this.swRegistration) return;

    try {
      await this.swRegistration.update();
      console.log('🔄 Verificação de atualização concluída');
    } catch (error) {
      console.log('⚠️ Erro ao verificar atualizações:', error);
    }
  }

  showUpdateAvailable() {
    const updateNotification = this.createNotification(
      '🔄 Nova versão disponível!',
      'info',
      [
        {
          text: 'Atualizar',
          action: () => this.applyUpdate()
        },
        {
          text: 'Depois',
          action: () => updateNotification.remove()
        }
      ]
    );
  }

  applyUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      // Instruir SW para skip waiting
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Recarregar página quando novo SW assumir controle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  async installApp() {
    if (this.installPrompt) {
      const result = await this.installPrompt.prompt();
      console.log('📱 Resultado da instalação:', result.outcome);
      
      if (result.outcome === 'accepted') {
        this.installPrompt = null;
        this.hideInstallButton();
      }
    } else {
      // Mostrar instruções manuais
      this.showInstallInstructions();
    }
  }

  showInstallInstructions() {
    const instructions = this.createNotification(
      '📱 Para instalar: Menu do navegador > "Instalar app" ou "Adicionar à tela inicial"',
      'info',
      [
        {
          text: 'OK',
          action: (notification) => notification.remove()
        }
      ]
    );
  }

  showInstallButton() {
    if (this.isInstalled || document.getElementById('pwa-install-btn')) return;

    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.innerHTML = '📱 Instalar App';
    installBtn.className = 'pwa-install-button';
    
    installBtn.addEventListener('click', () => this.installApp());
    
    document.body.appendChild(installBtn);
    
    // Auto-hide após 30 segundos
    setTimeout(() => {
      if (installBtn.parentNode) {
        installBtn.style.opacity = '0';
        setTimeout(() => installBtn.remove(), 300);
      }
    }, 30000);
  }

  hideInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.remove();
  }

  async installApp() {
    if (!this.installPrompt) return;

    try {
      this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      
      console.log('📱 Resultado da instalação:', outcome);
      
      if (outcome === 'accepted') {
        this.showNotification('🎉 App será instalado!', 'success');
      }
      
      this.installPrompt = null;
      this.hideInstallButton();
    } catch (error) {
      console.error('❌ Erro na instalação:', error);
    }
  }

  showNotification(message, type = 'info', duration = 4000) {
    // Remover notificação existente
    const existing = document.querySelector('.pwa-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `pwa-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
    
    return notification;
  }

  createNotification(message, type = 'info', actions = []) {
    const notification = document.createElement('div');
    notification.className = `pwa-notification ${type}`;
    
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    notification.appendChild(messageEl);
    
    if (actions.length > 0) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'notification-actions';
      actionsEl.style.cssText = `
        margin-top: 10px;
        display: flex;
        gap: 10px;
        justify-content: center;
      `;
      
      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.textContent = action.text;
        btn.style.cssText = `
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 5px 15px;
          border-radius: 15px;
          cursor: pointer;
          font-size: 12px;
        `;
        btn.addEventListener('click', action.action);
        actionsEl.appendChild(btn);
      });
      
      notification.appendChild(actionsEl);
    }
    
    document.body.appendChild(notification);
    return notification;
  }

  // Cache Management
  async clearCache() {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      console.log('🧹 Cache limpo com sucesso');
      this.showNotification('🧹 Cache limpo!', 'success');
      
      // Recarregar para aplicar mudanças
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  }

  // Offline Data Sync
  async syncOfflineData() {
    if (!this.isOnline) return;

    try {
      console.log('🔄 Sincronizando dados offline...');
      
      // Verificar se há dados pendentes no localStorage
      const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
      
      if (offlineActions.length > 0) {
        console.log(`📤 Encontradas ${offlineActions.length} ações offline para sincronizar`);
        
        let syncedCount = 0;
        for (const action of offlineActions) {
          try {
            await this.executeOfflineAction(action);
            syncedCount++;
          } catch (error) {
            console.error('❌ Erro ao sincronizar ação:', action, error);
          }
        }
        
        if (syncedCount > 0) {
          // Remover ações sincronizadas
          localStorage.setItem('offlineActions', '[]');
          this.showNotification(`✅ ${syncedCount} ação(ões) sincronizada(s)!`, 'success');
          
          // Forçar atualização dos dados
          if (window.stateManager) {
            window.stateManager.triggerDataRefresh('sync_completed');
          }
        }
      }
      
      console.log('✅ Sincronização offline concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      this.showNotification('❌ Erro na sincronização offline', 'error');
    }
  }

  async executeOfflineAction(action) {
    // Importar dinamicamente a API para executar ações offline
    const { api } = await import('../services/api.js');
    
    switch (action.type) {
      case 'task_complete':
        return await api.completeTask(action.data.taskId, action.data.userId);
      
      case 'task_create':
        return await api.createTask(action.data);
      
      case 'reward_redeem':
        return await api.redeemReward(action.data.rewardId, action.data.userId);
      
      default:
        console.warn('⚠️ Tipo de ação offline desconhecido:', action.type);
    }
  }

  // Salvar ação para sincronização posterior
  saveOfflineAction(type, data) {
    try {
      const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
      offlineActions.push({
        id: Date.now(),
        type,
        data,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('offlineActions', JSON.stringify(offlineActions));
      
      console.log('💾 Ação salva para sincronização offline:', type);
      this.showNotification('💾 Ação salva para quando voltar online', 'info', 2000);
    } catch (error) {
      console.error('❌ Erro ao salvar ação offline:', error);
    }
  }

  // Network Status
  getNetworkStatus() {
    return {
      online: this.isOnline,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
    };
  }

  // Storage Info
  async getStorageInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: Math.round((estimate.usage / estimate.quota) * 100)
        };
      } catch (error) {
        console.error('❌ Erro ao obter info de storage:', error);
      }
    }
    return null;
  }

  // Utils
  async shareContent(data) {
    if (navigator.share) {
      try {
        await navigator.share(data);
        console.log('📤 Conteúdo compartilhado');
      } catch (error) {
        console.log('❌ Compartilhamento cancelado ou falhou');
      }
    } else {
      // Fallback para clipboard
      if (navigator.clipboard && data.text) {
        await navigator.clipboard.writeText(data.text);
        this.showNotification('📋 Copiado para clipboard!', 'success');
      }
    }
  }

  // Debug Info
  // Background Sync - sincronização quando a conexão retornar
  async setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-offline-data');
        console.log('🔄 Background sync registrado');
      } catch (error) {
        console.log('❌ Background sync não suportado:', error);
      }
    }
  }

  // Registrar sincronização específica
  async registerBackgroundSync(tag) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log(`🔄 Background sync registrado: ${tag}`);
      } catch (error) {
        console.log(`❌ Erro ao registrar sync ${tag}:`, error);
      }
    }
  }

  // Sincronizar dados pendentes automaticamente
  async autoSyncPendingData() {
    const pendingData = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    
    if (pendingData.length > 0) {
      console.log(`🔄 Sincronizando ${pendingData.length} operações pendentes...`);
      
      for (const operation of pendingData) {
        try {
          await this.executeOfflineAction(operation);
          // Remove da lista após sucesso
          const index = pendingData.indexOf(operation);
          pendingData.splice(index, 1);
        } catch (error) {
          console.log('❌ Erro na sincronização:', error);
        }
      }
      
      localStorage.setItem('pendingSync', JSON.stringify(pendingData));
      
      if (pendingData.length === 0) {
        this.showNotification('✅ Todos os dados sincronizados!', 'success');
      }
    }
  }

  getDebugInfo() {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      hasServiceWorker: !!this.swRegistration,
      canInstall: !!this.installPrompt,
      notifications: Notification.permission,
      storage: this.getStorageInfo()
    };
  }
}

// Instanciar globalmente
window.pwaManager = new PWAManager();
