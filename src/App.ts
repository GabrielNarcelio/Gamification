// Aplicação Principal

import { stateManager } from '@/services/state';
import { LoginComponent } from '@/components/LoginComponent';
import { DashboardComponent } from '@/components/DashboardComponent';
import type { AppState } from '@/types';

export class App {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private init(): void {
    // Subscribe to state changes
    stateManager.subscribe(this.handleStateChange.bind(this));
    
    // Initialize with current state
    this.handleStateChange(stateManager.getState());
  }

  private handleStateChange(state: AppState): void {
    if (state.user) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
  }

  private showLogin(): void {
    this.container.innerHTML = '<div id="login-container"></div>';
    
    const loginContainer = this.container.querySelector('#login-container') as HTMLElement;
    new LoginComponent(loginContainer);
  }

  private showDashboard(): void {
    this.container.innerHTML = '<div id="dashboard-container"></div>';
    
    const dashboardContainer = this.container.querySelector('#dashboard-container') as HTMLElement;
    new DashboardComponent(dashboardContainer);
  }
}
