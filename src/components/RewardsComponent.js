// Componente de Recompensas/Prêmios

import { api } from '../services/api.js';
import { stateManager } from '../services/state.js';
import { MESSAGES } from '../utils/config.js';
import { createLoadingButton, escapeHtml } from '../utils/helpers.js';

export class RewardsComponent {
  constructor(container) {
    if (!container) {
      throw new Error('RewardsComponent requires a valid container element');
    }
    
    this.container = container;
    this.rewards = [];
    this.render();
    this.loadRewards();
    
    // ✅ Subscribe to state changes to auto-reload rewards
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
  }

  // ✅ Handle state changes
  handleStateChange(newState) {
    if (newState.user && newState.lastUpdate && this.lastUpdate !== newState.lastUpdate) {
      // Only reload if there's a lastUpdate timestamp and it's different from our last one
      this.lastUpdate = newState.lastUpdate;
      this.loadRewards();
    }
  }

  // ✅ Cleanup method
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    this.container.innerHTML = `
      ${isAdmin ? `
        <div class="reward-form">
          <h4>➕ Criar Novo Prêmio</h4>
          <div class="form-group">
            <input type="text" id="new-reward-title" placeholder="Nome do prêmio" />
          </div>
          <div class="form-group">
            <textarea id="new-reward-description" placeholder="Descrição do prêmio"></textarea>
          </div>
          <div class="form-group">
            <input type="number" id="new-reward-cost" placeholder="Custo em pontos" min="1" max="10000" />
          </div>
          <div class="form-group">
            <select id="new-reward-category">
              <option value="Geral">Geral</option>
              <option value="Eletrônicos">Eletrônicos</option>
              <option value="Livros">Livros</option>
              <option value="Vouchers">Vouchers</option>
              <option value="Experiências">Experiências</option>
            </select>
          </div>
          <div class="form-group">
            <input type="number" id="new-reward-stock" placeholder="Estoque (opcional)" min="0" max="1000" />
          </div>
          <button id="create-reward-button" class="btn btn-primary">Criar Prêmio</button>
          <div id="reward-form-error" class="error-message"></div>
        </div>
      ` : ''}
      
      <div id="rewards-list" class="rewards-list">
        <div class="loading">Carregando prêmios...</div>
      </div>
    `;

    // Setup event listeners if admin
    if (isAdmin) {
      this.setupAdminEventListeners();
    }
  }

  setupAdminEventListeners() {
    const createButton = this.container.querySelector('#create-reward-button');
    createButton?.addEventListener('click', () => this.handleCreateReward());
  }

  async handleCreateReward() {
    const titleInput = this.container.querySelector('#new-reward-title');
    const descriptionInput = this.container.querySelector('#new-reward-description');
    const costInput = this.container.querySelector('#new-reward-cost');
    const categoryInput = this.container.querySelector('#new-reward-category');
    const stockInput = this.container.querySelector('#new-reward-stock');
    const errorDiv = this.container.querySelector('#reward-form-error');
    const createButton = this.container.querySelector('#create-reward-button');

    // Clear previous errors
    errorDiv.textContent = '';

    // Get values
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const cost = costInput.value.trim();
    const category = categoryInput.value;
    const stock = stockInput.value.trim();

    // Validations
    if (!title) {
      errorDiv.textContent = 'Nome do prêmio é obrigatório.';
      return;
    }

    if (!description) {
      errorDiv.textContent = 'Descrição é obrigatória.';
      return;
    }

    if (!cost || parseInt(cost) < 1 || parseInt(cost) > 10000) {
      errorDiv.textContent = 'Custo deve estar entre 1 e 10000 pontos.';
      return;
    }

    if (stock && (parseInt(stock) < 0 || parseInt(stock) > 1000)) {
      errorDiv.textContent = 'Estoque deve estar entre 0 e 1000.';
      return;
    }

    const resetButton = createLoadingButton(createButton, '🔄 Criando...');

    try {
      const response = await api.createReward(title, description, cost, category, stock);
      
      if (response.success) {
        // Clear form
        titleInput.value = '';
        descriptionInput.value = '';
        costInput.value = '';
        categoryInput.value = 'Geral';
        stockInput.value = '';
        
        // ✅ Trigger data refresh across all components
        stateManager.triggerDataRefresh();
        
        // Show success message
        this.showSuccessMessage('✅ Prêmio criado com sucesso!');
      } else {
        errorDiv.textContent = response.message || 'Erro ao criar prêmio.';
      }
    } catch (error) {
      console.error('Create reward error:', error);
      errorDiv.textContent = 'Erro inesperado ao criar prêmio.';
    } finally {
      resetButton();
    }
  }

  async handleDeleteReward(rewardId, rewardTitle) {
    const state = stateManager.getState();
    
    // Verificar se usuário é admin
    if (state.userType !== 'Administrador') {
      console.error('❌ Apenas administradores podem deletar prêmios');
      return;
    }

    // Confirmar exclusão
    const confirmed = confirm(`Tem certeza que deseja deletar o prêmio "${rewardTitle}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmed) {
      return;
    }

    try {
      console.log('🗑️ Deletando prêmio:', { rewardId, rewardTitle });
      
      const response = await api.deleteReward(rewardId);
      
      if (response.success) {
        // ✅ Trigger data refresh across all components
        stateManager.triggerDataRefresh();
        
        // Show success message
        this.showSuccessMessage(`✅ Prêmio "${rewardTitle}" deletado com sucesso!`);
      } else {
        const errorDiv = this.container.querySelector('#reward-form-error');
        if (errorDiv) {
          errorDiv.textContent = response.message || 'Erro ao deletar prêmio.';
        }
      }
    } catch (error) {
      console.error('❌ Erro ao deletar prêmio:', error);
      const errorDiv = this.container.querySelector('#reward-form-error');
      if (errorDiv) {
        errorDiv.textContent = 'Erro inesperado ao deletar prêmio.';
      }
    }
  }

  async handleRedeemReward(rewardId, cost) {
    const state = stateManager.getState();
    if (!state.user) return;

    // Verificar se o prêmio ainda existe e tem estoque
    const reward = this.rewards.find(r => r.id === rewardId);
    if (!reward) {
      alert('Prêmio não encontrado.');
      return;
    }

    if (reward.stock !== undefined && reward.stock === 0) {
      alert('❌ Este prêmio está esgotado!');
      return;
    }

    if (state.userPoints < cost) {
      alert(MESSAGES.INSUFFICIENT_POINTS);
      return;
    }

    const button = this.container.querySelector(`[data-reward-id="${rewardId}"]`);
    if (!button) return;

    const resetButton = createLoadingButton(button, '🔄 Resgatando...');

    try {
      const response = await api.redeemReward(rewardId, state.user.id);
      
      if (response.success) {
        // Update user points
        const newPoints = state.userPoints - cost;
        stateManager.updatePoints(newPoints);
        
        // ✅ Trigger data refresh across all components
        stateManager.triggerDataRefresh();
        
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

  async loadRewards() {
    const rewardsList = this.container.querySelector('#rewards-list');
    
    try {
      const response = await api.getRewards();
      this.rewards = response.success ? response.data : [];
      this.renderRewards();
    } catch (error) {
      console.error('Load rewards error:', error);
      rewardsList.innerHTML = '<div class="error">Erro ao carregar prêmios.</div>';
    }
  }

  renderRewards() {
    const rewardsList = this.container.querySelector('#rewards-list');
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    if (this.rewards.length === 0) {
      rewardsList.innerHTML = '<div class="empty">Nenhum prêmio disponível.</div>';
      return;
    }

    rewardsList.innerHTML = this.rewards.map(reward => {
      const canAfford = state.userPoints >= reward.cost;
      const isOutOfStock = reward.stock !== undefined && reward.stock === 0;
      const canRedeem = canAfford && !isOutOfStock;
      
      return `
        <div class="reward-item ${(!canRedeem && !isAdmin) || isOutOfStock ? 'unavailable' : ''}">
          <div class="reward-header">
            <h4>${escapeHtml(reward.title)}</h4>
            <span class="reward-cost">${reward.cost} pts</span>
          </div>
          <div class="reward-description">
            ${escapeHtml(reward.description)}
          </div>
          <div class="reward-meta">
            <small>Categoria: ${escapeHtml(reward.category || 'Geral')}</small>
            ${reward.stock !== undefined ? 
              `<small class="${isOutOfStock ? 'out-of-stock' : ''}">
                ${isOutOfStock ? '❌ Esgotado' : `Estoque: ${reward.stock}`}
              </small>` : 
              ''
            }
          </div>
          ${isAdmin ? `
            <div class="reward-actions admin-actions">
              <button 
                class="btn btn-danger btn-sm" 
                data-reward-id="${reward.id}"
                onclick="window.rewardsComponent.deleteReward('${reward.id}', '${escapeHtml(reward.title)}')"
                title="Deletar prêmio"
              >
                🗑️ Deletar
              </button>
            </div>
          ` : `
            <div class="reward-actions">
              <button 
                class="btn ${canRedeem ? 'btn-primary' : 'btn-disabled'}" 
                data-reward-id="${reward.id}"
                ${!canRedeem ? 'disabled' : ''}
                onclick="window.rewardsComponent.redeemReward('${reward.id}', ${reward.cost})"
              >
                ${isOutOfStock ? '❌ Esgotado' : canAfford ? '🎁 Resgatar' : '🔒 Pontos insuficientes'}
              </button>
            </div>
          `}
        </div>
      `;
    }).join('');

    // Store reference for onclick handlers
    window.rewardsComponent = {
      redeemReward: (rewardId, cost) => this.handleRedeemReward(rewardId, cost),
      deleteReward: (rewardId, title) => this.handleDeleteReward(rewardId, title)
    };
  }

  showSuccessMessage(message) {
    const rewardsList = this.container.querySelector('#rewards-list');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    rewardsList.prepend(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  refresh() {
    this.loadRewards();
  }
}
