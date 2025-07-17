// Componente de Histórico

import { api } from '../services/api.js';
import { stateManager } from '../services/state.js';
import { escapeHtml } from '../utils/helpers.js';

export class HistoryComponent {
  constructor(container) {
    this.container = container;
    this.history = [];
    this.users = [];
    this.selectedUserId = null;
    this.selectedType = null;
    // ✅ Propriedades de paginação
    this.currentPage = 0; // 0-based page index
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
      this.currentPage = 0; // ✅ Reset para primeira página (0-based)
      this.loadHistory();
    });

    typeFilter.addEventListener('change', (e) => {
      this.selectedType = e.target.value || null;
      this.currentPage = 0; // ✅ Reset para primeira página (0-based)
      this.loadHistory();
    });

    clearButton.addEventListener('click', () => {
      this.selectedUserId = null;
      this.selectedType = null;
      this.currentPage = 0; // ✅ Reset para primeira página (0-based)
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
      selectedType: this.selectedType,
      offset: this.currentPage * this.itemsPerPage
    });

    // ✅ Add detailed logging
    console.log('🔍 DEBUG: Estado completo do usuário:', state);
    console.log('🔍 DEBUG: É administrador?', state.userType === 'Administrador');

    try {
      let response;
      const offset = this.currentPage * this.itemsPerPage; // ✅ Correção: usar currentPage diretamente (0-based)
      
      if (state.userType === 'Administrador') {
        // Para admin, usar filtros se especificados
        if (this.selectedUserId) {
          console.log('🔍 DEBUG: Admin buscando histórico de usuário específico');
          const params = {
            limit: this.itemsPerPage,
            offset: offset
          };
          // ✅ Só adicionar type se houver filtro selecionado
          if (this.selectedType) {
            params.type = this.selectedType;
          }
          response = await api.getHistory(this.selectedUserId, params);
        } else {
          console.log('🔍 DEBUG: Admin buscando histórico geral');
          const params = {
            limit: this.itemsPerPage,
            offset: offset
          };
          // ✅ Só adicionar type se houver filtro selecionado
          if (this.selectedType) {
            params.type = this.selectedType;
          }
          response = await api.getAllHistory(params);
        }
      } else {
        console.log('🔍 DEBUG: Usuário comum buscando próprio histórico');
        const params = {
          limit: this.itemsPerPage,
          offset: offset
        };
        // ✅ Só adicionar type se houver filtro selecionado
        if (this.selectedType) {
          params.type = this.selectedType;
        }
        response = await api.getHistory(state.user.id, params);
      }
      
      console.log('🔍 DEBUG: Resposta da API:', response);
      
      if (response && response.success) {
        this.history = response.data || [];
        // ✅ CORREÇÃO: Usar total da paginação da API se disponível
        this.totalItems = response.pagination?.total || this.history.length;
        this.totalPages = response.pagination?.pages || Math.ceil(this.totalItems / this.itemsPerPage);
        
        console.log('🔍 DEBUG: Dados processados:', {
          historyCount: this.history.length,
          totalItems: this.totalItems,
          totalPages: this.totalPages,
          currentPage: this.currentPage,
          pagination: response.pagination
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

    // ✅ CORREÇÃO: Não paginar novamente - os dados já vêm paginados da API
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

  renderPagination() {
    const paginationControls = this.container.querySelector('#pagination-controls');
    const prevButton = paginationControls.querySelector('#prev-page');
    const nextButton = paginationControls.querySelector('#next-page');
    const pageNumbers = paginationControls.querySelector('#page-numbers');
    const infoText = paginationControls.querySelector('#pagination-info-text');

    // ✅ CORREÇÃO: Usar dados da paginação real da API
    const offset = this.currentPage * this.itemsPerPage; // ✅ 0-based
    const startItem = offset + 1;
    const endItem = Math.min(offset + this.history.length, this.totalItems);
    
    infoText.textContent = `Mostrando ${startItem}-${endItem} de ${this.totalItems} registros`;

    // Habilitar/desabilitar botões de navegação
    prevButton.disabled = this.currentPage === 0; // ✅ 0-based
    nextButton.disabled = this.currentPage === this.totalPages - 1 || this.totalPages === 0; // ✅ 0-based

    // ✅ Event listeners para botões de navegação
    prevButton.onclick = () => {
      if (this.currentPage > 0) { // ✅ 0-based
        this.currentPage--;
        this.loadHistory();
      }
    };

    nextButton.onclick = () => {
      if (this.currentPage < this.totalPages - 1) { // ✅ 0-based
        this.currentPage++;
        this.loadHistory();
      }
    };

    // ✅ CORREÇÃO: Limitar número de páginas mostradas para evitar sobrecarga visual
    pageNumbers.innerHTML = '';
    
    if (this.totalPages <= 1) {
      paginationControls.style.display = 'none';
      return;
    }
    
    // Mostrar no máximo 5 páginas por vez (convertendo de 0-based para 1-based para exibição)
    const maxVisiblePages = 5;
    const currentPageDisplay = this.currentPage + 1; // Converter para 1-based para exibição
    let startPage = Math.max(1, currentPageDisplay - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar startPage se estivermos próximos do final
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Botão "Primeira página" se necessário
    if (startPage > 1) {
      const firstButton = document.createElement('button');
      firstButton.className = 'btn btn-pagination';
      firstButton.textContent = '1';
      firstButton.addEventListener('click', () => {
        this.currentPage = 0; // 0-based
        this.loadHistory();
      });
      pageNumbers.appendChild(firstButton);
      
      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.className = 'pagination-ellipsis';
        pageNumbers.appendChild(ellipsis);
      }
    }
    
    // Páginas visíveis
    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement('button');
      pageButton.className = 'btn btn-pagination';
      pageButton.textContent = i; // Mostrar 1-based
      pageButton.disabled = i === currentPageDisplay; // Comparar com valor 1-based
      pageButton.addEventListener('click', () => {
        this.currentPage = i - 1; // Converter para 0-based
        this.loadHistory();
      });
      pageNumbers.appendChild(pageButton);
    }
    
    // Botão "Última página" se necessário
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.className = 'pagination-ellipsis';
        pageNumbers.appendChild(ellipsis);
      }
      
      const lastButton = document.createElement('button');
      lastButton.className = 'btn btn-pagination';
      lastButton.textContent = this.totalPages;
      lastButton.addEventListener('click', () => {
        this.currentPage = this.totalPages - 1; // Converter para 0-based
        this.loadHistory();
      });
      pageNumbers.appendChild(lastButton);
    }

    paginationControls.style.display = 'flex';
  }

  refresh() {
    this.loadHistory();
  }
}
