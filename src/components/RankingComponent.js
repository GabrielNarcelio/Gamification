// Componente de Ranking

import { api } from '../services/api.js';
import { stateManager } from '../services/state.js';
import { escapeHtml } from '../utils/helpers.js';

export class RankingComponent {
  constructor(container) {
    this.container = container;
    this.ranking = [];
    this.render();
    this.loadRanking();
    
    // ✅ Subscribe to state changes to auto-reload ranking
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
  }

  // ✅ Handle state changes
  handleStateChange(newState) {
    if (newState.user && newState.lastUpdate && this.lastUpdate !== newState.lastUpdate) {
      // Only reload if there's a lastUpdate timestamp and it's different from our last one
      this.lastUpdate = newState.lastUpdate;
      this.loadRanking();
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
      <div id="ranking-list" class="ranking-list">
        <div class="loading">Carregando ranking...</div>
      </div>
    `;
  }

  async loadRanking() {
    const rankingList = this.container.querySelector('#ranking-list');
    
    try {
      const response = await api.getRanking();
      this.ranking = response.success ? response.data : [];
      this.renderRanking();
    } catch (error) {
      console.error('Load ranking error:', error);
      rankingList.innerHTML = '<div class="error">Erro ao carregar ranking.</div>';
    }
  }

  renderRanking() {
    const rankingList = this.container.querySelector('#ranking-list');
    const state = stateManager.getState();
    const currentUser = state.user?.name;
    const isAdmin = state.userType === 'Administrador';

    if (this.ranking.length === 0) {
      rankingList.innerHTML = '<div class="empty">Nenhum usuário encontrado no ranking.</div>';
      return;
    }

    rankingList.innerHTML = this.ranking.map((userRank, index) => {
      const isCurrentUser = userRank.name === currentUser && !isAdmin;
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
            ${escapeHtml(userRank.name)}${isCurrentUser ? ' (Você)' : ''}
          </div>
          <div class="ranking-points">${userRank.points} pts</div>
          ${badge}
        </div>
      `;
    }).join('');
  }

  refresh() {
    this.loadRanking();
  }
}
