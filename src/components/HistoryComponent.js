// Componente de Histórico

import { api } from '@/services/api.js';
import { stateManager } from '@/services/state.js';
import { escapeHtml } from '@/utils/helpers.js';

export class HistoryComponent {
  constructor(container) {
    this.container = container;
    this.history = [];
    this.users = [];
    this.selectedUserId = null;
    this.selectedType = null;
    this.render();
    this.loadUsers();
    this.loadHistory();
  }

  render() {
    this.container.innerHTML = `
      <div class="history-header">
        <h3>📜 Histórico de Atividades</h3>
        <div id="history-filters" class="history-filters">
          <!-- Filtros serão adicionados dinamicamente -->
        </div>
      </div>
      <div id="history-list" class="history-list">
        <div class="loading">Carregando histórico...</div>
      </div>
    `;
  }

  async loadUsers() {
    const state = stateManager.getState();
    
    if (state.userType === 'Administrador') {
      try {
        const response = await api.getUsers();
        this.users = response.success ? response.data : [];
        this.renderFilters();
      } catch (error) {
        console.error('Load users error:', error);
      }
    }
  }

  renderFilters() {
    const state = stateManager.getState();
    const filtersContainer = this.container.querySelector('#history-filters');
    
    if (state.userType !== 'Administrador') {
      filtersContainer.style.display = 'none';
      return;
    }

    filtersContainer.innerHTML = `
      <div class="filter-group">
        <label for="user-filter">Filtrar por usuário:</label>
        <select id="user-filter">
          <option value="">Todos os usuários</option>
          ${this.users.map(user => `
            <option value="${user.id}" ${this.selectedUserId === user.id ? 'selected' : ''}>
              ${escapeHtml(user.name)} (${user.type === 'admin' ? 'Admin' : 'Usuário'})
            </option>
          `).join('')}
        </select>
      </div>
      
      <div class="filter-group">
        <label for="type-filter">Filtrar por tipo:</label>
        <select id="type-filter">
          <option value="">Todos os tipos</option>
          <option value="task_completed" ${this.selectedType === 'task_completed' ? 'selected' : ''}>Tarefas Concluídas</option>
          <option value="reward_redeemed" ${this.selectedType === 'reward_redeemed' ? 'selected' : ''}>Prêmios Resgatados</option>
          <option value="user_created" ${this.selectedType === 'user_created' ? 'selected' : ''}>Usuários Criados</option>
          <option value="user_deleted" ${this.selectedType === 'user_deleted' ? 'selected' : ''}>Usuários Deletados</option>
          <option value="user_login" ${this.selectedType === 'user_login' ? 'selected' : ''}>Logins</option>
        </select>
      </div>
      
      <button id="clear-filters" class="btn btn-secondary">🗑️ Limpar Filtros</button>
    `;

    // Adicionar event listeners
    const userFilter = filtersContainer.querySelector('#user-filter');
    const typeFilter = filtersContainer.querySelector('#type-filter');
    const clearButton = filtersContainer.querySelector('#clear-filters');

    userFilter.addEventListener('change', (e) => {
      this.selectedUserId = e.target.value || null;
      this.loadHistory();
    });

    typeFilter.addEventListener('change', (e) => {
      this.selectedType = e.target.value || null;
      this.loadHistory();
    });

    clearButton.addEventListener('click', () => {
      this.selectedUserId = null;
      this.selectedType = null;
      userFilter.value = '';
      typeFilter.value = '';
      this.loadHistory();
    });
  }

  async loadHistory() {
    const historyList = this.container.querySelector('#history-list');
    const state = stateManager.getState();
    
    if (!state.user) return;

    try {
      let response;
      if (state.userType === 'Administrador') {
        // Para admin, usar filtros se especificados
        if (this.selectedUserId) {
          response = await api.getHistory(this.selectedUserId);
        } else {
          response = await api.getAllHistory();
        }
      } else {
        response = await api.getHistory(state.user.id);
      }
      
      let history = response.success ? response.data : [];
      
      // Aplicar filtro de tipo se especificado
      if (this.selectedType) {
        history = history.filter(item => item.type === this.selectedType);
      }
      
      this.history = history;
      this.renderHistory();
    } catch (error) {
      console.error('Load history error:', error);
      historyList.innerHTML = '<div class="error">Erro ao carregar histórico.</div>';
    }
  }

  renderHistory() {
    const historyList = this.container.querySelector('#history-list');
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    if (this.history.length === 0) {
      historyList.innerHTML = '<div class="empty">Nenhuma atividade encontrada.</div>';
      return;
    }

    historyList.innerHTML = this.history.map(item => {
      const typeIcon = item.type === 'task_completed' ? '✅' : 
                      item.type === 'reward_redeemed' ? '🎁' : 
                      item.type === 'user_created' ? '👤' : 
                      item.type === 'user_deleted' ? '🗑️' : 
                      item.type === 'user_login' ? '🔐' : '📝';
      
      // Format timestamp to readable date
      const date = new Date(item.timestamp).toLocaleString('pt-BR');
      
      return `
        <div class="history-item ${isAdmin ? 'admin-history' : ''}">
          ${isAdmin ? `
            <div class="history-header">
              <strong>${escapeHtml(item.userName || 'Sistema')}</strong>
              <span class="history-date">${date}</span>
            </div>
            <div class="history-content">
              ${typeIcon} ${escapeHtml(item.description)} 
              <span class="history-points">(${item.points > 0 ? '+' : ''}${item.points} pts)</span>
            </div>
          ` : `
            <div class="history-single">
              <span class="history-date">${date}</span>
              <span class="history-separator">—</span>
              <span class="history-type">${typeIcon}</span>
              <span class="history-separator">—</span>
              <span class="history-description">${escapeHtml(item.description)}</span>
              <span class="history-points">(${item.points > 0 ? '+' : ''}${item.points} pts)</span>
            </div>
          `}
        </div>
      `;
    }).join('');
  }

  refresh() {
    this.loadHistory();
  }
}
