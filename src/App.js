// Aplicação Principal

import { stateManager } from '@/services/state.js';
import { LoginComponent } from '@/components/LoginComponent.js';
import { DashboardComponent } from '@/components/DashboardComponent.js';

export class App {
  constructor(container) {
    this.container = container;
    this.currentComponent = null; // Track current component for cleanup
    this.init();
  }

  init() {
    // Subscribe to state changes
    stateManager.subscribe(this.handleStateChange.bind(this));
    
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
    this.cleanupCurrentComponent(); // ✅ Cleanup before creating new component
    this.container.innerHTML = '<div id="dashboard-container"></div>';
    
    const dashboardContainer = this.container.querySelector('#dashboard-container');
    this.currentComponent = new DashboardComponent(dashboardContainer);
  }
}
