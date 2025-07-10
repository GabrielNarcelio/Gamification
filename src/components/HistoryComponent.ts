// Componente de Histórico

import { apiService } from '@/services/api';
import { stateManager } from '@/services/state';
import { escapeHtml } from '@/utils/helpers';
import type { HistoryItem } from '@/types';

export class HistoryComponent {
  private container: HTMLElement;
  private history: HistoryItem[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.loadHistory();
  }

  private render(): void {
    this.container.innerHTML = `
      <div id="history-list" class="history-list">
        <div class="loading">Carregando histórico...</div>
      </div>
    `;
  }

  private async loadHistory(): Promise<void> {
    const historyList = this.container.querySelector('#history-list') as HTMLElement;
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

  private renderHistory(): void {
    const historyList = this.container.querySelector('#history-list') as HTMLElement;
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

  public refresh(): void {
    this.loadHistory();
  }
}
