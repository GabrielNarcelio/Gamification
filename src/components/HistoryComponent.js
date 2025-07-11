// Componente de Histórico

import { apiService } from '@/services/api.js';
import { stateManager } from '@/services/state.js';
import { escapeHtml } from '@/utils/helpers.js';

export class HistoryComponent {
  constructor(container) {
    this.container = container;
    this.history = [];
    this.render();
    this.loadHistory();
  }

  render() {
    this.container.innerHTML = `
      <div id="history-list" class="history-list">
        <div class="loading">Carregando histórico...</div>
      </div>
    `;
  }

  async loadHistory() {
    const historyList = this.container.querySelector('#history-list');
    const state = stateManager.getState();
    
    if (!state.user) return;

    try {
      if (state.userType === 'Administrador') {
        this.history = await apiService.getAllHistory();
      } else {
        this.history = await apiService.getHistory(state.user.nome);
      }
      
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
      const typeIcon = item.tipo === 'Tarefa Concluída' ? '✅' : '🎁';
      
      return `
        <div class="history-item ${isAdmin ? 'admin-history' : ''}">
          ${isAdmin ? `
            <div class="history-header">
              <strong>${escapeHtml(item.usuario)}</strong>
              <span class="history-date">${escapeHtml(item.data)}</span>
            </div>
            <div class="history-content">
              ${typeIcon} ${escapeHtml(item.tipo)}: ${escapeHtml(item.descricao)} 
              <span class="history-points">(${item.pontos})</span>
            </div>
          ` : `
            <div class="history-single">
              <span class="history-date">${escapeHtml(item.data)}</span>
              <span class="history-separator">—</span>
              <span class="history-type">${typeIcon} ${escapeHtml(item.tipo)}</span>
              <span class="history-separator">—</span>
              <span class="history-description">${escapeHtml(item.descricao)}</span>
              <span class="history-points">(${item.pontos})</span>
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
