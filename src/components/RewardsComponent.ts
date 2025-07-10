// Componente de Recompensas/Prêmios

import { apiService } from '@/services/api';
import { stateManager } from '@/services/state';
import { MESSAGES } from '@/utils/config';
import { createLoadingButton, escapeHtml } from '@/utils/helpers';
import type { Reward } from '@/types';

export class RewardsComponent {
  private container: HTMLElement;
  private rewards: Reward[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.loadRewards();
  }

  private render(): void {
    this.container.innerHTML = `
      <div id="rewards-list" class="rewards-list">
        <div class="loading">Carregando prêmios...</div>
      </div>
    `;
  }

  private async handleRedeemReward(rewardId: string, cost: number): Promise<void> {
    const state = stateManager.getState();
    if (!state.user) return;

    if (state.userPoints < cost) {
      alert(MESSAGES.INSUFFICIENT_POINTS);
      return;
    }

    const button = this.container.querySelector(`[data-reward-id="${rewardId}"]`) as HTMLButtonElement;
    if (!button) return;

    const resetButton = createLoadingButton(button, '🔄 Resgatando...');

    try {
      const response = await apiService.redeemReward(rewardId, state.user.nome);
      
      if (response.success) {
        // Update user points
        const newPoints = state.userPoints - cost;
        stateManager.updatePoints(newPoints);
        
        // Show success message
        this.showSuccessMessage(MESSAGES.REWARD_REDEEMED);
      } else {
        alert(response.message || 'Erro ao resgatar prêmio.');
      }
    } catch (error) {
      console.error('Redeem reward error:', error);
      alert(MESSAGES.GENERIC_ERROR);
    } finally {
      resetButton();
    }
  }

  private async loadRewards(): Promise<void> {
    const rewardsList = this.container.querySelector('#rewards-list') as HTMLElement;
    
    try {
      this.rewards = await apiService.getRewards();
      this.renderRewards();
    } catch (error) {
      console.error('Load rewards error:', error);
      rewardsList.innerHTML = '<div class="error">Erro ao carregar prêmios.</div>';
    }
  }

  private renderRewards(): void {
    const rewardsList = this.container.querySelector('#rewards-list') as HTMLElement;
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    if (this.rewards.length === 0) {
      rewardsList.innerHTML = '<div class="empty">Nenhum prêmio disponível.</div>';
      return;
    }

    rewardsList.innerHTML = this.rewards.map(reward => {
      const canAfford = state.userPoints >= reward.custo;
      
      return `
        <div class="reward-item ${!canAfford && !isAdmin ? 'unavailable' : ''}">
          <div class="reward-header">
            <h4>${escapeHtml(reward.nome)}</h4>
            <span class="reward-cost">${reward.custo} pts</span>
          </div>
          <div class="reward-description">
            ${escapeHtml(reward.descricao)}
          </div>
          ${!isAdmin ? `
            <div class="reward-actions">
              <button 
                class="btn ${canAfford ? 'btn-primary' : 'btn-disabled'}" 
                data-reward-id="${reward.id}"
                ${!canAfford ? 'disabled' : ''}
                onclick="window.rewardsComponent.redeemReward('${reward.id}', ${reward.custo})"
              >
                ${canAfford ? '🎁 Resgatar' : '🔒 Pontos insuficientes'}
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Store reference for onclick handlers
    (window as any).rewardsComponent = {
      redeemReward: (rewardId: string, cost: number) => this.handleRedeemReward(rewardId, cost)
    };
  }

  private showSuccessMessage(message: string): void {
    const rewardsList = this.container.querySelector('#rewards-list') as HTMLElement;
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    rewardsList.prepend(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  public refresh(): void {
    this.loadRewards();
  }
}
