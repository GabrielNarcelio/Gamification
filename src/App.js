// Aplicação Principal

import { stateManager } from './services/state.js';
import { LoginComponent } from './components/LoginComponent.js';
import { DashboardComponent } from './components/DashboardComponent.js';
import { smartCache } from '@/utils/smart-cache-manager.js';

export class App {
  constructor(container) {
    this.container = container;
    this.currentComponent = null; // Track current component for cleanup
    this.dashboardComponent = null; // Keep dashboard instance
    this.init();
  }

  async init() {
    try {
      // Inicializar smart cache
      await smartCache.init();
      console.log('🚀 Smart Cache inicializado');
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar smart cache:', error);
    }
    
    // Subscribe to state changes
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
    
    // Initialize with current state
    this.handleStateChange(stateManager.getState());
  }

  // ✅ Cleanup current component before switching
  cleanupCurrentComponent() {
    if (this.currentComponent && typeof this.currentComponent.destroy === 'function') {
      this.currentComponent.destroy();
    }
    this.currentComponent = null;
  }

  handleStateChange(state) {
    // Prevent unnecessary state changes
    if ((state.user && this.currentComponent && this.currentComponent.constructor.name === 'DashboardComponent') ||
        (!state.user && this.currentComponent && this.currentComponent.constructor.name === 'LoginComponent')) {
      return; // No need to change component
    }
    
    if (state.user) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
  }

  showLogin() {
    this.cleanupCurrentComponent(); // ✅ Cleanup before creating new component
    this.container.innerHTML = '<div id="login-container"></div>';
    
    const loginContainer = this.container.querySelector('#login-container');
    this.currentComponent = new LoginComponent(loginContainer);
  }

  showDashboard() {
    // Only cleanup login component, preserve dashboard if it exists
    if (this.currentComponent && this.currentComponent.constructor.name === 'LoginComponent') {
      this.cleanupCurrentComponent();
    }
    
    // Create dashboard only if it doesn't exist
    if (!this.dashboardComponent) {
      this.container.innerHTML = '<div id="dashboard-container"></div>';
      const dashboardContainer = this.container.querySelector('#dashboard-container');
      this.dashboardComponent = new DashboardComponent(dashboardContainer);
      console.log('✅ App: Created new DashboardComponent instance');
    } else {
      console.log('✅ App: Reusing existing DashboardComponent instance');
    }
    
    this.currentComponent = this.dashboardComponent;
  }

  destroy() {
    // Cleanup state subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Cleanup current component
    this.cleanupCurrentComponent();
    
    // Cleanup dashboard component
    if (this.dashboardComponent && typeof this.dashboardComponent.destroy === 'function') {
      this.dashboardComponent.destroy();
      this.dashboardComponent = null;
    }
  }
}
