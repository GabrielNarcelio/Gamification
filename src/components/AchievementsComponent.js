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
    
    // Verificar múltiplas formas de detectar admin
    const currentUser = stateManager.getCurrentUser();
    
    console.log('🏆 AchievementsComponent - Debug admin detection:');
    console.log('  currentUser:', currentUser);
    console.log('  currentUser?.type:', currentUser?.type);
    console.log('  stateManager.isAdmin():', stateManager.isAdmin());
    console.log('  stateManager.getState().userType:', stateManager.getState().userType);
    console.log('  stateManager.getState():', stateManager.getState());
    
    this.isAdmin = currentUser?.type === 'admin' || 
                   stateManager.isAdmin() || 
                   stateManager.getState().userType === 'Administrador';
    
    console.log('  Final isAdmin:', this.isAdmin);
    
    // Initialize component
    this.render();
    this.setupEventListeners();
    
    // Subscribe to state changes first and store unsubscribe function
    this.unsubscribe = stateManager.subscribe(this.boundHandleStateChange);
    
    // ✅ Subscribe to state changes to auto-reload achievements
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
    
    // Debug: expor para o console global
    window.debugAchievements = () => {
      console.log('🏆 Debug Achievements Component:');
      console.log('  isAdmin:', this.isAdmin);
      console.log('  currentUser:', stateManager.getCurrentUser());
      console.log('  state:', stateManager.getState());
      console.log('  container exists:', !!this.container);
      console.log('  modal exists:', !!this.container.querySelector('#achievement-modal'));
      console.log('  button exists:', !!this.container.querySelector('#btn-new-achievement'));
    };
    
    window.testAchievementSystem = async () => {
      console.log('🧪 Testing Achievement System...');
      
      // Testar se modal abre
      const button = this.container.querySelector('#btn-new-achievement');
      if (button) {
        console.log('✅ Button found, testing click...');
        button.click();
        
        // Verificar se modal apareceu
        setTimeout(() => {
          const modal = this.container.querySelector('#achievement-modal');
          if (modal && modal.style.display === 'flex') {
            console.log('✅ Modal opened successfully!');
            
            // Fechar modal
            this.hideNewAchievementModal();
            console.log('✅ Modal closed successfully!');
          } else {
            console.error('❌ Modal did not open properly');
          }
        }, 100);
      } else {
        console.error('❌ Button not found - user may not be admin');
      }
      
      // Testar carregamento de conquistas
      try {
        await this.loadAchievements();
        console.log('✅ Achievements loaded successfully');
      } catch (error) {
        console.error('❌ Error loading achievements:', error);
      }
      
      // Testar verificação automática
      const currentUser = stateManager.getCurrentUser();
      if (currentUser && !this.isAdmin) {
        try {
          await this.checkAchievements();
          console.log('✅ Achievement check completed');
        } catch (error) {
          console.error('❌ Error checking achievements:', error);
        }
      }
    };
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

<<<<<<< HEAD
        <div id="no-achievements" class="empty-state" style="display: none;">
          <div class="empty-icon">🏆</div>
          <h3 class="empty-title">Nenhuma conquista encontrada</h3>
          <p class="empty-message">
            As conquistas aparecerão aqui conforme você completa tarefas e atinge metas.
          </p>
=======
    // Anexar event listeners imediatamente após renderizar
    this.attachEventListeners();
  }

  renderAdminControls() {
    return `
      <div class="admin-controls">
        <button class="btn btn-primary" id="btn-new-achievement">
          ➕ Nova Conquista
        </button>
        <button class="btn btn-secondary" id="btn-check-all-achievements">
          🔍 Verificar Todas
        </button>
      </div>
    `;
  }

  renderNewAchievementForm() {
    return `
      <div class="modal-overlay" id="achievement-modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>➕ Nova Conquista</h3>
            <button class="modal-close" id="close-achievement-modal">&times;</button>
          </div>
          
          <form id="new-achievement-form" class="achievement-form">
            <div class="form-group">
              <label for="achievement-name">Nome da Conquista</label>
              <input type="text" id="achievement-name" required>
            </div>
            
            <div class="form-group">
              <label for="achievement-description">Descrição</label>
              <textarea id="achievement-description" rows="3" required></textarea>
            </div>
            
            <div class="form-group">
              <label for="achievement-icon">Ícone (emoji)</label>
              <div class="emoji-input-group">
                <input type="text" id="achievement-icon" class="emoji-input-field" placeholder="🏆" maxlength="2" value="🏆">
                <button type="button" class="emoji-picker-trigger" id="open-emoji-picker">
                  😀 Escolher
                </button>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="achievement-points">Pontos</label>
                <input type="number" id="achievement-points" min="0" value="50">
              </div>
              
              <div class="form-group">
                <label for="achievement-rarity">Raridade</label>
                <select id="achievement-rarity">
                  <option value="common">Comum</option>
                  <option value="uncommon">Incomum</option>
                  <option value="rare">Raro</option>
                  <option value="epic">Épico</option>
                  <option value="legendary">Lendário</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="achievement-type">Tipo</label>
              <select id="achievement-type">
                <option value="login">Login</option>
                <option value="task">Tarefas</option>
                <option value="points">Pontos</option>
                <option value="streak">Sequência</option>
                <option value="category">Categoria</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            
            <div class="condition-section">
              <h4>Condição para Desbloqueio</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="condition-type">Tipo de Condição</label>
                  <select id="condition-type">
                    <option value="login_count">Número de Logins</option>
                    <option value="tasks_completed">Tarefas Completadas</option>
                    <option value="total_points">Total de Pontos</option>
                    <option value="daily_streak">Sequência Diária</option>
                    <option value="category_tasks">Tarefas por Categoria</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="condition-value">Valor</label>
                  <input type="number" id="condition-value" min="1" value="1" required>
                </div>
              </div>
              
              <div class="form-group" id="category-field" style="display: none;">
                <label for="condition-category">Categoria</label>
                <input type="text" id="condition-category" placeholder="ex: social, trabalho">
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" id="cancel-achievement">Cancelar</button>
              <button type="submit" class="btn btn-primary">Criar Conquista</button>
            </div>
          </form>
>>>>>>> d50ccfc (Melhorias de insignias e conquistas ajuste de interface e logica)
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

<<<<<<< HEAD
  updateDisplay() {
    // Prevent multiple simultaneous updates
    if (this.isUpdating) {
      console.log('🏆 AchievementsComponent: Update already in progress, skipping');
      return;
=======
  async checkAchievements() {
    if (!stateManager.getCurrentUser() || this.isAdmin) return;

    try {
      console.log('🔍 Checking achievements for user:', stateManager.getCurrentUser().name);
      const response = await api.checkUserAchievements(stateManager.getCurrentUser().id);
      if (response.success) {
        if (response.data.newUnlocks > 0) {
          console.log('🎉 New achievements unlocked:', response.data.newUnlocks);
          this.showNewAchievements(response.data.newlyUnlocked);
          // Recarregar conquistas para mostrar as novas
          await this.loadAchievements();
        } else {
          console.log('✅ No new achievements unlocked');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
>>>>>>> d50ccfc (Melhorias de insignias e conquistas ajuste de interface e logica)
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

<<<<<<< HEAD
  attachCardEventListeners() {
    const cards = this.container.querySelectorAll('.achievement-card');
    
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const achievementId = parseInt(card.dataset.achievementId);
        this.showAchievementDetails(achievementId);
=======
  getRarityLabel(rarity) {
    const labels = {
      common: '⚪ Comum',
      uncommon: '🟢 Incomum', 
      rare: '🔵 Raro',
      epic: '🟣 Épico',
      legendary: '🟡 Lendário'
    };
    return labels[rarity] || labels.common;
  }

  getEmptyMessage() {
    switch (this.filterType) {
      case 'unlocked':
        return 'Você ainda não desbloqueou nenhuma conquista. Complete tarefas para ganhar suas primeiras conquistas!';
      case 'locked':
        return 'Parabéns! Você desbloqueou todas as conquistas disponíveis!';
      default:
        return 'Nenhuma conquista disponível no momento.';
    }
  }

  updateFilters() {
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === this.filterType);
    });
  }

  showNewAchievements(newAchievements) {
    if (!newAchievements || newAchievements.length === 0) return;

    // 🔔 Usar PWA Manager para notificações nativas do sistema
    if (window.pwaManager && newAchievements.length > 0) {
      const firstAchievement = newAchievements[0];
      window.pwaManager.notifyAchievementUnlocked(firstAchievement.name);
      
      if (newAchievements.length > 1) {
        window.pwaManager.showNotification(`🎉 ${newAchievements.length} novas conquistas desbloqueadas!`, 'success', 8000);
      }
    }

    // Criar modal de conquistas desbloqueadas
    const modal = document.createElement('div');
    modal.className = 'modal-overlay achievement-unlocked-modal';
    modal.innerHTML = `
      <div class="modal-content achievement-notification">
        <div class="notification-header">
          <h2>🎉 Nova(s) Conquista(s) Desbloqueada(s)!</h2>
        </div>
        
        <div class="new-achievements-list">
          ${newAchievements.map(achievement => `
            <div class="new-achievement-item">
              <div class="achievement-icon-large">${achievement.icon || '🏆'}</div>
              <div class="achievement-info">
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                <span class="achievement-points">💎 +${achievement.points} pontos</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="notification-actions">
          <button class="btn btn-primary" id="close-notification">Incrível!</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Adicionar animação de entrada
    requestAnimationFrame(() => {
      modal.style.animation = 'fadeInScale 0.3s ease-out';
    });

    // Remover modal após alguns segundos ou clique
    const closeBtn = modal.querySelector('#close-notification');
    const autoClose = setTimeout(() => {
      modal.style.animation = 'fadeOutScale 0.3s ease-in';
      setTimeout(() => modal.remove(), 300);
    }, 10000);

    closeBtn.addEventListener('click', () => {
      clearTimeout(autoClose);
      modal.style.animation = 'fadeOutScale 0.3s ease-in';
      setTimeout(() => modal.remove(), 300);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        clearTimeout(autoClose);
        modal.style.animation = 'fadeOutScale 0.3s ease-in';
        setTimeout(() => modal.remove(), 300);
      }
    });
  }

  // Métodos para administradores
  showNewAchievementModal() {
    console.log('🏆 showNewAchievementModal called');
    console.log('🏆 Container exists:', !!this.container);
    console.log('🏆 isAdmin:', this.isAdmin);
    
    const modal = this.container.querySelector('#achievement-modal');
    
    console.log('🏆 Modal element found:', !!modal);
    console.log('🏆 Modal element:', modal);
    
    if (modal) {
      console.log('🏆 Current modal display style:', modal.style.display);
      console.log('🏆 Showing modal...');
      modal.style.display = 'flex';
      console.log('🏆 Modal display after change:', modal.style.display);
      this.updateConditionFields();
    } else {
      console.error('❌ Modal não encontrado! Verifique se renderNewAchievementForm está sendo chamado.');
      console.log('🏆 All elements with IDs:', Array.from(this.container.querySelectorAll('[id]')).map(el => el.id));
    }
  }

  hideNewAchievementModal() {
    const modal = this.container.querySelector('#achievement-modal');
    if (modal) {
      modal.style.display = 'none';
      this.container.querySelector('#new-achievement-form').reset();
    }
  }

  updateConditionFields() {
    const conditionType = this.container.querySelector('#condition-type').value;
    const categoryField = this.container.querySelector('#category-field');
    
    if (conditionType === 'category_tasks') {
      categoryField.style.display = 'block';
    } else {
      categoryField.style.display = 'none';
    }
  }

  async handleNewAchievement(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const achievementData = {
      name: this.container.querySelector('#achievement-name').value,
      description: this.container.querySelector('#achievement-description').value,
      icon: this.container.querySelector('#achievement-icon').value || '🏆',
      points: parseInt(this.container.querySelector('#achievement-points').value) || 0,
      type: this.container.querySelector('#achievement-type').value,
      rarity: this.container.querySelector('#achievement-rarity').value,
      condition: {
        type: this.container.querySelector('#condition-type').value,
        value: parseInt(this.container.querySelector('#condition-value').value) || 1
      }
    };

    // Adicionar categoria se necessário
    if (achievementData.condition.type === 'category_tasks') {
      achievementData.condition.category = this.container.querySelector('#condition-category').value;
    }

    try {
      const response = await api.createAchievement(achievementData);
      if (response.success) {
        this.showSuccess('Conquista criada com sucesso!');
        this.hideNewAchievementModal();
        
        // ✅ Trigger data refresh across all components
        stateManager.triggerDataRefresh();
      } else {
        this.showError('Erro ao criar conquista: ' + response.error);
      }
    } catch (error) {
      console.error('Erro ao criar conquista:', error);
      this.showError('Erro ao criar conquista: ' + error.message);
    }
  }

  async deleteAchievement(achievementId) {
    if (!confirm('Tem certeza que deseja deletar esta conquista?')) return;

    try {
      const response = await api.deleteAchievement(achievementId);
      if (response.success) {
        this.showSuccess('Conquista deletada com sucesso!');
        
        // ✅ Trigger data refresh across all components
        stateManager.triggerDataRefresh();
      } else {
        this.showError('Erro ao deletar conquista: ' + response.error);
      }
    } catch (error) {
      console.error('Erro ao deletar conquista:', error);
      this.showError('Erro ao deletar conquista: ' + error.message);
    }
  }

  async checkAllUsersAchievements() {
    // Esta funcionalidade seria implementada no backend para verificar todos os usuários
    this.showInfo('Funcionalidade em desenvolvimento - verificação em massa de conquistas');
  }

  showSuccess(message) {
    // Usar PWA Manager se disponível
    if (window.pwaManager) {
      window.pwaManager.showNotification(message, 'success', 4000);
    } else {
      console.log('✅ Sucesso:', message);
      // Fallback: criar notificação simples
      this.createSimpleNotification(message, 'success');
    }
  }

  showError(message) {
    // Usar PWA Manager se disponível
    if (window.pwaManager) {
      window.pwaManager.showNotification(message, 'error', 6000);
    } else {
      console.error('❌ Erro:', message);
      // Fallback: criar notificação simples
      this.createSimpleNotification(message, 'error');
    }
  }

  showInfo(message) {
    // Usar PWA Manager se disponível
    if (window.pwaManager) {
      window.pwaManager.showNotification(message, 'info', 4000);
    } else {
      console.log('ℹ️ Info:', message);
      // Fallback: criar notificação simples
      this.createSimpleNotification(message, 'info');
    }
  }

  createSimpleNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `simple-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // Método para atualizar o estado de admin e re-renderizar se necessário
  updateAdminStatus() {
    const currentUser = stateManager.getCurrentUser();
    const newIsAdmin = currentUser?.type === 'admin' || 
                       stateManager.isAdmin() || 
                       stateManager.getState().userType === 'Administrador';
    
    if (newIsAdmin !== this.isAdmin) {
      this.isAdmin = newIsAdmin;
      this.render();
      this.loadAchievements();
    }
  }

  // Método público para teste (pode ser chamado do console)
  testAdminModal() {
    console.log('🧪 Testando modal de admin...');
    console.log('🔍 isAdmin:', this.isAdmin);
    console.log('🔍 Current User:', stateManager.getCurrentUser());
    console.log('🔍 State:', stateManager.getState());
    
    const modal = this.container.querySelector('#achievement-modal');
    console.log('🔍 Modal encontrado:', !!modal);
    
    if (modal) {
      modal.style.display = 'flex';
      console.log('✅ Modal mostrado via teste');
    } else {
      console.error('❌ Modal não encontrado');
    }
  }

  // Auto-diagnóstico e correção automática
  async autoFixSystem() {
    console.log('🔧 Iniciando auto-diagnóstico do sistema de conquistas...');
    
    const issues = [];
    const fixes = [];
    
    // 1. Verificar se é admin e modal existe
    const currentUser = stateManager.getCurrentUser();
    const isAdminUser = currentUser?.type === 'admin' || stateManager.isAdmin();
    
    if (isAdminUser && !this.isAdmin) {
      issues.push('Admin status not properly detected');
      this.isAdmin = true;
      fixes.push('Fixed admin status detection');
    }
    
    // 2. Verificar se modal está renderizado para admin
    if (this.isAdmin) {
      const modal = this.container.querySelector('#achievement-modal');
      if (!modal) {
        issues.push('Admin modal not rendered');
        this.render(); // Re-render component
        fixes.push('Re-rendered component to include admin modal');
      }
    }
    
    // 3. Verificar se event listeners estão anexados
    const button = this.container.querySelector('#btn-new-achievement');
    if (this.isAdmin && button && !button.onclick && !button._hasListener) {
      issues.push('Event listeners not properly attached');
      this.attachEventListeners();
      fixes.push('Re-attached event listeners');
    }
    
    // 4. Verificar se conquistas estão carregando
    try {
      await this.loadAchievements();
      if (this.achievements.length === 0) {
        issues.push('No achievements loaded');
      } else {
        fixes.push(`${this.achievements.length} achievements loaded successfully`);
      }
    } catch (error) {
      issues.push('Error loading achievements: ' + error.message);
    }
    
    // 5. Testar API de conquistas
    try {
      const response = await api.getAchievements();
      if (!response.success) {
        issues.push('API not responding correctly');
      } else {
        fixes.push('API responding correctly');
      }
    } catch (error) {
      issues.push('API error: ' + error.message);
    }
    
    // Relatório
    console.log('📊 Auto-diagnóstico completo:');
    console.log('❌ Issues encontrados:', issues.length);
    issues.forEach(issue => console.log('  - ' + issue));
    console.log('✅ Correções aplicadas:', fixes.length);
    fixes.forEach(fix => console.log('  - ' + fix));
    
    if (issues.length === 0) {
      console.log('🎉 Sistema de conquistas funcionando perfeitamente!');
    } else {
      console.log('⚠️ Alguns problemas podem precisar de atenção manual');
    }
    
    return { issues, fixes };
  }

  // Métodos do Emoji Picker
  showEmojiPicker() {
    // Criar o emoji picker dinamicamente se não existir
    let emojiPicker = this.container.querySelector('#emoji-picker');
    
    if (!emojiPicker) {
      // Criar o elemento do emoji picker
      const emojiPickerHTML = `
        <div class="emoji-picker" id="emoji-picker">
          <div class="modal-content">
            <div class="emoji-picker-header">
              <h4>Escolher Emoji</h4>
              <button class="emoji-picker-close" id="emoji-picker-close">&times;</button>
            </div>
            
            <div class="emoji-categories">
              <button class="emoji-category-btn active" data-category="trofeus">🏆</button>
              <button class="emoji-category-btn" data-category="esportes">⚽</button>
              <button class="emoji-category-btn" data-category="atividades">🎨</button>
              <button class="emoji-category-btn" data-category="trabalho">💼</button>
              <button class="emoji-category-btn" data-category="natureza">🌱</button>
              <button class="emoji-category-btn" data-category="comida">🍎</button>
              <button class="emoji-category-btn" data-category="animais">🐶</button>
              <button class="emoji-category-btn" data-category="objetos">🔥</button>
              <button class="emoji-category-btn" data-category="simbolos">💯</button>
              <button class="emoji-category-btn" data-category="bandeiras">🎌</button>
            </div>
            
            <div class="emoji-grid" id="emoji-grid">
              <div class="emoji-grid-header">
                <span class="category-name">Troféus</span>
              </div>
              <div class="emoji-grid-content" id="emoji-grid-content">
                <!-- Emojis serão carregados aqui -->
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Adicionar ao container
      this.container.insertAdjacentHTML('beforeend', emojiPickerHTML);
      emojiPicker = this.container.querySelector('#emoji-picker');
      
      // Configurar event listeners para o novo emoji picker
      this.setupDynamicEmojiPickerListeners();
    }
    
    if (emojiPicker) {
      emojiPicker.style.display = 'flex';
      
      // Carregar categoria inicial
      this.loadEmojiCategory('trofeus');
      
      // Foco no primeiro emoji
      setTimeout(() => {
        const firstEmoji = emojiPicker.querySelector('.emoji-btn');
        firstEmoji?.focus();
      }, 100);
    }
  }

  hideEmojiPicker() {
    const emojiPicker = this.container.querySelector('#emoji-picker');
    if (emojiPicker) {
      emojiPicker.remove(); // Remover completamente do DOM
    }
  }

  changeEmojiCategory(category) {
    // Atualizar botões de categoria
    this.container.querySelectorAll('.emoji-category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });

    // Atualizar grid
    this.loadEmojiCategory(category);
  }

  loadEmojiCategory(category) {
    const emojis = this.emojiPicker.emojis[category] || [];
    const categoryName = this.emojiPicker.getCategoryName(category);
    const emojiGridContent = this.container.querySelector('#emoji-grid-content');
    const categoryNameEl = this.container.querySelector('.category-name');

    if (categoryNameEl) {
      categoryNameEl.textContent = categoryName;
    }

    if (emojiGridContent) {
      emojiGridContent.innerHTML = emojis.map(emoji => `
        <button class="emoji-btn" data-emoji="${emoji}" title="${emoji}">
          ${emoji}
        </button>
      `).join('');

      // Adicionar event listeners aos botões de emoji
      emojiGridContent.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const emoji = e.target.dataset.emoji;
          this.selectEmoji(emoji);
        });
>>>>>>> d50ccfc (Melhorias de insignias e conquistas ajuste de interface e logica)
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
