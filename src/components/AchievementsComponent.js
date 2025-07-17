// Componente de conquistas/achievements

import { stateManager } from '../services/state.js';
import { formatDate } from '../utils/helpers.js';

export class AchievementsComponent {
  constructor(container) {
    if (!container) {
      throw new Error('AchievementsComponent: container element is required');
    }
    
    this.container = container;
    this.achievements = [];
    this.userAchievements = [];
    this.isAdmin = false;
    this.isUpdating = false; // Flag to prevent multiple updates
    
    // Store the bound handler for proper cleanup
    this.boundHandleStateChange = this.handleStateChange.bind(this);
    
    // Initialize component
    this.render();
    this.setupEventListeners();
    
    // Subscribe to state changes first and store unsubscribe function
    this.unsubscribe = stateManager.subscribe(this.boundHandleStateChange);
    
    // Load achievements after subscribing
    this.loadAchievements();
  }

  handleStateChange(state) {
    const oldIsAdmin = this.isAdmin;
    const oldAchievements = this.achievements.length;
    const oldUserAchievements = this.userAchievements.length;
    
    this.isAdmin = state.user && state.user.type === 'admin';
    this.achievements = state.achievements || [];
    this.userAchievements = state.userAchievements || [];
    
    // Only update display if something actually changed
    if (oldIsAdmin !== this.isAdmin || 
        oldAchievements !== this.achievements.length || 
        oldUserAchievements !== this.userAchievements.length) {
      this.updateDisplay();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="achievements-container">
        <div class="achievements-header">
          <h2>🏆 Conquistas</h2>
          <div class="achievements-stats">
            <span class="stat">
              <span class="stat-number" id="earned-count">0</span>
              <span class="stat-label">Conquistadas</span>
            </span>
            <span class="stat">
              <span class="stat-number" id="total-count">0</span>
              <span class="stat-label">Total</span>
            </span>
            <span class="stat">
              <span class="stat-number" id="completion-rate">0%</span>
              <span class="stat-label">Progresso</span>
            </span>
          </div>
          <div id="admin-achievement-controls" class="admin-controls" style="display: none;">
            <button id="add-achievement-btn" class="btn btn-primary">
              ➕ Nova Conquista
            </button>
          </div>
        </div>

        <div class="achievements-filters">
          <div class="filter-group">
            <label>Filtrar por:</label>
            <select id="achievement-filter" class="form-select">
              <option value="all">Todas as Conquistas</option>
              <option value="earned">Conquistadas</option>
              <option value="available">Disponíveis</option>
              <option value="locked">Bloqueadas</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Categoria:</label>
            <select id="category-filter" class="form-select">
              <option value="all">Todas as Categorias</option>
              <option value="tasks">Tarefas</option>
              <option value="points">Pontos</option>
              <option value="streaks">Sequências</option>
              <option value="special">Especiais</option>
            </select>
          </div>
        </div>

        <div id="achievements-grid" class="achievements-grid">
          <!-- Achievement cards will be populated here -->
        </div>

        <div id="no-achievements" class="empty-state" style="display: none;">
          <div class="empty-icon">🏆</div>
          <h3 class="empty-title">Nenhuma conquista encontrada</h3>
          <p class="empty-message">
            As conquistas aparecerão aqui conforme você completa tarefas e atinge metas.
          </p>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Filter controls
    const achievementFilter = this.container.querySelector('#achievement-filter');
    const categoryFilter = this.container.querySelector('#category-filter');
    
    if (achievementFilter) {
      achievementFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.applyFilters());
    }

    // Admin controls
    const addBtn = this.container.querySelector('#add-achievement-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAchievementForm());
    }
  }

  async loadAchievements() {
    try {
      console.log('🏆 Loading achievements...');
      
      // Verify stateManager is available
      if (!stateManager || typeof stateManager.setState !== 'function') {
        console.error('StateManager not available or missing setState method');
        return;
      }

      // For now, let's use some mock data to test the component
      const mockAchievements = [
        {
          id: 1,
          name: 'Primeira Tarefa',
          description: 'Complete sua primeira tarefa',
          icon: '🎯',
          category: 'tasks',
          points: 10,
          condition: 'first_task'
        },
        {
          id: 2,
          name: 'Trabalhador Dedicado',
          description: 'Complete 10 tarefas',
          icon: '💪',
          category: 'tasks',
          points: 50,
          condition: 'tasks_completed',
          conditionValue: 10
        },
        {
          id: 3,
          name: 'Coletor de Pontos',
          description: 'Ganhe 100 pontos',
          icon: '💰',
          category: 'points',
          points: 25,
          condition: 'points_earned',
          conditionValue: 100
        }
      ];

      console.log('🏆 Mock achievements loaded:', mockAchievements);
      
      // Set achievements locally without triggering state change
      this.achievements = mockAchievements;
      this.updateDisplay();
      
      console.log('✅ Achievements loaded successfully');
    } catch (error) {
      console.error('Error loading achievements:', error);
      this.showToast('Erro ao carregar conquistas', 'error');
    }
  }

  updateDisplay() {
    // Prevent multiple simultaneous updates
    if (this.isUpdating) {
      console.log('🏆 AchievementsComponent: Update already in progress, skipping');
      return;
    }
    
    // Check if component is rendered before updating
    if (!this.container.querySelector('.achievements-container')) {
      console.log('🏆 AchievementsComponent: DOM not ready yet, skipping update');
      return;
    }

    this.isUpdating = true;

    try {
      const earnedCount = this.userAchievements.length;
      const totalCount = this.achievements.length;
      const completionRate = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

      // Update stats
      const earnedElement = this.container.querySelector('#earned-count');
      const totalElement = this.container.querySelector('#total-count');
    const rateElement = this.container.querySelector('#completion-rate');

    if (earnedElement) earnedElement.textContent = earnedCount;
    if (totalElement) totalElement.textContent = totalCount;
      if (rateElement) rateElement.textContent = `${completionRate}%`;

      // Show/hide admin controls
      const adminControls = this.container.querySelector('#admin-achievement-controls');
      if (adminControls) {
        adminControls.style.display = this.isAdmin ? 'flex' : 'none';
      }

      // Render achievements
      this.renderAchievements();
    } finally {
      this.isUpdating = false;
    }
  }

  renderAchievements() {
    const grid = this.container.querySelector('#achievements-grid');
    const noAchievements = this.container.querySelector('#no-achievements');
    
    if (!grid) return;

    const filteredAchievements = this.getFilteredAchievements();

    if (filteredAchievements.length === 0) {
      grid.style.display = 'none';
      if (noAchievements) noAchievements.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (noAchievements) noAchievements.style.display = 'none';

    grid.innerHTML = filteredAchievements.map(achievement => 
      this.renderAchievementCard(achievement)
    ).join('');

    // Add event listeners to cards
    this.attachCardEventListeners();
  }

  renderAchievementCard(achievement) {
    const isEarned = this.userAchievements.some(ua => ua.achievementId === achievement.id);

    return `
      <div class="achievement-card ${isEarned ? 'earned' : 'not-earned'}" 
           data-achievement-id="${achievement.id}">
        <div class="achievement-icon">
          ${achievement.icon || '🏆'}
        </div>
        <div class="achievement-content">
          <h4 class="achievement-name">${achievement.name}</h4>
          <p class="achievement-description">${achievement.description}</p>
          
          <div class="achievement-meta">
            <span class="achievement-category">${this.getCategoryLabel(achievement.category)}</span>
            ${achievement.points > 0 ? `<span class="achievement-points">+${achievement.points} pts</span>` : ''}
          </div>
          
          ${isEarned ? `
            <div class="achievement-earned">
              <span class="earned-label">✅ Conquistada</span>
            </div>
          ` : `
            <div class="achievement-locked">
              <span class="locked-label">🔒 Bloqueada</span>
              <span class="condition-hint">${this.getConditionHint(achievement)}</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  attachCardEventListeners() {
    const cards = this.container.querySelectorAll('.achievement-card');
    
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const achievementId = parseInt(card.dataset.achievementId);
        this.showAchievementDetails(achievementId);
      });
    });
  }

  getFilteredAchievements() {
    const filter = this.container.querySelector('#achievement-filter')?.value || 'all';
    const category = this.container.querySelector('#category-filter')?.value || 'all';

    return this.achievements.filter(achievement => {
      const isEarned = this.userAchievements.some(ua => ua.achievementId === achievement.id);
      
      // Filter by earned status
      if (filter === 'earned' && !isEarned) return false;
      if (filter === 'available' && isEarned) return false;
      if (filter === 'locked' && isEarned) return false;
      
      // Filter by category
      if (category !== 'all' && achievement.category !== category) return false;
      
      return true;
    });
  }

  getCategoryLabel(category) {
    const labels = {
      tasks: 'Tarefas',
      points: 'Pontos',
      streaks: 'Sequências',
      special: 'Especiais'
    };
    return labels[category] || category;
  }

  getConditionHint(achievement) {
    const condition = achievement.condition;
    const value = achievement.conditionValue;

    const hints = {
      tasks_completed: `Complete ${value} tarefas`,
      points_earned: `Ganhe ${value} pontos`,
      streak_days: `Mantenha ${value} dias de sequência`,
      first_task: 'Complete sua primeira tarefa',
      perfect_week: 'Complete todas as tarefas da semana',
      early_bird: 'Complete uma tarefa antes das 9h',
      night_owl: 'Complete uma tarefa após 22h'
    };

    return hints[condition] || achievement.customCondition || 'Condição especial';
  }

  applyFilters() {
    this.renderAchievements();
  }

  showAchievementDetails(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    console.log('Mostrando detalhes da conquista:', achievement);
    this.showToast(`Conquista: ${achievement.name}`, 'info');
  }

  showAchievementForm() {
    console.log('Abrindo formulário de conquista');
    this.showToast('Funcionalidade em desenvolvimento', 'info');
  }

  showToast(message, type = 'info', options = {}) {
    if (window.UIManager && window.UIManager.showToast) {
      window.UIManager.showToast(message, type, options);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Method for refreshing achievements
  refresh() {
    this.loadAchievements();
  }

  destroy() {
    // Cleanup event listeners and state subscriptions
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
