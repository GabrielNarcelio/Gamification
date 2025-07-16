// Componente de Tarefas

import { api } from '@/services/api.js';
import { stateManager } from '@/services/state.js';
import { MESSAGES } from '@/utils/config.js';
import { validateRequired, validateTaskPoints, createLoadingButton, escapeHtml } from '@/utils/helpers.js';
import { CacheManager } from '../utils/cache-manager.js';

export class TasksComponent {
  constructor(container) {
    this.container = container;
    this.tasks = [];
    this.render();
    this.setupEventListeners();
    this.loadTasks();
    
    // ✅ Subscribe to state changes to auto-reload tasks
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
  }

  // ✅ Handle state changes
  handleStateChange(newState) {
    console.log('📋 TasksComponent received state change:', { lastUpdate: newState.lastUpdate, myLastUpdate: this.lastUpdate });
    if (newState.user && newState.lastUpdate && this.lastUpdate !== newState.lastUpdate) {
      // Only reload if there's a lastUpdate timestamp and it's different from our last one
      console.log('📋 TasksComponent reloading tasks...');
      this.lastUpdate = newState.lastUpdate;
      this.loadTasks();
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
      <div class="tasks-header">
        <div class="tasks-actions">
          <button id="refresh-tasks-btn" class="btn btn-secondary">
            🔄 Atualizar
          </button>
          <button id="clear-cache-btn" class="btn btn-warning" title="Limpar cache se houver problemas">
            🧹 Limpar Cache
          </button>
        </div>
      </div>
      
      ${isAdmin ? `
        <div class="task-form">
          <h4>➕ Criar Nova Tarefa</h4>
          <div class="form-group">
            <input type="text" id="new-task-title" placeholder="Título da tarefa" />
          </div>
          <div class="form-group">
            <textarea id="new-task-description" placeholder="Descrição da tarefa"></textarea>
          </div>
          <div class="form-group">
            <input type="number" id="new-task-points" placeholder="Pontos" min="1" />
          </div>
          <button id="create-task-button" class="btn btn-primary">Criar Tarefa</button>
          <div id="task-form-error" class="error-message"></div>
        </div>
      ` : ''}
      
      <div id="task-list" class="task-list">
        <div class="loading">Carregando tarefas...</div>
      </div>
    `;
  }

  setupEventListeners() {
    const state = stateManager.getState();
    
    // Botão de atualizar tarefas
    const refreshBtn = this.container.querySelector('#refresh-tasks-btn');
    refreshBtn?.addEventListener('click', () => this.refreshTasks());
    
    // Botão de limpar cache
    const clearCacheBtn = this.container.querySelector('#clear-cache-btn');
    clearCacheBtn?.addEventListener('click', () => this.clearCache());
    
    if (state.userType === 'Administrador') {
      const createButton = this.container.querySelector('#create-task-button');
      createButton?.addEventListener('click', () => this.handleCreateTask());

      // Enter key support for inputs
      const titleInput = this.container.querySelector('#new-task-title');
      const pointsInput = this.container.querySelector('#new-task-points');
      
      [titleInput, pointsInput].forEach(input => {
        input?.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.handleCreateTask();
          }
        });
      });
    }
  }

  async handleCreateTask() {
    const titleInput = this.container.querySelector('#new-task-title');
    const descriptionInput = this.container.querySelector('#new-task-description');
    const pointsInput = this.container.querySelector('#new-task-points');
    const createButton = this.container.querySelector('#create-task-button');
    const errorDiv = this.container.querySelector('#task-form-error');

    // ✅ Verificar se é admin
    const currentState = stateManager.getState();
    if (!currentState.user || currentState.user.type !== 'admin') {
      errorDiv.innerHTML = '❌ Apenas administradores podem criar tarefas';
      errorDiv.style.display = 'block';
      return;
    }

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const points = pointsInput.value.trim();

    // Clear previous errors
    errorDiv.textContent = '';

    // Validation
    const titleError = validateRequired(title, 'Título');
    const descriptionError = validateRequired(description, 'Descrição');
    const pointsError = validateTaskPoints(points);

    if (titleError || descriptionError || pointsError) {
      errorDiv.textContent = titleError || descriptionError || pointsError || '';
      return;
    }

    if (!currentState.user) return;

    const resetButton = createLoadingButton(createButton, '🔄 Criando...');

    try {
      // ✅ Sempre usar 'admin' como criador
      const response = await api.createTask(title, description, parseInt(points), 'admin');
      
      if (response.success) {
        // Clear form
        titleInput.value = '';
        descriptionInput.value = '';
        pointsInput.value = '';
        
        // ✅ Trigger data refresh across all components
        stateManager.triggerDataRefresh();
        
        // Show success message
        this.showSuccessMessage(MESSAGES.TASK_CREATED);
      } else {
        errorDiv.textContent = response.message || 'Erro ao criar tarefa.';
      }
    } catch (error) {
      console.error('Create task error:', error);
      errorDiv.textContent = MESSAGES.GENERIC_ERROR;
    } finally {
      resetButton();
    }
  }

  async handleDeleteTask(taskId, taskTitle) {
    const currentState = stateManager.getState();
    
    // Verificar se usuário é admin
    if (currentState.userType !== 'Administrador') {
      console.error('❌ Apenas administradores podem deletar tarefas');
      return;
    }

    // Confirmar exclusão
    const confirmed = confirm(`Tem certeza que deseja deletar a tarefa "${taskTitle}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmed) {
      return;
    }

    try {
      console.log('🗑️ Deletando tarefa:', { taskId, taskTitle });
      
      const response = await api.deleteTask(taskId);
      
      if (response.success) {
        // ✅ Trigger data refresh across all components
        stateManager.triggerDataRefresh();
        
        // Show success message
        this.showSuccessMessage(`✅ Tarefa "${taskTitle}" deletada com sucesso!`);
      } else {
        const errorDiv = this.container.querySelector('#task-form-error');
        if (errorDiv) {
          errorDiv.textContent = response.message || 'Erro ao deletar tarefa.';
        }
      }
    } catch (error) {
      console.error('❌ Erro ao deletar tarefa:', error);
      const errorDiv = this.container.querySelector('#task-form-error');
      if (errorDiv) {
        errorDiv.textContent = 'Erro inesperado ao deletar tarefa.';
      }
    }
  }

  async handleConcludeTask(taskId, points) {
    const state = stateManager.getState();
    if (!state.user) return;

    const button = this.container.querySelector(`[data-task-id="${taskId}"]`);
    if (!button) return;

    const resetButton = createLoadingButton(button, '🔄 Concluindo...');

    try {
      const response = await api.concludeTask(taskId, state.user.id);
      
      if (response.success) {
        // Update user points using the backend response
        const newPoints = response.data?.newUserPoints || (state.userPoints + points);
        stateManager.updatePoints(newPoints);
        
        // ✅ Trigger data refresh across all components
        stateManager.triggerDataRefresh();
        
        // Show success message
        this.showSuccessMessage(MESSAGES.TASK_COMPLETED);
      } else {
        // ✅ Melhor tratamento de erros específicos
        const errorMessage = response.error || response.message || 'Erro ao concluir tarefa.';
        if (errorMessage.includes('já foi completada')) {
          this.showWarningMessage('⚠️ Você já completou esta tarefa!');
          // Recarregar tarefas para atualizar o status
          await this.loadTasks();
        } else {
          this.showErrorMessage(errorMessage);
        }
      }
    } catch (error) {
      console.error('Conclude task error:', error);
      
      // ✅ Tratar erros HTTP específicos
      if (error.message.includes('409')) {
        this.showWarningMessage('⚠️ Esta tarefa já foi completada por você!');
        await this.loadTasks(); // Recarregar para atualizar o status
      } else if (error.message.includes('404')) {
        this.showErrorMessage('❌ Tarefa não encontrada!');
      } else if (error.message.includes('403')) {
        this.showErrorMessage('❌ Você não tem permissão para completar esta tarefa!');
      } else {
        this.showErrorMessage('❌ Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      resetButton();
    }
  }

  async loadTasks() {
    const taskList = this.container.querySelector('#task-list');
    const state = stateManager.getState();
    
    try {
      const userId = state.user?.id;
      const isAdmin = state.userType === 'Administrador';
      
      console.log('🔄 Carregando tarefas para usuário:', userId, '(Admin:', isAdmin, ')');
      
      let response;
      if (isAdmin) {
        // Admin vê todas as tarefas
        response = await api.getTasks(userId);
      } else {
        // Usuários veem suas tarefas atribuídas + tarefas gerais
        response = await api.getUserTasks(userId);
      }
      
      this.tasks = response.success ? response.data : [];
      console.log('📋 Tarefas carregadas:', this.tasks.length, 'tarefas');
      
      // Para usuários normais, verificar status real das tarefas completadas
      if (!isAdmin && userId) {
        console.log('🔍 Verificando status real das tarefas...');
        for (let task of this.tasks) {
          if (task.isCompleted) {
            // Verificar no servidor se realmente foi completada
            const reallyCompleted = await CacheManager.isTaskCompleted(task.id, userId);
            if (!reallyCompleted) {
              console.log('⚠️ Tarefa', task.id, 'marcada como completada no cache mas não no servidor');
              task.isCompleted = false; // Corrigir status
            }
          }
        }
      }
      
      this.renderTasks();
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error);
      taskList.innerHTML = '<div class="error">Erro ao carregar tarefas.</div>';
    }
  }

  renderTasks() {
    const taskList = this.container.querySelector('#task-list');
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    // Para usuários normais, filtrar tarefas completadas
    // Para admins, mostrar todas as tarefas
    const tasksToShow = isAdmin ? this.tasks : this.tasks.filter(task => !task.isCompleted);

    if (tasksToShow.length === 0) {
      const message = isAdmin ? 'Nenhuma tarefa disponível.' : 'Nenhuma tarefa pendente. Você completou todas as tarefas disponíveis!';
      taskList.innerHTML = `<div class="empty">${message}</div>`;
      return;
    }

    taskList.innerHTML = tasksToShow.map(task => `
      <div class="task-item ${task.isCompleted ? 'task-completed' : ''} ${task.isAssigned ? 'task-assigned' : ''}">
        <div class="task-header">
          <h4>
            ${task.isAssigned ? '📌 ' : ''}${escapeHtml(task.title)} ${task.isCompleted ? '✅' : ''}
          </h4>
          <span class="task-points">${task.points} pts</span>
        </div>
        ${task.isAssigned ? `
          <div class="task-assignment-info">
            <small>📌 Tarefa atribuída a você</small>
            ${task.deadline ? `<small>⏰ Prazo: ${new Date(task.deadline).toLocaleDateString('pt-BR')}</small>` : ''}
            ${task.notes ? `<small>📝 Observações: ${escapeHtml(task.notes)}</small>` : ''}
          </div>
        ` : ''}
        <div class="task-description">
          ${escapeHtml(task.description)}
        </div>
        ${task.isCompleted ? `
          <div class="task-completed-info">
            <small>✅ Tarefa já completada!</small>
          </div>
        ` : ''}
        ${isAdmin ? `
          <div class="task-creator">
            <small>Criado por: ${escapeHtml(task.createdBy || 'Sistema')}</small>
          </div>
          <div class="task-actions admin-actions">
            <button 
              class="btn btn-danger btn-sm" 
              data-task-id="${task.id}"
              onclick="window.taskComponent.deleteTask('${task.id}', '${escapeHtml(task.title)}')"
              title="Deletar tarefa"
            >
              🗑️ Deletar
            </button>
          </div>
        ` : `
          <div class="task-actions">
            <button 
              class="btn ${task.isCompleted ? 'btn-secondary' : 'btn-success'}" 
              data-task-id="${task.id}"
              onclick="window.taskComponent.concludeTask('${task.id}', ${task.points})"
              ${task.isCompleted ? 'disabled title="Você já completou esta tarefa"' : ''}
            >
              ${task.isCompleted ? '✅ Completada' : '✅ Concluir'}
            </button>
          </div>
        `}
      </div>
    `).join('');

    // Store reference for onclick handlers
    window.taskComponent = {
      concludeTask: (taskId, points) => this.handleConcludeTask(taskId, points),
      deleteTask: (taskId, title) => this.handleDeleteTask(taskId, title)
    };
  }

  // ✅ Métodos para mostrar diferentes tipos de mensagens
  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  showWarningMessage(message) {
    this.showMessage(message, 'warning');
  }

  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type = 'info') {
    // Remover mensagem anterior se existir
    const existingMessage = this.container.querySelector('.task-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `task-message task-message-${type}`;
    messageDiv.innerHTML = `
      <span class="message-text">${message}</span>
      <button class="message-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Inserir no topo do container
    const header = this.container.querySelector('.tasks-header');
    if (header) {
      header.insertAdjacentElement('afterend', messageDiv);
    } else {
      this.container.insertBefore(messageDiv, this.container.firstChild);
    }

    // Auto-remover após 5 segundos (exceto para erros)
    if (type !== 'error') {
      setTimeout(() => {
        if (messageDiv.parentElement) {
          messageDiv.remove();
        }
      }, 5000);
    }
  }

  async refreshTasks() {
    console.log('🔄 Atualizando tarefas...');
    
    // Limpar cache específico de tarefas
    await CacheManager.clearSpecificCache('/api/tasks');
    await CacheManager.clearSpecificCache('/api/history');
    
    // Recarregar tarefas
    await this.loadTasks();
    
    this.showSuccessMessage('✅ Tarefas atualizadas!');
  }

  async clearCache() {
    if (confirm('🧹 Isso vai limpar todo o cache e recarregar a página. Continuar?')) {
      await CacheManager.clearAllCache();
    }
  }

  showSuccessMessage(message) {
    // Criar elemento de notificação temporária
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  refresh() {
    this.loadTasks();
  }
}
