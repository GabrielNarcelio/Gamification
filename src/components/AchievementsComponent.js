import { api } from '../services/api.js';
import { stateManager } from '../services/state.js';
import { EmojiPicker } from './EmojiPicker.js';

export class AchievementsComponent {
  constructor() {
    this.achievements = [];
    this.userAchievements = null;
    this.filterType = 'all'; // all, unlocked, locked
    this.isAdmin = false;
    this.emojiPicker = new EmojiPicker();
  }

  async init(container) {
    this.container = container;
    
    // Verificar múltiplas formas de detectar admin
    const currentUser = stateManager.getCurrentUser();
    
    console.log('🏆 AchievementsComponent - Debug admin detection:');
    console.log('  currentUser:', currentUser);
    console.log('  currentUser?.type:', currentUser?.type);
    console.log('  stateManager.isAdmin():', stateManager.isAdmin());
    console.log('  stateManager.getState().userType:', stateManager.getState().userType);
    
    this.isAdmin = currentUser?.type === 'admin' || 
                   stateManager.isAdmin() || 
                   stateManager.getState().userType === 'Administrador';
    
    console.log('  Final isAdmin:', this.isAdmin);
    
    this.render();
    await this.loadAchievements();
    
    // Verificar conquistas automaticamente se for usuário logado
    if (currentUser && !this.isAdmin) {
      await this.checkAchievements();
    }
    
    // ✅ Subscribe to state changes to auto-reload achievements
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
  }

  // ✅ Handle state changes
  handleStateChange(newState) {
    if (newState.user && newState.lastUpdate && this.lastUpdate !== newState.lastUpdate) {
      // Only reload if there's a lastUpdate timestamp and it's different from our last one
      this.lastUpdate = newState.lastUpdate;
      this.loadAchievements();
    }
  }

  // ✅ Cleanup method
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="achievements-container">
        <div class="achievements-header">
          <div class="header-content">
            <h2>🏆 Conquistas</h2>
            <p class="header-subtitle">Desbloqueie conquistas completando tarefas e atingindo objetivos!</p>
          </div>
          
          ${this.isAdmin ? this.renderAdminControls() : ''}
        </div>

        <div class="achievements-stats" id="achievements-stats">
          <!-- Stats serão carregadas dinamicamente -->
        </div>

        <div class="achievements-filters">
          <button class="filter-btn ${this.filterType === 'all' ? 'active' : ''}" data-filter="all">
            📋 Todas
          </button>
          <button class="filter-btn ${this.filterType === 'unlocked' ? 'active' : ''}" data-filter="unlocked">
            ✅ Desbloqueadas
          </button>
          <button class="filter-btn ${this.filterType === 'locked' ? 'active' : ''}" data-filter="locked">
            🔒 Bloqueadas
          </button>
        </div>

        <div class="achievements-grid" id="achievements-grid">
          <div class="loading-achievements">
            <div class="loading-spinner"></div>
            <p>Carregando conquistas...</p>
          </div>
        </div>

        ${this.isAdmin ? this.renderNewAchievementForm() : ''}
      </div>
    `;

    // Aguardar um pouco para garantir que o DOM foi renderizado
    setTimeout(() => {
      this.attachEventListeners();
    }, 100);
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
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Filtros
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filterType = e.target.dataset.filter;
        this.updateFilters();
        this.renderAchievements();
      });
    });

    // Controles admin
    console.log('🏆 AchievementsComponent - Setting up event listeners, isAdmin:', this.isAdmin);
    if (this.isAdmin) {
      const newAchievementBtn = this.container.querySelector('#btn-new-achievement');
      const checkAllBtn = this.container.querySelector('#btn-check-all-achievements');
      
      console.log('🏆 Found admin elements:', {
        newAchievementBtn: !!newAchievementBtn,
        checkAllBtn: !!checkAllBtn
      });
      
      if (newAchievementBtn) {
        console.log('🏆 Adding click listener to new achievement button');
        newAchievementBtn.addEventListener('click', (e) => {
          console.log('🏆 New Achievement button clicked!');
          e.preventDefault();
          e.stopPropagation();
          
          // Teste simples primeiro
          alert('Botão Nova Conquista clicado!');
          
          // Depois chamar o modal
          this.showNewAchievementModal();
        });
      } else {
        console.error('🏆 New Achievement button not found in DOM');
      }
      
      if (checkAllBtn) {
        checkAllBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.checkAllUsersAchievements();
        });
      }

      // Modal event listeners
      this.setupModalEventListeners();
      this.setupEmojiPickerEventListeners();
    }
  }

  setupModalEventListeners() {
    const modal = this.container.querySelector('#achievement-modal');
    const closeBtn = this.container.querySelector('#close-achievement-modal');
    const cancelBtn = this.container.querySelector('#cancel-achievement');
    const form = this.container.querySelector('#new-achievement-form');
    const conditionType = this.container.querySelector('#condition-type');

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hideNewAchievementModal();
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hideNewAchievementModal();
      });
    }
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideNewAchievementModal();
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleNewAchievement(e);
      });
    }

    if (conditionType) {
      conditionType.addEventListener('change', () => {
        this.updateConditionFields();
      });
    }
  }

  setupEmojiPickerEventListeners() {
    const openEmojiPickerBtn = this.container.querySelector('#open-emoji-picker');

    // Abrir seletor de emojis
    if (openEmojiPickerBtn) {
      openEmojiPickerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showEmojiPicker();
      });
    }
  }

  setupDynamicEmojiPickerListeners() {
    // Este método é chamado após criar o emoji picker dinamicamente
    const emojiPicker = this.container.querySelector('#emoji-picker');
    const closeEmojiPickerBtn = this.container.querySelector('#emoji-picker-close');
    const categoryBtns = this.container.querySelectorAll('.emoji-category-btn');

    // Fechar seletor de emojis
    if (closeEmojiPickerBtn) {
      closeEmojiPickerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hideEmojiPicker();
      });
    }

    // Fechar clicando fora
    if (emojiPicker) {
      emojiPicker.addEventListener('click', (e) => {
        if (e.target === emojiPicker) {
          this.hideEmojiPicker();
        }
      });
    }

    // Mudança de categoria
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.dataset.category;
        this.changeEmojiCategory(category);
      });
    });

    // ESC para fechar
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && emojiPicker && emojiPicker.style.display !== 'none') {
        this.hideEmojiPicker();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  async loadAchievements() {
    try {
      // Atualizar status de admin antes de carregar
      this.updateAdminStatus();
      
      if (this.isAdmin) {
        // Admin vê todas as conquistas
        const response = await api.getAchievements();
        if (response.success) {
          this.achievements = response.data;
          this.renderAchievements();
        }
      } else if (stateManager.getCurrentUser()) {
        // Usuário vê suas conquistas
        const response = await api.getUserAchievements(stateManager.getCurrentUser().id);
        if (response.success) {
          this.userAchievements = response.data;
          this.achievements = response.data.all;
          this.renderStats(response.data.stats);
          this.renderAchievements();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
      this.showError('Erro ao carregar conquistas: ' + error.message);
    }
  }

  async checkAchievements() {
    if (!stateManager.getCurrentUser() || this.isAdmin) return;

    try {
      const response = await api.checkUserAchievements(stateManager.getCurrentUser().id);
      if (response.success && response.data.newUnlocks > 0) {
        this.showNewAchievements(response.data.newlyUnlocked);
        // Recarregar conquistas para mostrar as novas
        await this.loadAchievements();
      }
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    }
  }

  renderStats(stats) {
    const statsContainer = this.container.querySelector('#achievements-stats');
    if (!statsContainer || !stats) return;

    const completionRate = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <span class="stat-number">${stats.unlocked}</span>
            <span class="stat-label">Desbloqueadas</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <span class="stat-number">${stats.total}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💎</div>
          <div class="stat-info">
            <span class="stat-number">${stats.totalPoints}</span>
            <span class="stat-label">Pontos de Conquistas</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <span class="stat-number">${completionRate}%</span>
            <span class="stat-label">Progresso</span>
          </div>
        </div>
      </div>
    `;
  }

  renderAchievements() {
    const gridContainer = this.container.querySelector('#achievements-grid');
    if (!gridContainer) return;

    let achievementsToShow = this.achievements;

    // Aplicar filtro
    if (this.filterType === 'unlocked') {
      achievementsToShow = this.achievements.filter(a => a.unlocked);
    } else if (this.filterType === 'locked') {
      achievementsToShow = this.achievements.filter(a => !a.unlocked);
    }

    if (achievementsToShow.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-achievements">
          <div class="empty-icon">🏆</div>
          <h3>Nenhuma conquista encontrada</h3>
          <p>${this.getEmptyMessage()}</p>
        </div>
      `;
      return;
    }

    gridContainer.innerHTML = achievementsToShow.map(achievement => 
      this.renderAchievementCard(achievement)
    ).join('');

    // Adicionar event listeners para delete (admin)
    if (this.isAdmin) {
      gridContainer.querySelectorAll('.achievement-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const achievementId = e.target.dataset.id;
          this.deleteAchievement(achievementId);
        });
      });
    }
  }

  renderAchievementCard(achievement) {
    const isUnlocked = achievement.unlocked || false;
    const rarityClass = achievement.rarity || 'common';
    const progress = achievement.progress || 0;
    const maxValue = achievement.condition?.value || 100;
    const progressPercent = Math.min(100, (progress / maxValue) * 100);

    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'} rarity-${rarityClass}">
        <div class="achievement-icon">
          ${achievement.icon || '🏆'}
        </div>
        
        <div class="achievement-content">
          <h3 class="achievement-name">${achievement.name}</h3>
          <p class="achievement-description">${achievement.description}</p>
          
          <div class="achievement-details">
            <span class="achievement-points">💎 ${achievement.points} pontos</span>
            <span class="achievement-rarity rarity-${rarityClass}">
              ${this.getRarityLabel(rarityClass)}
            </span>
          </div>
          
          ${!isUnlocked && !this.isAdmin ? `
            <div class="achievement-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
              </div>
              <span class="progress-text">${progress}/${maxValue}</span>
            </div>
          ` : ''}
          
          ${isUnlocked ? `
            <div class="achievement-unlocked">
              <span class="unlocked-icon">✅</span>
              <span class="unlocked-date">
                Desbloqueada em ${new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          ` : ''}
        </div>
        
        ${this.isAdmin ? `
          <div class="achievement-admin">
            <button class="achievement-delete" data-id="${achievement.id}" title="Deletar Conquista">
              🗑️
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

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

    // Remover modal após alguns segundos ou clique
    const closeBtn = modal.querySelector('#close-notification');
    const autoClose = setTimeout(() => {
      modal.remove();
    }, 10000);

    closeBtn.addEventListener('click', () => {
      clearTimeout(autoClose);
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        clearTimeout(autoClose);
        modal.remove();
      }
    });
  }

  // Métodos para administradores
  showNewAchievementModal() {
    console.log('🏆 showNewAchievementModal called');
    const modal = this.container.querySelector('#achievement-modal');
    
    console.log('🏆 Modal element found:', !!modal);
    if (modal) {
      console.log('🏆 Showing modal...');
      modal.style.display = 'flex';
      this.updateConditionFields();
    } else {
      console.error('❌ Modal não encontrado! Verifique se renderNewAchievementForm está sendo chamado.');
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
    // Usar sistema de notificações existente
    console.log('✅ Sucesso:', message);
    // TODO: Implementar toast/notification
  }

  showError(message) {
    console.error('❌ Erro:', message);
    // TODO: Implementar toast/notification
  }

  showInfo(message) {
    console.log('ℹ️ Info:', message);
    // TODO: Implementar toast/notification
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
      });
    }
  }

  selectEmoji(emoji) {
    const iconInput = this.container.querySelector('#achievement-icon');
    if (iconInput) {
      iconInput.value = emoji;
    }
    this.hideEmojiPicker();
  }
}
