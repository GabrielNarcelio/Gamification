// Componente de Histórico

import { api } from '@/services/api.js';
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
      let response;
      if (state.userType === 'Administrador') {
        response = await api.getAllHistory();
      } else {
        response = await api.getHistory(state.user.name);
      }
      
      this.history = response.success ? response.data : [];
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
                      item.type === 'user_deleted' ? '🗑️' : '📝';
      
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
