// Componente principal do Dashboard

import { stateManager } from '@/services/state';
import { TasksComponent } from './TasksComponent';
import { RewardsComponent } from './RewardsComponent';
import { RankingComponent } from './RankingComponent';
import { HistoryComponent } from './HistoryComponent';
import { AdminPanelComponent } from './AdminPanelComponent';
import type { AppState } from '@/types';

export class DashboardComponent {
  private container: HTMLElement;
  private tasksComponent: TasksComponent;
  private rewardsComponent: RewardsComponent;
  private rankingComponent: RankingComponent;
  private historyComponent: HistoryComponent;
  private adminPanelComponent: AdminPanelComponent | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.initializeComponents();
    
    // Subscribe to state changes
    stateManager.subscribe(this.handleStateChange.bind(this));
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="dashboard-container">
        <header class="dashboard-header">
          <div class="user-info">
            <h2>Bem-vindo, <span id="user-name"></span>!</h2>
            <div class="user-stats">
              <span class="points">Pontos: <span id="user-points"></span></span>
              <span class="type" id="user-type"></span>
            </div>
          </div>
          <button id="logout-button" class="btn btn-secondary">Sair</button>
        </header>

        <div id="admin-panel-container" class="admin-panel" style="display: none;"></div>

        <div class="dashboard-content">
          <div class="dashboard-grid">
            <section class="dashboard-section">
              <h3>📋 Tarefas Disponíveis</h3>
              <div id="tasks-container"></div>
            </section>

            <section class="dashboard-section">
              <h3>🎁 Loja de Prêmios</h3>
              <div id="rewards-container"></div>
            </section>

            <section class="dashboard-section">
              <h3>🏆 Ranking</h3>
              <div id="ranking-container"></div>
            </section>

            <section class="dashboard-section">
              <h3 id="history-title">📊 Histórico de Atividades</h3>
              <div id="history-container"></div>
            </section>
          </div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const logoutButton = this.container.querySelector('#logout-button') as HTMLButtonElement;
    logoutButton.addEventListener('click', () => {
      stateManager.logout();
    });
  }

  private initializeComponents(): void {
    const tasksContainer = this.container.querySelector('#tasks-container') as HTMLElement;
    const rewardsContainer = this.container.querySelector('#rewards-container') as HTMLElement;
    const rankingContainer = this.container.querySelector('#ranking-container') as HTMLElement;
    const historyContainer = this.container.querySelector('#history-container') as HTMLElement;

    this.tasksComponent = new TasksComponent(tasksContainer);
    this.rewardsComponent = new RewardsComponent(rewardsContainer);
    this.rankingComponent = new RankingComponent(rankingContainer);
    this.historyComponent = new HistoryComponent(historyContainer);
  }

  private handleStateChange(state: AppState): void {
    if (!state.user) return;

    // Update user info display
    const userNameElement = this.container.querySelector('#user-name') as HTMLElement;
    const userPointsElement = this.container.querySelector('#user-points') as HTMLElement;
    const userTypeElement = this.container.querySelector('#user-type') as HTMLElement;
    const historyTitle = this.container.querySelector('#history-title') as HTMLElement;
    const adminPanelContainer = this.container.querySelector('#admin-panel-container') as HTMLElement;

    userNameElement.textContent = state.user.nome;
    userPointsElement.textContent = state.userPoints.toString();
    userTypeElement.textContent = state.userType || '';

    // Handle admin panel
    if (state.userType === 'Administrador') {
      adminPanelContainer.style.display = 'block';
      historyTitle.textContent = '📊 Histórico de Todos os Usuários';
      
      if (!this.adminPanelComponent) {
        this.adminPanelComponent = new AdminPanelComponent(adminPanelContainer);
      }
    } else {
      adminPanelContainer.style.display = 'none';
      historyTitle.textContent = '📊 Histórico de Atividades';
      this.adminPanelComponent = null;
    }

    // Refresh all components
    this.refreshComponents();
  }

  private refreshComponents(): void {
    this.tasksComponent.refresh();
    this.rewardsComponent.refresh();
    this.rankingComponent.refresh();
    this.historyComponent.refresh();
    
    if (this.adminPanelComponent) {
      this.adminPanelComponent.refresh();
    }
  }

  public refresh(): void {
    this.refreshComponents();
  }
}
