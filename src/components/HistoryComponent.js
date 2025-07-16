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
    // ✅ Propriedades de paginação
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalItems = 0;
    this.totalPages = 0;
    this.render();
    this.loadUsers();
    
    // ✅ Subscribe to state changes to auto-reload history
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
  }

  // ✅ Handle state changes
  handleStateChange(newState) {
    if (newState.user && newState.lastUpdate && this.lastUpdate !== newState.lastUpdate) {
      // Only reload if there's a lastUpdate timestamp and it's different from our last one
      this.lastUpdate = newState.lastUpdate;
      this.loadHistory();
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
      <div class="history-header">
        <h3>📜 Histórico de Atividades</h3>
        <div id="history-filters" class="history-filters">
          <!-- Filtros serão adicionados dinamicamente -->
        </div>
      </div>
      <div id="history-list" class="history-list">
        <div class="loading">Carregando histórico...</div>
      </div>
      <!-- ✅ Controles de paginação -->
      <div id="pagination-controls" class="pagination-controls" style="display: none;">
        <div class="pagination-info">
          <span id="pagination-info-text"></span>
        </div>
        <div class="pagination-buttons">
          <button id="prev-page" class="btn btn-secondary" disabled>
            ◀ Anterior
          </button>
          <span id="page-numbers" class="page-numbers"></span>
          <button id="next-page" class="btn btn-secondary" disabled>
            Próxima ▶
          </button>
        </div>
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
      this.currentPage = 1; // ✅ Reset para primeira página
      this.loadHistory();
    });

    typeFilter.addEventListener('change', (e) => {
      this.selectedType = e.target.value || null;
      this.currentPage = 1; // ✅ Reset para primeira página
      this.loadHistory();
    });

    clearButton.addEventListener('click', () => {
      this.selectedUserId = null;
      this.selectedType = null;
      this.currentPage = 1; // ✅ Reset para primeira página
      userFilter.value = '';
      typeFilter.value = '';
      this.loadHistory();
    });
  }

  async loadHistory() {
    const historyList = this.container.querySelector('#history-list');
    const state = stateManager.getState();
    
    if (!state.user) return;

    console.log('🔍 DEBUG: Carregando histórico...', {
      userId: state.user.id,
      userType: state.userType,
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      selectedUserId: this.selectedUserId,
      selectedType: this.selectedType
    });

    try {
      let response;
      const offset = (this.currentPage - 1) * this.itemsPerPage;
      
      if (state.userType === 'Administrador') {
        // Para admin, usar filtros se especificados
        if (this.selectedUserId) {
          console.log('🔍 DEBUG: Admin buscando histórico de usuário específico');
          response = await api.getHistory(this.selectedUserId, {
            limit: this.itemsPerPage,
            offset: offset,
            type: this.selectedType
          });
        } else {
          console.log('🔍 DEBUG: Admin buscando histórico geral');
          response = await api.getAllHistory({
            limit: this.itemsPerPage,
            offset: offset,
            type: this.selectedType
          });
        }
      } else {
        console.log('🔍 DEBUG: Usuário comum buscando próprio histórico');
        response = await api.getHistory(state.user.id, {
          limit: this.itemsPerPage,
          offset: offset,
          type: this.selectedType
        });
      }
      
      console.log('🔍 DEBUG: Resposta da API:', response);
      
      if (response && response.success) {
        this.history = response.data || [];
        this.totalItems = response.pagination?.total || this.history.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        console.log('🔍 DEBUG: Dados processados:', {
          historyCount: this.history.length,
          totalItems: this.totalItems,
          totalPages: this.totalPages
        });
        this.renderHistory();
        this.renderPagination();
      } else {
        console.warn('⚠️ Resposta da API sem sucesso, usando dados vazios');
        this.history = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.renderHistory();
        this.renderPagination();
      }
    } catch (error) {
      console.error('❌ Load history error:', error);
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

    // Paginar histórico
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const paginatedHistory = this.history.slice(start, end);

    historyList.innerHTML = paginatedHistory.map(item => {
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

  renderPagination() {
    const paginationControls = this.container.querySelector('#pagination-controls');
    const prevButton = paginationControls.querySelector('#prev-page');
    const nextButton = paginationControls.querySelector('#next-page');
    const pageNumbers = paginationControls.querySelector('#page-numbers');
    const infoText = paginationControls.querySelector('#pagination-info-text');

    // Atualizar texto de informação da página
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    infoText.textContent = `Mostrando ${startItem}-${endItem} de ${this.totalItems} registros`;

    // Habilitar/desabilitar botões de navegação
    prevButton.disabled = this.currentPage === 1;
    nextButton.disabled = this.currentPage === this.totalPages || this.totalPages === 0;

    // ✅ Event listeners para botões de navegação
    prevButton.onclick = () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadHistory();
      }
    };

    nextButton.onclick = () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadHistory();
      }
    };

    // Renderizar números das páginas
    pageNumbers.innerHTML = '';
    for (let i = 1; i <= this.totalPages; i++) {
      const pageButton = document.createElement('button');
      pageButton.className = 'btn btn-pagination';
      pageButton.textContent = i;
      pageButton.disabled = i === this.currentPage;
      pageButton.addEventListener('click', () => {
        this.currentPage = i;
        this.loadHistory();
      });
      pageNumbers.appendChild(pageButton);
    }

    paginationControls.style.display = this.totalPages > 1 ? 'flex' : 'none';
  }

  refresh() {
    this.loadHistory();
  }
}
