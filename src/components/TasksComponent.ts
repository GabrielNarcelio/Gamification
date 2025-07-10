// Componente de Tarefas

import { apiService } from '@/services/api';
import { stateManager } from '@/services/state';
import { MESSAGES } from '@/utils/config';
import { validateRequired, validateTaskPoints, createLoadingButton, escapeHtml } from '@/utils/helpers';
import type { Task } from '@/types';

export class TasksComponent {
  private container: HTMLElement;
  private tasks: Task[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupEventListeners();
    this.loadTasks();
  }

  private render(): void {
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

  private setupEventListeners(): void {
    const state = stateManager.getState();
    if (state.userType === 'Administrador') {
      const createButton = this.container.querySelector('#create-task-button') as HTMLButtonElement;
      createButton?.addEventListener('click', () => this.handleCreateTask());

      // Enter key support for inputs
      const titleInput = this.container.querySelector('#new-task-title') as HTMLInputElement;
      const pointsInput = this.container.querySelector('#new-task-points') as HTMLInputElement;
      
      [titleInput, pointsInput].forEach(input => {
        input?.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.handleCreateTask();
          }
        });
      });
    }
  }

  private async handleCreateTask(): Promise<void> {
    const titleInput = this.container.querySelector('#new-task-title') as HTMLInputElement;
    const descriptionInput = this.container.querySelector('#new-task-description') as HTMLTextAreaElement;
    const pointsInput = this.container.querySelector('#new-task-points') as HTMLInputElement;
    const createButton = this.container.querySelector('#create-task-button') as HTMLButtonElement;
    const errorDiv = this.container.querySelector('#task-form-error') as HTMLElement;

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

    const state = stateManager.getState();
    if (!state.user) return;

    const resetButton = createLoadingButton(createButton, '🔄 Criando...');

    try {
      const response = await apiService.createTask(title, description, parseInt(points), state.user.nome);
      
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

  private async handleConcludeTask(taskId: string, points: number): Promise<void> {
    const state = stateManager.getState();
    if (!state.user) return;

    const button = this.container.querySelector(`[data-task-id="${taskId}"]`) as HTMLButtonElement;
    if (!button) return;

    const resetButton = createLoadingButton(button, '🔄 Concluindo...');

    try {
      const response = await apiService.concludeTask(taskId, state.user.nome);
      
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

  private async loadTasks(): Promise<void> {
    const taskList = this.container.querySelector('#task-list') as HTMLElement;
    
    try {
      this.tasks = await apiService.getTasks();
      this.renderTasks();
    } catch (error) {
      console.error('Load tasks error:', error);
      taskList.innerHTML = '<div class="error">Erro ao carregar tarefas.</div>';
    }
  }

  private renderTasks(): void {
    const taskList = this.container.querySelector('#task-list') as HTMLElement;
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    if (this.tasks.length === 0) {
      taskList.innerHTML = '<div class="empty">Nenhuma tarefa disponível.</div>';
      return;
    }

    taskList.innerHTML = this.tasks.map(task => `
      <div class="task-item">
        <div class="task-header">
          <h4>${escapeHtml(task.titulo)}</h4>
          <span class="task-points">${task.pontos} pts</span>
        </div>
        <div class="task-description">
          ${escapeHtml(task.descricao)}
        </div>
        ${isAdmin ? `
          <div class="task-creator">
            <small>Criado por: ${escapeHtml(task.criador || 'Sistema')}</small>
          </div>
        ` : `
          <div class="task-actions">
            <button 
              class="btn btn-success" 
              data-task-id="${task.id}"
              onclick="window.taskComponent.concludeTask('${task.id}', ${task.pontos})"
            >
              ✅ Concluir
            </button>
          </div>
        `}
      </div>
    `).join('');

    // Store reference for onclick handlers
    (window as any).taskComponent = {
      concludeTask: (taskId: string, points: number) => this.handleConcludeTask(taskId, points)
    };
  }

  private showSuccessMessage(message: string): void {
    const taskList = this.container.querySelector('#task-list') as HTMLElement;
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    taskList.prepend(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  public refresh(): void {
    this.loadTasks();
  }
}
