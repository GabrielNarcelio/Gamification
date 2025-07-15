// Componente principal do Dashboard

import { stateManager } from '../services/state.js';
import { TasksComponent } from './TasksComponent.js';
import { RewardsComponent } from './RewardsComponent.js';
import { RankingComponent } from './RankingComponent.js';
import { HistoryComponent } from './HistoryComponent.js';
import { AdminPanelComponent } from './AdminPanelComponent.js';
import { AchievementsComponent } from './AchievementsComponent.js';

export class DashboardComponent {
  constructor(container) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.initializeComponents();
    this.checkAndShowDevBanner();
    
    // Subscribe to state changes
    stateManager.subscribe(this.handleStateChange.bind(this));
  }

  render() {
    this.container.innerHTML = `
      <div class="dashboard-container">
        <div id="dev-mode-banner" class="dev-banner" style="display: none;">
          ⚠️ <strong>Modo Desenvolvimento:</strong> Usando dados simulados - API indisponível por CORS
        </div>
        
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
              <h3>🏆 Conquistas</h3>
              <div id="achievements-container"></div>
            </section>

            <section class="dashboard-section">
              <h3>🏅 Ranking</h3>
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

  setupEventListeners() {
    const logoutButton = this.container.querySelector('#logout-button');
    logoutButton.addEventListener('click', () => {
      stateManager.logout();
    });
  }

  initializeComponents() {
    const tasksContainer = this.container.querySelector('#tasks-container');
    const rewardsContainer = this.container.querySelector('#rewards-container');
    const achievementsContainer = this.container.querySelector('#achievements-container');
    const rankingContainer = this.container.querySelector('#ranking-container');
    const historyContainer = this.container.querySelector('#history-container');

    this.tasksComponent = new TasksComponent(tasksContainer);
    this.rewardsComponent = new RewardsComponent(rewardsContainer);
    this.achievementsComponent = new AchievementsComponent();
    this.achievementsComponent.init(achievementsContainer);
    this.rankingComponent = new RankingComponent(rankingContainer);
    this.historyComponent = new HistoryComponent(historyContainer);
    
    // Expor para debug global
    window.achievementsComponent = this.achievementsComponent;
  }

  async checkAndShowDevBanner() {
    try {
      const { CONFIG } = await import('../utils/config.js');
      
      if (CONFIG.DEV_MODE) {
        const banner = this.container.querySelector('#dev-mode-banner');
        if (banner) {
          banner.style.display = 'block';
          console.log('🔄 Sistema rodando em modo de desenvolvimento com dados simulados');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar modo de desenvolvimento:', error);
    }
  }

  handleStateChange(currentState) {
    if (!currentState.user) return;

    // Update user info display
    const userNameElement = this.container.querySelector('#user-name');
    const userPointsElement = this.container.querySelector('#user-points');
    const userTypeElement = this.container.querySelector('#user-type');
    const historyTitle = this.container.querySelector('#history-title');
    const adminPanelContainer = this.container.querySelector('#admin-panel-container');

    userNameElement.textContent = currentState.user.name || currentState.user.nome;
    userPointsElement.textContent = currentState.user.points?.toString() || currentState.userPoints?.toString() || '0';
    userTypeElement.textContent = currentState.user.type === 'admin' ? 'Administrador' : 'Usuário';

    // Handle admin panel
    if (currentState.user.type === 'admin' || currentState.userType === 'Administrador') {
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

  refreshComponents() {
    this.tasksComponent.refresh();
    this.rewardsComponent.refresh();
    this.achievementsComponent.loadAchievements();
    this.rankingComponent.refresh();
    this.historyComponent.refresh();
    
    if (this.adminPanelComponent) {
      this.adminPanelComponent.refresh();
    }
  }

  refresh() {
    this.refreshComponents();
  }
}
