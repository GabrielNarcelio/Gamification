// Componente principal do Dashboard

import { stateManager } from '../services/state.js';
import { TasksComponent } from './TasksComponent.js';
import { RewardsComponent } from './RewardsComponent.js';
import { RankingComponent } from './RankingComponent.js';
import { HistoryComponent } from './HistoryComponent.js';
import { AdminPanelComponent } from './AdminPanelComponent.js';
import { AchievementsComponent } from './AchievementsComponent.js';
import { TaskDistributionComponent } from './TaskDistributionComponent.js';

export class DashboardComponent {
  constructor(container) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.initializeComponents();
    this.checkAndShowDevBanner();
    
    // Subscribe to state changes after initialization is complete
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
          <div id="assigned-tasks-summary" class="assigned-tasks-summary" style="display: none;">
            <div class="summary-content">
              <h4>📌 Suas Tarefas Atribuídas</h4>
              <div id="assigned-tasks-count" class="assigned-count">Carregando...</div>
              <div id="assigned-tasks-list" class="assigned-list"></div>
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

            <section class="dashboard-section" id="task-distribution-section" style="display: none;">
              <div id="task-distribution-container"></div>
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
    const taskDistributionContainer = this.container.querySelector('#task-distribution-container');
    const rankingContainer = this.container.querySelector('#ranking-container');
    const historyContainer = this.container.querySelector('#history-container');

    console.log('🔍 Inicialization containers check:', {
      tasksContainer: !!tasksContainer,
      rewardsContainer: !!rewardsContainer,
      achievementsContainer: !!achievementsContainer,
      taskDistributionContainer: !!taskDistributionContainer,
      rankingContainer: !!rankingContainer,
      historyContainer: !!historyContainer
    });

    try {
      this.tasksComponent = new TasksComponent(tasksContainer);
      console.log('✅ TasksComponent initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing TasksComponent:', error);
      this.tasksComponent = null;
    }
    
    try {
      console.log('🎁 Initializing RewardsComponent with container:', rewardsContainer);
      this.rewardsComponent = new RewardsComponent(rewardsContainer);
      console.log('✅ RewardsComponent initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing RewardsComponent:', error);
      this.rewardsComponent = null;
    }
    
    try {
      this.achievementsComponent = new AchievementsComponent();
      this.achievementsComponent.init(achievementsContainer);
    } catch (error) {
      console.error('❌ Error initializing AchievementsComponent:', error);
      this.achievementsComponent = null;
    }
    
    try {
      this.rankingComponent = new RankingComponent(rankingContainer);
    } catch (error) {
      console.error('❌ Error initializing RankingComponent:', error);
      this.rankingComponent = null;
    }
    
    try {
      this.historyComponent = new HistoryComponent(historyContainer);
    } catch (error) {
      console.error('❌ Error initializing HistoryComponent:', error);
      this.historyComponent = null;
    }
    
    try {
      // Inicializar componente de distribuição de tarefas apenas para admins
      this.taskDistributionComponent = new TaskDistributionComponent(taskDistributionContainer);
    } catch (error) {
      console.error('❌ Error initializing TaskDistributionComponent:', error);
      this.taskDistributionComponent = null;
    }
    
    // Expor para debug global
    window.achievementsComponent = this.achievementsComponent;
    window.taskDistribution = this.taskDistributionComponent;
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
    try {
      if (!currentState.user) {
        return;
      }

      // Update user info display
      const userNameElement = this.container.querySelector('#user-name');
      const userPointsElement = this.container.querySelector('#user-points');
      const userTypeElement = this.container.querySelector('#user-type');
      const historyTitle = this.container.querySelector('#history-title');
      const adminPanelContainer = this.container.querySelector('#admin-panel-container');
      const taskDistributionSection = this.container.querySelector('#task-distribution-section');

      if (userNameElement) {
        userNameElement.textContent = currentState.user.name || currentState.user.nome;
      }
      if (userPointsElement) {
        userPointsElement.textContent = currentState.user.points?.toString() || currentState.userPoints?.toString() || '0';
      }
      if (userTypeElement) {
        userTypeElement.textContent = currentState.user.type === 'admin' ? 'Administrador' : 'Usuário';
      }

      // Handle admin features
      if (currentState.user.type === 'admin' || currentState.userType === 'Administrador') {
        if (adminPanelContainer) adminPanelContainer.style.display = 'block';
        if (taskDistributionSection) taskDistributionSection.style.display = 'block';
        if (historyTitle) historyTitle.textContent = '📊 Histórico de Todos os Usuários';
        
        if (!this.adminPanelComponent && adminPanelContainer) {
          try {
            this.adminPanelComponent = new AdminPanelComponent(adminPanelContainer);
          } catch (error) {
            console.error('❌ Error creating AdminPanelComponent:', error);
          }
        }
      } else {
        if (adminPanelContainer) adminPanelContainer.style.display = 'none';
        if (taskDistributionSection) taskDistributionSection.style.display = 'none';
        if (historyTitle) historyTitle.textContent = '📊 Histórico de Atividades';
        this.adminPanelComponent = null;
      }

      // Refresh all components
      this.refreshComponents();
      
      // Carregar resumo de tarefas atribuídas
      this.loadAssignedTasksSummary();
      
    } catch (error) {
      console.error('❌ Error in DashboardComponent.handleStateChange:', error);
    }
  }

  async loadAssignedTasksSummary() {
    const currentState = stateManager.getState();
    const summaryContainer = this.container.querySelector('#assigned-tasks-summary');
    const countElement = this.container.querySelector('#assigned-tasks-count');
    const listElement = this.container.querySelector('#assigned-tasks-list');
    
    // Só mostrar para usuários não-admin
    if (currentState.userType === 'Administrador') {
      summaryContainer.style.display = 'none';
      return;
    }

    try {
      const { api } = await import('../services/api.js');
      const userId = currentState.user?.id;
      
      if (!userId) return;

      // Buscar tarefas atribuídas específicamente
      const assignmentsResponse = await api.getUserAssignments(userId, 'assigned');
      const assignments = assignmentsResponse.success ? assignmentsResponse.data : [];

      if (assignments.length === 0) {
        summaryContainer.style.display = 'none';
        return;
      }

      // Buscar detalhes das tarefas
      const tasksResponse = await api.getAllTasks();
      const allTasks = tasksResponse.success ? tasksResponse.data : [];

      const assignedTasksDetails = assignments.map(assignment => {
        const task = allTasks.find(t => t.id === assignment.taskId);
        return task ? { ...task, ...assignment } : null;
      }).filter(Boolean);

      summaryContainer.style.display = 'flex';
      countElement.textContent = `${assignedTasksDetails.length} tarefa${assignedTasksDetails.length > 1 ? 's' : ''} atribuída${assignedTasksDetails.length > 1 ? 's' : ''}`;
      
      listElement.innerHTML = assignedTasksDetails.slice(0, 3).map(task => {
        const isOverdue = task.deadline && new Date(task.deadline) < new Date();
        return `
          <div class="assigned-task-item ${isOverdue ? 'overdue' : ''}">
            <span class="task-title">${task.title}</span>
            <span class="task-points">${task.points}pts</span>
            ${task.deadline ? `
              <span class="task-deadline ${isOverdue ? 'overdue' : ''}">
                ${isOverdue ? '⚠️' : '⏰'} ${new Date(task.deadline).toLocaleDateString('pt-BR')}
              </span>
            ` : ''}
          </div>
        `;
      }).join('');

      if (assignedTasksDetails.length > 3) {
        listElement.innerHTML += `<div class="more-tasks">+ ${assignedTasksDetails.length - 3} mais</div>`;
      }

    } catch (error) {
      console.error('Erro ao carregar resumo de tarefas atribuídas:', error);
      summaryContainer.style.display = 'none';
    }
  }

  refreshComponents() {
    console.log('🔄 Refreshing dashboard components...');
    
    // Verificar se os componentes foram inicializados antes de chamar refresh
    const componentsToRefresh = [
      { name: 'TasksComponent', component: this.tasksComponent, method: 'refresh' },
      { name: 'RewardsComponent', component: this.rewardsComponent, method: 'refresh' },
      { name: 'AchievementsComponent', component: this.achievementsComponent, method: 'loadAchievements' },
      { name: 'RankingComponent', component: this.rankingComponent, method: 'refresh' },
      { name: 'HistoryComponent', component: this.historyComponent, method: 'refresh' }
    ];
    
    console.log('🔍 Components status:', componentsToRefresh.map(({ name, component, method }) => ({
      name,
      exists: !!component,
      hasMethod: component && typeof component[method] === 'function'
    })));
    
    componentsToRefresh.forEach(({ name, component, method }) => {
      try {
        if (component && typeof component[method] === 'function') {
          console.log(`✅ Refreshing ${name}`);
          component[method]();
        } else {
          console.warn(`⚠️ ${name} not available for refresh - Component: ${!!component}, Method: ${component && typeof component[method] === 'function'}`);
        }
      } catch (error) {
        console.error(`❌ Error refreshing ${name}:`, error);
      }
    });
    
    // Handle admin panel component separately
    if (this.adminPanelComponent && typeof this.adminPanelComponent.refresh === 'function') {
      try {
        this.adminPanelComponent.refresh();
      } catch (error) {
        console.error('❌ Error refreshing AdminPanelComponent:', error);
      }
    }
  }

  refresh() {
    this.refreshComponents();
  }

  // ✅ Cleanup method to destroy all sub-components
  destroy() {
    // Cleanup state subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Cleanup all sub-components
    if (this.tasksComponent && typeof this.tasksComponent.destroy === 'function') {
      this.tasksComponent.destroy();
    }
    if (this.rewardsComponent && typeof this.rewardsComponent.destroy === 'function') {
      this.rewardsComponent.destroy();
    }
    if (this.achievementsComponent && typeof this.achievementsComponent.destroy === 'function') {
      this.achievementsComponent.destroy();
    }
    if (this.rankingComponent && typeof this.rankingComponent.destroy === 'function') {
      this.rankingComponent.destroy();
    }
    if (this.historyComponent && typeof this.historyComponent.destroy === 'function') {
      this.historyComponent.destroy();
    }
    if (this.adminPanelComponent && typeof this.adminPanelComponent.destroy === 'function') {
      this.adminPanelComponent.destroy();
    }

    // Clear component references
    this.tasksComponent = null;
    this.rewardsComponent = null;
    this.achievementsComponent = null;
    this.rankingComponent = null;
    this.historyComponent = null;
    this.adminPanelComponent = null;
  }
}
