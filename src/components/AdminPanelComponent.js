// Componente do Painel Administrativo Simplificado

import { api } from '../services/api.js';
import { stateManager } from '../services/state.js';
import { MESSAGES } from '../utils/config.js';
import { validateRequired, validatePoints, createLoadingButton, escapeHtml } from '../utils/helpers.js';

export class AdminPanelComponent {
  constructor(container) {
    this.container = container;
    this.users = [];
    this.currentFormMode = 'create';
    this.currentEditUserId = null;
    this.render();
    this.setupEventListeners();
    this.loadUsers();
    this.loadStats(); // Carregar estatísticas na inicialização
    
    // Subscribe to state changes to auto-reload users
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
  }

  // Handle state changes
  handleStateChange(newState) {
    if (newState.user && newState.lastUpdate && this.lastUpdate !== newState.lastUpdate) {
      console.log('👨‍💼 AdminPanelComponent reloading users and stats...');
      this.lastUpdate = newState.lastUpdate;
      this.loadUsers();
      this.loadStats(); // Recarregar estatísticas também
    }
  }

  // Cleanup method
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-panel">
        <div class="admin-header">
          <h3>👨‍💼 Painel Administrativo</h3>
          <div class="admin-stats">
            <div class="stat-item">
              <span class="stat-number" id="total-users">-</span>
              <span class="stat-label">Usuários</span>
            </div>
            <div class="stat-item">
              <span class="stat-number" id="total-tasks">-</span>
              <span class="stat-label">Tarefas</span>
            </div>
            <div class="stat-item">
              <span class="stat-number" id="total-rewards">-</span>
              <span class="stat-label">Prêmios</span>
            </div>
          </div>
        </div>

        <div class="user-management">
          <div class="section-header">
            <h4>Gestão de Usuários</h4>
            <div class="section-actions">
              <button id="show-user-form-button" class="btn btn-primary">
                ➕ Criar Usuário
              </button>
              <button id="refresh-users-button" class="btn btn-secondary">
                🔄 Atualizar Usuários
              </button>
              <button id="refresh-stats-button" class="btn btn-secondary">
                📊 Atualizar Stats
              </button>
            </div>
          </div>

          <div id="user-form" class="user-form" style="display: none;">
            <div class="form-content">
              <h5 id="user-form-title">Criar Novo Usuário</h5>
              
              <div class="form-group">
                <label for="form-user-name">Nome:</label>
                <input type="text" id="form-user-name" placeholder="Digite o nome completo" />
              </div>
              
              <div class="form-group">
                <label for="form-user-email">Email:</label>
                <input type="email" id="form-user-email" placeholder="Digite o email" />
              </div>
              
              <div class="form-group">
                <label for="form-user-password">Senha:</label>
                <input type="password" id="form-user-password" placeholder="Digite a senha" />
              </div>
              
              <div class="form-group">
                <label for="form-user-type">Tipo de Usuário:</label>
                <select id="form-user-type">
                  <option value="Usuário">👤 Usuário</option>
                  <option value="Administrador">👨‍💼 Administrador</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="form-user-points">Pontos Iniciais:</label>
                <input type="number" id="form-user-points" placeholder="0" min="0" />
              </div>
              
              <div class="form-actions">
                <button id="save-user-button" class="btn btn-success">
                  💾 Salvar Usuário
                </button>
                <button id="cancel-user-form" class="btn btn-secondary">
                  ❌ Cancelar
                </button>
              </div>
              
              <div id="user-form-error" class="error-message"></div>
              <input type="hidden" id="edit-user-id" />
            </div>
          </div>

          <div id="users-list" class="users-list">
            <div class="loading">Carregando usuários...</div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // User management buttons
    const showFormButton = this.container.querySelector('#show-user-form-button');
    showFormButton?.addEventListener('click', () => this.showUserForm('create'));

    const refreshButton = this.container.querySelector('#refresh-users-button');
    refreshButton?.addEventListener('click', () => this.loadUsers());

    const refreshStatsButton = this.container.querySelector('#refresh-stats-button');
    refreshStatsButton?.addEventListener('click', () => this.loadStats());

    const cancelButton = this.container.querySelector('#cancel-user-form');
    cancelButton?.addEventListener('click', () => this.hideUserForm());

    const saveButton = this.container.querySelector('#save-user-button');
    saveButton?.addEventListener('click', () => this.handleSaveUser());

    // Enter key support for form inputs
    const formInputs = this.container.querySelectorAll('#user-form input');
    formInputs.forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSaveUser();
        }
      });
    });
  }

  showUserForm(mode, user = null) {
    const form = this.container.querySelector('#user-form');
    const title = this.container.querySelector('#user-form-title');
    const nameInput = this.container.querySelector('#form-user-name');
    const passwordInput = this.container.querySelector('#form-user-password');
    const emailInput = this.container.querySelector('#form-user-email');
    const typeSelect = this.container.querySelector('#form-user-type');
    const pointsInput = this.container.querySelector('#form-user-points');
    const userIdInput = this.container.querySelector('#edit-user-id');
    const errorDiv = this.container.querySelector('#user-form-error');

    this.currentFormMode = mode;
    errorDiv.textContent = '';

    if (mode === 'create') {
      title.textContent = 'Criar Novo Usuário';
      nameInput.value = '';
      passwordInput.value = '';
      emailInput.value = '';
      typeSelect.value = 'Usuário';
      pointsInput.value = '0';
      userIdInput.value = '';
      this.currentEditUserId = null;
    } else if (mode === 'edit' && user) {
      title.textContent = 'Editar Usuário';
      nameInput.value = user.name || '';
      passwordInput.value = '';
      emailInput.value = user.email || '';
      typeSelect.value = user.type === 'admin' ? 'Administrador' : 'Usuário';
      pointsInput.value = (user.points || 0).toString();
      userIdInput.value = user.id || '';
      this.currentEditUserId = user.id || null;
    }

    form.style.display = 'block';
    nameInput.focus();
  }

  hideUserForm() {
    const form = this.container.querySelector('#user-form');
    form.style.display = 'none';
    this.currentFormMode = 'create';
    this.currentEditUserId = null;
  }

  async handleSaveUser() {
    const nameInput = this.container.querySelector('#form-user-name');
    const passwordInput = this.container.querySelector('#form-user-password');
    const emailInput = this.container.querySelector('#form-user-email');
    const typeSelect = this.container.querySelector('#form-user-type');
    const pointsInput = this.container.querySelector('#form-user-points');
    const saveButton = this.container.querySelector('#save-user-button');
    const errorDiv = this.container.querySelector('#user-form-error');

    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();
    const email = emailInput.value.trim();
    const type = typeSelect.value;
    const points = pointsInput.value.trim();

    // Clear previous errors
    errorDiv.textContent = '';

    // Validation
    const nameError = validateRequired(name, 'Nome');
    const passwordError = validateRequired(password, 'Senha');
    const emailError = validateRequired(email, 'Email');
    const pointsError = validatePoints(points);

    if (nameError || passwordError || emailError || pointsError) {
      errorDiv.textContent = nameError || passwordError || emailError || pointsError || '';
      return;
    }

    const user = {
      username: name,
      senha: password,
      name: name,
      email: email,
      tipo: type === 'Administrador' ? 'admin' : 'user',
      pontos: parseInt(points)
    };

    const resetButton = createLoadingButton(saveButton, '🔄 Salvando...');

    try {
      let response;
      
      if (this.currentFormMode === 'create') {
        response = await api.createUser(user);
      } else {
        if (!this.currentEditUserId) {
          throw new Error('ID do usuário não encontrado');
        }
        user.id = this.currentEditUserId;
        response = await api.updateUser(this.currentEditUserId, user);
      }

      if (response.success) {
        this.hideUserForm();
        stateManager.triggerDataRefresh();
        
        const message = this.currentFormMode === 'create' ? MESSAGES.USER_CREATED : MESSAGES.USER_UPDATED;
        this.showSuccessMessage(message);
      } else {
        errorDiv.textContent = response.message || 'Erro ao salvar usuário.';
      }
    } catch (error) {
      console.error('Save user error:', error);
      errorDiv.textContent = MESSAGES.GENERIC_ERROR;
    } finally {
      resetButton();
    }
  }

  async handleDeleteUser(userId, userName) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    const button = this.container.querySelector(`[data-delete-user="${userId}"]`);
    if (!button) return;

    const resetButton = createLoadingButton(button, '🔄 Excluindo...');

    try {
      const response = await api.deleteUser(userId);
      
      if (response.success) {
        stateManager.triggerDataRefresh();
        this.showSuccessMessage(MESSAGES.USER_DELETED);
      } else {
        const errorMessage = response.error || response.message || 'Erro ao excluir usuário.';
        if (errorMessage.includes('não encontrado') || errorMessage.includes('já foi deletado')) {
          this.showWarningMessage('⚠️ Este usuário já foi deletado ou não existe mais.');
          stateManager.triggerDataRefresh();
        } else {
          this.showErrorMessage(errorMessage);
        }
      }
    } catch (error) {
      console.error('Delete user error:', error);
      
      if (error.message.includes('404') || error.message.includes('não encontrado')) {
        this.showWarningMessage('⚠️ Este usuário já foi deletado ou não existe mais.');
        stateManager.triggerDataRefresh();
      } else {
        this.showErrorMessage(MESSAGES.GENERIC_ERROR);
      }
    } finally {
      resetButton();
    }
  }

  async loadUsers() {
    const usersList = this.container.querySelector('#users-list');
    
    try {
      const response = await api.getUsers();
      this.users = response.success ? response.data : [];
      this.renderUsers();
      this.loadStats();
    } catch (error) {
      console.error('Load users error:', error);
      usersList.innerHTML = '<div class="error">Erro ao carregar usuários.</div>';
    }
  }

  renderUsers() {
    const usersList = this.container.querySelector('#users-list');

    if (this.users.length === 0) {
      usersList.innerHTML = '<div class="empty">Nenhum usuário encontrado.</div>';
      return;
    }

    const usersHtml = this.users.map(user => {
      const safeName = escapeHtml(user.name || 'Sem nome');
      const safeEmail = escapeHtml(user.email || '');
      const userType = user.type === 'admin' ? 'admin' : 'user';
      const userTypeLabel = user.type === 'admin' ? 'Administrador' : 'Usuário';
      const userPoints = user.points || 0;

      return `
        <div class="user-item">
          <div class="user-info">
            <div class="user-name">${safeName}</div>
            <div class="user-details">
              <span class="user-points">${userPoints} pontos</span>
              <span class="user-type ${userType}">${userTypeLabel}</span>
            </div>
          </div>
          <div class="user-actions">
            <button 
              class="btn btn-sm btn-primary" 
              onclick="window.adminPanel.editUser('${user.id}', '${safeName}', '', '${safeEmail}', '${user.type || 'user'}', ${userPoints})"
            >
              ✏️ Editar
            </button>
            <button 
              class="btn btn-sm btn-danger" 
              data-delete-user="${user.id}"
              onclick="window.adminPanel.deleteUser('${user.id}', '${safeName}')"
            >
              🗑️ Excluir
            </button>
          </div>
        </div>
      `;
    }).join('');

    usersList.innerHTML = usersHtml;

    // Store reference for onclick handlers
    window.adminPanel = {
      editUser: (userId, name, password, email, type, points) => {
        this.showUserForm('edit', { id: userId, name, password, email, type, points });
      },
      deleteUser: (userId, userName) => this.handleDeleteUser(userId, userName)
    };
  }

  async loadStats() {
    try {
      console.log('📊 Carregando estatísticas do painel administrativo...');
      
      const [usersResponse, tasksResponse, rewardsResponse] = await Promise.all([
        api.getAllUsers(),
        api.getAllTasks(),
        api.getRewards() // Corrigido: usar getRewards ao invés de getAllRewards
      ]);

      const totalUsersElement = this.container.querySelector('#total-users');
      const totalTasksElement = this.container.querySelector('#total-tasks');
      const totalRewardsElement = this.container.querySelector('#total-rewards');

      const totalUsers = (usersResponse.success ? usersResponse.data || [] : []).length;
      const totalTasks = (tasksResponse.success ? tasksResponse.data || [] : []).length;
      const totalRewards = (rewardsResponse.success ? rewardsResponse.data || [] : []).length;

      console.log(`📊 Estatísticas: ${totalUsers} usuários, ${totalTasks} tarefas, ${totalRewards} prêmios`);

      if (totalUsersElement) {
        totalUsersElement.textContent = totalUsers;
        totalUsersElement.style.color = totalUsers > 0 ? '#4CAF50' : '#666';
      }
      if (totalTasksElement) {
        totalTasksElement.textContent = totalTasks;
        totalTasksElement.style.color = totalTasks > 0 ? '#2196F3' : '#666';
      }
      if (totalRewardsElement) {
        totalRewardsElement.textContent = totalRewards;
        totalRewardsElement.style.color = totalRewards > 0 ? '#FF9800' : '#666';
      }

    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
      
      // Em caso de erro, exibir "Erro" nos elementos
      const totalUsersElement = this.container.querySelector('#total-users');
      const totalTasksElement = this.container.querySelector('#total-tasks');
      const totalRewardsElement = this.container.querySelector('#total-rewards');

      if (totalUsersElement) {
        totalUsersElement.textContent = 'Erro';
        totalUsersElement.style.color = '#f44336';
      }
      if (totalTasksElement) {
        totalTasksElement.textContent = 'Erro';
        totalTasksElement.style.color = '#f44336';
      }
      if (totalRewardsElement) {
        totalRewardsElement.textContent = 'Erro';
        totalRewardsElement.style.color = '#f44336';
      }
    }
  }

  showSuccessMessage(message) {
    const usersList = this.container.querySelector('#users-list');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    usersList.prepend(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  showWarningMessage(message) {
    const usersList = this.container.querySelector('#users-list');
    const warningDiv = document.createElement('div');
    warningDiv.className = 'warning-message';
    warningDiv.textContent = message;
    
    usersList.prepend(warningDiv);
    
    setTimeout(() => {
      warningDiv.remove();
    }, 3000);
  }

  showErrorMessage(message) {
    const usersList = this.container.querySelector('#users-list');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    usersList.prepend(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }

  refresh() {
    console.log('🔄 Atualizando painel administrativo...');
    this.loadUsers();
    this.loadStats();
  }
}
