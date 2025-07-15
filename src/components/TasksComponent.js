// Componente de Tarefas

import { api } from '@/services/api.js';
import { stateManager } from '@/services/state.js';
import { MESSAGES } from '@/utils/config.js';
import { validateRequired, validateTaskPoints, createLoadingButton, escapeHtml } from '@/utils/helpers.js';

export class TasksComponent {
  constructor(container) {
    this.container = container;
    this.tasks = [];
    this.render();
    this.setupEventListeners();
    this.loadTasks();
  }

  render() {
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    this.container.innerHTML = `
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
        
        // Reload tasks
        await this.loadTasks();
        
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
        // Reload tasks para atualizar a lista
        await this.loadTasks();
        
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
        // Update user points
        const newPoints = state.userPoints + points;
        stateManager.updatePoints(newPoints);
        
        // Reload tasks
        await this.loadTasks();
        
        // Show success message
        this.showSuccessMessage(MESSAGES.TASK_COMPLETED);
      } else {
        alert(response.message || 'Erro ao concluir tarefa.');
      }
    } catch (error) {
      console.error('Conclude task error:', error);
      alert(MESSAGES.GENERIC_ERROR);
    } finally {
      resetButton();
    }
  }

  async loadTasks() {
    const taskList = this.container.querySelector('#task-list');
    
    try {
      const response = await api.getTasks();
      this.tasks = response.success ? response.data : [];
      this.renderTasks();
    } catch (error) {
      console.error('Load tasks error:', error);
      taskList.innerHTML = '<div class="error">Erro ao carregar tarefas.</div>';
    }
  }

  renderTasks() {
    const taskList = this.container.querySelector('#task-list');
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    if (this.tasks.length === 0) {
      taskList.innerHTML = '<div class="empty">Nenhuma tarefa disponível.</div>';
      return;
    }

    taskList.innerHTML = this.tasks.map(task => `
      <div class="task-item">
        <div class="task-header">
          <h4>${escapeHtml(task.title)}</h4>
          <span class="task-points">${task.points} pts</span>
        </div>
        <div class="task-description">
          ${escapeHtml(task.description)}
        </div>
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
              class="btn btn-success" 
              data-task-id="${task.id}"
              onclick="window.taskComponent.concludeTask('${task.id}', ${task.points})"
            >
              ✅ Concluir
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

  showSuccessMessage(message) {
    const taskList = this.container.querySelector('#task-list');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    taskList.prepend(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  refresh() {
    this.loadTasks();
  }
}
