// Gerenciador de Estados de UI e Notificações
export class UIStateManager {
  constructor() {
    this.toastContainer = null;
    this.loadingStates = new Map();
    this.init();
  }

  init() {
    this.createToastContainer();
    this.setupConnectionMonitor();
    this.setupOfflineBanner();
  }

  createToastContainer() {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.className = 'toast-container';
      document.body.appendChild(this.toastContainer);
    }
  }

  // ===== LOADING STATES =====
  showLoading(containerId, message = 'Carregando...') {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (!container) return;

    const loadingHTML = `
      <div class="loading-container" data-loading-for="${containerId}">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
      </div>
    `;

    // Salvar conteúdo original se não existe
    if (!this.loadingStates.has(containerId)) {
      this.loadingStates.set(containerId, container.innerHTML);
    }

    container.innerHTML = loadingHTML;
  }

  hideLoading(containerId) {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (!container) return;

    // Restaurar conteúdo original
    const originalContent = this.loadingStates.get(containerId);
    if (originalContent) {
      container.innerHTML = originalContent;
      this.loadingStates.delete(containerId);
    }
  }

  showSkeleton(containerId, type = 'card') {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (!container) return;

    let skeletonHTML = '';
    
    switch (type) {
      case 'card':
        skeletonHTML = `
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
        `;
        break;
      case 'text':
        skeletonHTML = `
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        `;
        break;
      case 'list':
        skeletonHTML = Array.from({length: 5}, () => `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex: 1;">
              <div class="skeleton skeleton-text"></div>
              <div class="skeleton skeleton-text"></div>
            </div>
          </div>
        `).join('');
        break;
    }

    if (!this.loadingStates.has(containerId)) {
      this.loadingStates.set(containerId, container.innerHTML);
    }

    container.innerHTML = skeletonHTML;
  }

  // ===== ERROR STATES =====
  showError(containerId, title = 'Erro', message = 'Algo deu errado', retryCallback = null) {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (!container) return;

    const retryButton = retryCallback ? `
      <button class="retry-button" onclick="(${retryCallback.toString()})()">
        🔄 Tentar Novamente
      </button>
    ` : '';

    const errorHTML = `
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">${title}</h3>
        <p class="error-message">${message}</p>
        <div class="error-actions">
          ${retryButton}
        </div>
      </div>
    `;

    container.innerHTML = errorHTML;
  }

  showNetworkError(containerId, retryCallback = null) {
    this.showError(
      containerId, 
      'Erro de Conexão', 
      'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.', 
      retryCallback
    );
  }

  // ===== EMPTY STATES =====
  showEmpty(containerId, title = 'Nenhum item encontrado', message = '', actionButton = null) {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (!container) return;

    const action = actionButton ? `
      <div class="empty-actions">
        <button class="btn btn-primary" onclick="${actionButton.onclick}">
          ${actionButton.text}
        </button>
      </div>
    ` : '';

    const emptyHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="empty-title">${title}</h3>
        <p class="empty-message">${message}</p>
        ${action}
      </div>
    `;

    container.innerHTML = emptyHTML;
  }

  // ===== TOAST NOTIFICATIONS =====
  showToast(message, type = 'info', duration = 4000, title = null) {
    const toastId = 'toast-' + Date.now();
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="uiState.removeToast('${toastId}')">&times;</button>
    `;

    this.toastContainer.appendChild(toast);

    // Auto-remove
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toastId);
      }, duration);
    }

    return toastId;
  }

  removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }

  // Métodos de conveniência para toasts
  showSuccess(message, title = null, duration = 4000) {
    return this.showToast(message, 'success', duration, title);
  }

  showError(message, title = null, duration = 6000) {
    return this.showToast(message, 'error', duration, title);
  }

  showWarning(message, title = null, duration = 5000) {
    return this.showToast(message, 'warning', duration, title);
  }

  showInfo(message, title = null, duration = 4000) {
    return this.showToast(message, 'info', duration, title);
  }

  // ===== CONNECTION MONITORING =====
  setupConnectionMonitor() {
    const indicator = document.createElement('div');
    indicator.className = 'connection-status online';
    indicator.id = 'connection-indicator';
    indicator.innerHTML = '🟢 Online';
    indicator.style.display = 'none'; // Inicialmente oculto
    document.body.appendChild(indicator);

    // Mostrar apenas quando offline
    window.addEventListener('offline', () => {
      indicator.className = 'connection-status offline';
      indicator.innerHTML = '🔴 Offline';
      indicator.style.display = 'block';
      this.showOfflineBanner();
    });

    window.addEventListener('online', () => {
      indicator.className = 'connection-status online';
      indicator.innerHTML = '🟢 Reconectado';
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 3000);
      this.hideOfflineBanner();
    });
  }

  setupOfflineBanner() {
    this.offlineBanner = document.createElement('div');
    this.offlineBanner.className = 'offline-banner';
    this.offlineBanner.style.display = 'none';
    this.offlineBanner.innerHTML = `
      <span class="offline-icon">📡</span>
      Você está offline. Algumas funcionalidades podem não estar disponíveis.
    `;
    document.body.appendChild(this.offlineBanner);
  }

  showOfflineBanner() {
    if (this.offlineBanner) {
      this.offlineBanner.style.display = 'block';
    }
  }

  hideOfflineBanner() {
    if (this.offlineBanner) {
      this.offlineBanner.style.display = 'none';
    }
  }

  // ===== PROGRESS BAR =====
  showProgress(containerId, percentage, animated = true) {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (!container) return;

    const progressHTML = `
      <div class="progress-container">
        <div class="progress-bar ${animated ? 'animated' : ''}" style="width: ${percentage}%"></div>
      </div>
    `;

    container.innerHTML = progressHTML;
  }

  updateProgress(containerId, percentage) {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (!container) return;

    const progressBar = container.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
  }

  // ===== UTILITY METHODS =====
  clearContainer(containerId) {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (container) {
      container.innerHTML = '';
      this.loadingStates.delete(containerId);
    }
  }

  restoreContainer(containerId) {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (!container) return;

    const originalContent = this.loadingStates.get(containerId);
    if (originalContent) {
      container.innerHTML = originalContent;
      this.loadingStates.delete(containerId);
    }
  }

  // ===== CONFIRMATION DIALOGS =====
  async showConfirmDialog(message, title = 'Confirmação') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        align-items: center;
        justify-content: center;
      `;

      modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; text-align: center;">
          <div class="modal-header">
            <h3>${title}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="resolveConfirm(false)">Cancelar</button>
            <button class="btn btn-primary" onclick="resolveConfirm(true)">Confirmar</button>
          </div>
        </div>
      `;

      // Função global temporária para resolver a promise
      window.resolveConfirm = (result) => {
        modal.remove();
        delete window.resolveConfirm;
        resolve(result);
      };

      document.body.appendChild(modal);

      // Fechar com ESC
      const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
          window.resolveConfirm(false);
          document.removeEventListener('keydown', handleKeyPress);
        }
      };
      document.addEventListener('keydown', handleKeyPress);
    });
  }

  // ===== CLEANUP =====
  destroy() {
    if (this.toastContainer) {
      this.toastContainer.remove();
    }
    
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
      indicator.remove();
    }
    
    if (this.offlineBanner) {
      this.offlineBanner.remove();
    }
    
    this.loadingStates.clear();
  }
}

// Criar instância global
window.uiState = new UIStateManager();

// Exportar para módulos
export const uiState = window.uiState;
