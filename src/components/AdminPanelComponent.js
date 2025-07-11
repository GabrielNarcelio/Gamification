// Componente do Painel Administrativo

import { apiService } from '@/services/api.js';
import { MESSAGES } from '@/utils/config.js';
import { validateRequired, validatePoints, createLoadingButton, escapeHtml } from '@/utils/helpers.js';

export class AdminPanelComponent {
  constructor(container) {
    this.container = container;
    this.users = [];
    this.currentFormMode = 'create';
    this.currentEditUserId = null;
    this.render();
    this.setupEventListeners();
    this.loadUsers();
  }

  render() {
    this.container.innerHTML = `
      <div class="admin-panel-content">
        <h3>👨‍💼 Painel Administrativo</h3>
        
        <div class="admin-section">
          <div class="admin-actions">
            <button id="show-user-form-button" class="btn btn-primary">➕ Criar Usuário</button>
            <button id="refresh-users-button" class="btn btn-secondary">🔄 Atualizar Lista</button>
          </div>
        </div>

        <div id="user-form" class="user-form" style="display: none;">
          <div class="form-header">
            <h4 id="user-form-title">Criar Novo Usuário</h4>
            <button id="cancel-user-form" class="btn btn-link">✖️ Cancelar</button>
          </div>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="form-user-name">Nome do Usuário:</label>
              <input type="text" id="form-user-name" placeholder="Digite o nome" />
            </div>
            
            <div class="form-group">
              <label for="form-user-password">Senha:</label>
              <input type="password" id="form-user-password" placeholder="Digite a senha" />
            </div>
            
            <div class="form-group">
              <label for="form-user-type">Tipo:</label>
              <select id="form-user-type">
                <option value="Usuário">Usuário</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="form-user-points">Pontos:</label>
              <input type="number" id="form-user-points" placeholder="0" min="0" />
            </div>
          </div>
          
          <div class="form-actions">
            <button id="save-user-button" class="btn btn-success">💾 Salvar</button>
          </div>
          
          <div id="user-form-error" class="error-message"></div>
          <input type="hidden" id="edit-user-id" />
        </div>

        <div class="admin-section">
          <h4>👥 Usuários Cadastrados</h4>
          <div id="users-list" class="users-list">
            <div class="loading">Carregando usuários...</div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Show user form button
    const showFormButton = this.container.querySelector('#show-user-form-button');
    showFormButton.addEventListener('click', () => this.showUserForm('create'));

    // Refresh users button
    const refreshButton = this.container.querySelector('#refresh-users-button');
    refreshButton.addEventListener('click', () => this.loadUsers());

    // Cancel form button
    const cancelButton = this.container.querySelector('#cancel-user-form');
    cancelButton.addEventListener('click', () => this.hideUserForm());

    // Save user button
    const saveButton = this.container.querySelector('#save-user-button');
    saveButton.addEventListener('click', () => this.handleSaveUser());

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
      typeSelect.value = 'Usuário';
      pointsInput.value = '0';
      userIdInput.value = '';
      this.currentEditUserId = null;
    } else if (mode === 'edit' && user) {
      title.textContent = 'Editar Usuário';
      nameInput.value = user.nome;
      passwordInput.value = user.senha;
      typeSelect.value = user.tipo;
      pointsInput.value = user.pontos.toString();
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
    const typeSelect = this.container.querySelector('#form-user-type');
    const pointsInput = this.container.querySelector('#form-user-points');
    const saveButton = this.container.querySelector('#save-user-button');
    const errorDiv = this.container.querySelector('#user-form-error');

    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();
    const type = typeSelect.value;
    const points = pointsInput.value.trim();

    // Clear previous errors
    errorDiv.textContent = '';

    // Validation
    const nameError = validateRequired(name, 'Nome');
    const passwordError = validateRequired(password, 'Senha');
    const pointsError = validatePoints(points);

    if (nameError || passwordError || pointsError) {
      errorDiv.textContent = nameError || passwordError || pointsError || '';
      return;
    }

    const user = {
      nome: name,
      senha: password,
      tipo: type,
      pontos: parseInt(points)
    };

    const resetButton = createLoadingButton(saveButton, '🔄 Salvando...');

    try {
      let response;
      
      if (this.currentFormMode === 'create') {
        response = await apiService.createUser(user);
      } else {
        if (!this.currentEditUserId) {
          throw new Error('ID do usuário não encontrado');
        }
        user.id = this.currentEditUserId;
        response = await apiService.updateUser(this.currentEditUserId, user);
      }

      if (response.success) {
        this.hideUserForm();
        await this.loadUsers();
        
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
      const response = await apiService.deleteUser(userId);
      
      if (response.success) {
        await this.loadUsers();
        this.showSuccessMessage(MESSAGES.USER_DELETED);
      } else {
        alert(response.message || 'Erro ao excluir usuário.');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert(MESSAGES.GENERIC_ERROR);
    } finally {
      resetButton();
    }
  }

  async handleStructureSheet() {
    const button = this.container.querySelector('#structure-sheet-button');
    if (!button) return;

    const resetButton = createLoadingButton(button, '🔄 Estruturando...');

    try {
      const response = await apiService.structureSheet();
      
      if (response.success) {
        alert(`✅ ${MESSAGES.SHEET_STRUCTURED}\n\n${response.message}`);
        await this.loadUsers();
      } else {
        alert(`❌ Erro ao estruturar planilha:\n\n${response.message}`);
      }
    } catch (error) {
      console.error('Structure sheet error:', error);
      alert('❌ Erro ao estruturar planilha. Verifique o console para mais detalhes.');
    } finally {
      resetButton();
    }
  }

  async loadUsers() {
    const usersList = this.container.querySelector('#users-list');
    
    try {
      const response = await apiService.getUsers();
      
      // Check if sheet needs to be structured
      if (!response.success && response.message?.includes('não encontrada')) {
        usersList.innerHTML = `
          <div class="sheet-setup-warning">
            <h4>⚠️ Planilha Não Configurada</h4>
            <p>A estrutura da planilha precisa ser criada.</p>
            <button id="structure-sheet-button" class="btn btn-primary">
              🛠️ Estruturar Planilha Automaticamente
            </button>
          </div>
        `;
        
        // Add event listener for structure button
        const structureButton = usersList.querySelector('#structure-sheet-button');
        structureButton?.addEventListener('click', () => this.handleStructureSheet());
        
        return;
      }

      this.users = Array.isArray(response) ? response : (response.data || []);
      this.renderUsers();
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

    usersList.innerHTML = this.users.map(user => `
      <div class="user-item">
        <div class="user-info">
          <div class="user-name">${escapeHtml(user.nome)}</div>
          <div class="user-details">
            <span class="user-points">${user.pontos} pontos</span>
            <span class="user-type ${user.tipo === 'Administrador' ? 'admin' : 'user'}">
              ${user.tipo}
            </span>
          </div>
        </div>
        <div class="user-actions">
          <button 
            class="btn btn-sm btn-primary" 
            onclick="window.adminPanel.editUser('${user.id}', '${escapeHtml(user.nome)}', '${escapeHtml(user.senha)}', '${user.tipo}', ${user.pontos})"
          >
            ✏️ Editar
          </button>
          <button 
            class="btn btn-sm btn-danger" 
            data-delete-user="${user.id}"
            onclick="window.adminPanel.deleteUser('${user.id}', '${escapeHtml(user.nome)}')"
          >
            🗑️ Excluir
          </button>
        </div>
      </div>
    `).join('');

    // Store reference for onclick handlers
    window.adminPanel = {
      editUser: (userId, nome, senha, tipo, pontos) => {
        this.showUserForm('edit', { id: userId, nome, senha, tipo, pontos });
      },
      deleteUser: (userId, userName) => this.handleDeleteUser(userId, userName)
    };
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

  refresh() {
    this.loadUsers();
  }
}
