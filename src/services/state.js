// Gerenciador de estado da aplicação

import { ADMIN_CREDENTIALS } from '../utils/config.js';

class StateManager {
  constructor() {
    this.state = {
      user: null,
      userPoints: 0,
      userType: null,
      achievements: [],
      userAchievements: []
    };
    this.listeners = new Set();
    this.cacheCleanupEnabled = true;
    this.initSmartCache();
  }

  // Initialize smart cache integration
  async initSmartCache() {
    try {
      const { smartCache } = await import('../utils/smart-cache-manager.js');
      this.smartCache = smartCache;
      console.log('🧹 Smart cache integrado ao StateManager');
    } catch (error) {
      console.warn('⚠️ Smart cache não disponível:', error);
      this.smartCache = null;
    }
  }

  // ✨ Automatic cache cleanup on state changes (similar to useEffect)
  async triggerCacheCleanup(changeType = 'general') {
    if (!this.cacheCleanupEnabled || !this.smartCache) return;
    
    try {
      console.log(`🧹 Auto-limpeza de cache ativada por mudança de estado: ${changeType}`);
      
      // Smart cache cleanup based on change type (similar to dependency array in useEffect)
      switch (changeType) {
        case 'task_completed':
        case 'task_created':
        case 'task_deleted':
          await this.smartCache.clearSpecificEndpoints(['/api/tasks', '/api/history', '/api/assignments']);
          break;
        
        case 'reward_redeemed':
        case 'reward_created':
          await this.smartCache.clearSpecificEndpoints(['/api/rewards', '/api/history']);
          break;
        
        case 'user_updated':
        case 'points_updated':
          await this.smartCache.clearSpecificEndpoints(['/api/users', '/api/ranking']);
          break;
        
        case 'assignment_changed':
          await this.smartCache.clearSpecificEndpoints(['/api/assignments', '/api/tasks']);
          break;
        
        case 'login':
        case 'logout':
          await this.smartCache.smartClearCache();
          break;
        
        default:
          // General cleanup for unspecified changes
          await this.smartCache.detectAndFixCacheIssues();
      }
      
      console.log(`✅ Cache limpo automaticamente para tipo: ${changeType}`);
    } catch (error) {
      console.warn('⚠️ Erro na limpeza automática de cache:', error);
    }
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // Automatic cache cleanup based on state changes
    this.detectAndTriggerCacheCleanup(oldState, newState);
    
    // Only log if there's a significant change (like lastUpdate)
    if (newState.lastUpdate || newState.user !== oldState.user) {
      console.log('🔄 State updated:', { 
        userChanged: newState.user !== oldState.user,
        lastUpdate: newState.lastUpdate,
        listeners: this.listeners.size 
      });
    }
    this.notifyListeners();
  }

  // ✨ Detect what changed and trigger appropriate cache cleanup
  detectAndTriggerCacheCleanup(oldState, newState) {
    // User login/logout
    if (oldState.user !== newState.user) {
      if (newState.user && !oldState.user) {
        this.triggerCacheCleanup('login');
      } else if (!newState.user && oldState.user) {
        this.triggerCacheCleanup('logout');
      }
    }
    
    // Points changed
    if (oldState.userPoints !== newState.userPoints) {
      this.triggerCacheCleanup('points_updated');
    }
    
    // General data refresh triggered
    if (newState.lastUpdate && newState.lastUpdate !== oldState.lastUpdate) {
      this.triggerCacheCleanup('general');
    }
  }

  subscribe(listener) {
    if (typeof listener !== 'function') {
      console.error('❌ Listener deve ser uma função. Recebido:', typeof listener, listener);
      return () => {}; // Retorna uma função vazia para evitar erros
    }
    
    this.listeners.add(listener);
    // Apenas log se for modo debug
    if (window.location.search.includes('debug=true')) {
      console.log(`✅ Listener adicionado. Total: ${this.listeners.size}`);
    }
    return () => {
      this.listeners.delete(listener);
      if (window.location.search.includes('debug=true')) {
        console.log(`🗑️ Listener removido. Total: ${this.listeners.size}`);
      }
    };
  }

  notifyListeners() {
    // Only log when there are actual listeners and significant changes
    if (this.listeners.size > 0 && (this.state.lastUpdate || this.state.user)) {
      console.log('📢 Notifying', this.listeners.size, 'listeners');
    }
    this.listeners.forEach((listener, index) => {
      try {
        if (typeof listener === 'function') {
          listener(this.getState());
        } else {
          console.warn(`⚠️ Listener ${index} não é uma função:`, typeof listener);
        }
      } catch (error) {
        console.error(`❌ Error in listener ${typeof listener === 'function' ? listener.name || 'anonymous' : 'invalid'}:`, error);
      }
    });
  }

  // Métodos específicos para login/logout
  login(user, points, type) {
    this.setState({
      user,
      userPoints: points,
      userType: type
    });
  }

  loginAsAdmin() {
    const adminUser = {
      id: 'admin',
      name: ADMIN_CREDENTIALS.username,
      password: ADMIN_CREDENTIALS.password,
      type: 'admin',
      points: 0
    };

    this.setState({
      user: adminUser,
      userPoints: 0,
      userType: 'Administrador'
    });
  }

  logout() {
    this.setState({
      user: null,
      userPoints: 0,
      userType: null
    });
  }

  updatePoints(points) {
    // Update both userPoints and user.points if user exists
    const updatedState = { userPoints: points };
    if (this.state.user) {
      updatedState.user = { ...this.state.user, points };
    }
    this.setState(updatedState);
  }

  // ✅ Method to trigger data refresh across all components with specific cache cleanup
  triggerDataRefresh(changeType = 'general') {
    // Force notify all listeners with current state plus a refresh flag
    this.setState({ 
      ...this.state, 
      lastUpdate: Date.now() // Add timestamp to force component updates
    });
    
    // Trigger specific cache cleanup if not already triggered by setState
    if (changeType !== 'general') {
      this.triggerCacheCleanup(changeType);
    }
  }

  // ✨ Specific methods for different types of changes (similar to React actions)
  onTaskCompleted() {
    this.triggerDataRefresh('task_completed');
  }

  onTaskCreated() {
    this.triggerDataRefresh('task_created');
  }

  onTaskDeleted() {
    this.triggerDataRefresh('task_deleted');
  }

  onRewardRedeemed() {
    this.triggerDataRefresh('reward_redeemed');
  }

  onRewardCreated() {
    this.triggerDataRefresh('reward_created');
  }

  onUserUpdated() {
    this.triggerDataRefresh('user_updated');
  }

  onAssignmentChanged() {
    this.triggerDataRefresh('assignment_changed');
  }

  // ✨ Method to disable/enable automatic cache cleanup
  setCacheCleanupEnabled(enabled) {
    this.cacheCleanupEnabled = enabled;
    console.log(`🧹 Limpeza automática de cache ${enabled ? 'ativada' : 'desativada'}`);
  }

  isLoggedIn() {
    return this.state.user !== null;
  }

  isAdmin() {
    return this.state.userType === 'Administrador';
  }

  getCurrentUser() {
    return this.state.user;
  }

  getUserPoints() {
    return this.state.userPoints;
  }
}

export const stateManager = new StateManager();
