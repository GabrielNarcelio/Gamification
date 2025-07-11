// Aplicação Principal

import { stateManager } from '@/services/state.js';
import { LoginComponent } from '@/components/LoginComponent.js';
import { DashboardComponent } from '@/components/DashboardComponent.js';

export class App {
  constructor(container) {
    this.container = container;
    this.init();
  }

  init() {
    // Subscribe to state changes
    stateManager.subscribe(this.handleStateChange.bind(this));
    
    // Initialize with current state
    this.handleStateChange(stateManager.getState());
  }

  handleStateChange(state) {
    if (state.user) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
  }

  showLogin() {
    this.container.innerHTML = '<div id="login-container"></div>';
    
    const loginContainer = this.container.querySelector('#login-container');
    new LoginComponent(loginContainer);
  }

  showDashboard() {
    this.container.innerHTML = '<div id="dashboard-container"></div>';
    
    const dashboardContainer = this.container.querySelector('#dashboard-container');
    new DashboardComponent(dashboardContainer);
  }
}
