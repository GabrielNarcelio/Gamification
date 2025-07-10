// Componente de Ranking

import { apiService } from '@/services/api';
import { stateManager } from '@/services/state';
import { escapeHtml } from '@/utils/helpers';
import type { RankingItem } from '@/types';

export class RankingComponent {
  private container: HTMLElement;
  private ranking: RankingItem[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.loadRanking();
  }

  private render(): void {
    this.container.innerHTML = `
      <div id="ranking-list" class="ranking-list">
        <div class="loading">Carregando ranking...</div>
      </div>
    `;
  }

  private async loadRanking(): Promise<void> {
    const rankingList = this.container.querySelector('#ranking-list') as HTMLElement;
    
    try {
      this.ranking = await apiService.getRanking();
      this.renderRanking();
    } catch (error) {
      console.error('Load ranking error:', error);
      rankingList.innerHTML = '<div class="error">Erro ao carregar ranking.</div>';
    }
  }

  private renderRanking(): void {
    const rankingList = this.container.querySelector('#ranking-list') as HTMLElement;
    const state = stateManager.getState();
    const currentUser = state.user?.nome;
    const isAdmin = state.userType === 'Administrador';

    if (this.ranking.length === 0) {
      rankingList.innerHTML = '<div class="empty">Nenhum usuário encontrado no ranking.</div>';
      return;
    }

    rankingList.innerHTML = this.ranking.map((userRank, index) => {
      const isCurrentUser = userRank.nome === currentUser && !isAdmin;
      const position = index + 1;
      
      let badge = '';
      let positionClass = '';
      
      if (position === 1) {
        badge = '<span class="ranking-badge gold">🥇</span>';
        positionClass = 'top-1';
      } else if (position === 2) {
        badge = '<span class="ranking-badge silver">🥈</span>';
        positionClass = 'top-2';
      } else if (position === 3) {
        badge = '<span class="ranking-badge bronze">🥉</span>';
        positionClass = 'top-3';
      }

      return `
        <div class="ranking-item ${positionClass} ${isCurrentUser ? 'current-user' : ''}">
          <div class="ranking-position">#${position}</div>
          <div class="ranking-name">
            ${escapeHtml(userRank.nome)}${isCurrentUser ? ' (Você)' : ''}
          </div>
          <div class="ranking-points">${userRank.pontos} pts</div>
          ${badge}
        </div>
      `;
    }).join('');
  }

  public refresh(): void {
    this.loadRanking();
  }
}
