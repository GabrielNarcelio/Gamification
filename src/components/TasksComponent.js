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
            <input 
              type="number" 
              id="new-task-points" 
              placeholder="Pontos (1-1000)" 
              min="1" 
              max="1000"
              title="Digite um valor entre 1 e 1000 pontos"
            />
            <small class="form-hint">Valor entre 1 e 1000 pontos</small>
          </div>
          <button id="create-task-button" class="btn btn-primary">Criar Tarefa</button>
          <div id="task-form-error" class="error-message"></div>
        </div>
      ` : ''}
      
      <div id="task-summary" class="task-summary" style="display: none;">
        <!-- Resumo será preenchido dinamicamente -->
      </div>
      
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
    
    if (state.userType === 'Administrador') {
      const createButton = this.container.querySelector('#create-task-button');
      createButton?.addEventListener('click', () => this.handleCreateTask());

      // Enter key support for inputs
      const titleInput = this.container.querySelector('#new-task-title');
      const pointsInput = this.container.querySelector('#new-task-points');
      const errorDiv = this.container.querySelector('#task-form-error');
      
      // Validação em tempo real para pontos
      pointsInput?.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const isValid = !isNaN(value) && value >= 1 && value <= 1000;
        
        if (e.target.value && !isValid) {
          e.target.style.borderColor = 'var(--danger-color)';
          if (isNaN(value)) {
            errorDiv.textContent = 'Digite apenas números para os pontos';
          } else if (value < 1) {
            errorDiv.textContent = 'Os pontos devem ser pelo menos 1';
          } else if (value > 1000) {
            errorDiv.textContent = 'Os pontos não podem exceder 1000';
          }
          errorDiv.style.display = 'block';
        } else {
          e.target.style.borderColor = '';
          if (errorDiv.textContent.includes('pontos')) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
          }
        }
      });
      
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
        
        // ✅ Trigger specific cache cleanup for task creation
        stateManager.onTaskCreated();
        
        // Show success message
        this.showSuccessMessage(MESSAGES.TASK_CREATED);
      } else {
        errorDiv.textContent = response.message || 'Erro ao criar tarefa.';
      }
    } catch (error) {
      console.error('Create task error:', error);
      
      // Tentar extrair mensagem específica do backend
      let errorMessage = MESSAGES.GENERIC_ERROR;
      
      if (error.message) {
        // Se a mensagem contém JSON, tentar extrair a mensagem de erro
        const jsonMatch = error.message.match(/\{.*\}/);
        if (jsonMatch) {
          try {
            const errorData = JSON.parse(jsonMatch[0]);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            console.warn('Não foi possível parsear erro do servidor:', parseError);
          }
        } else {
          // Usar a mensagem de erro diretamente se não for JSON
          errorMessage = error.message;
        }
      }
      
      errorDiv.textContent = errorMessage;
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
        // ✅ Trigger specific cache cleanup for task deletion
        stateManager.onTaskDeleted();
        
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
        
        // ✅ Trigger specific cache cleanup for task completion
        stateManager.onTaskCompleted();
        
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
      
      // Para usuários normais, verificar status real das tarefas completadas de forma otimizada
      if (!isAdmin && userId) {
        await this.verifyTaskCompletionStatus(userId);
      }
      
      this.renderTasks();
    } catch (error) {
      console.error('❌ Erro ao carregar tarefas:', error);
      taskList.innerHTML = '<div class="error">Erro ao carregar tarefas.</div>';
    }
  }

  renderTasks() {
    this.renderTaskSummary();
    this.renderTaskList();
  }

  renderTaskSummary() {
    const taskSummary = this.container.querySelector('#task-summary');
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    if (isAdmin) {
      taskSummary.style.display = 'none';
      return;
    }

    // Calcular estatísticas para usuários normais
    const totalTasks = this.tasks.length;
    const availableTasks = this.tasks.filter(task => !task.isCompleted);
    const completedTasks = this.tasks.filter(task => task.isCompleted);
    const assignedTasks = this.tasks.filter(task => task.isAssigned && !task.isCompleted);
    const assignedCompletedTasks = this.tasks.filter(task => task.isAssigned && task.isCompleted);

    if (totalTasks === 0) {
      taskSummary.style.display = 'none';
      return;
    }

    taskSummary.style.display = 'block';
    taskSummary.innerHTML = `
      <div class="summary-cards">
        <div class="summary-card available">
          <div class="summary-number">${availableTasks.length}</div>
          <div class="summary-label">Tarefas Disponíveis</div>
        </div>
        ${assignedTasks.length > 0 ? `
          <div class="summary-card assigned">
            <div class="summary-number">${assignedTasks.length}</div>
            <div class="summary-label">Atribuídas a Você</div>
          </div>
        ` : ''}
        <div class="summary-card completed">
          <div class="summary-number">${completedTasks.length}</div>
          <div class="summary-label">Concluídas</div>
        </div>
        ${assignedCompletedTasks.length > 0 ? `
          <div class="summary-card assigned-completed">
            <div class="summary-number">${assignedCompletedTasks.length}</div>
            <div class="summary-label">Atribuídas Concluídas</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderTaskList() {
    const taskList = this.container.querySelector('#task-list');
    const state = stateManager.getState();
    const isAdmin = state.userType === 'Administrador';

    // Separar tarefas por categoria
    const availableTasks = [];
    const completedTasks = [];
    const assignedCompletedTasks = [];

    this.tasks.forEach(task => {
      if (task.isCompleted) {
        if (task.isAssigned) {
          assignedCompletedTasks.push(task);
        } else {
          completedTasks.push(task);
        }
      } else {
        availableTasks.push(task);
      }
    });

    // Para usuários normais: mostrar apenas tarefas disponíveis + seção de tarefas atribuídas completadas
    // Para admins: mostrar todas as tarefas
    let tasksToShow = [];
    let sectionsHtml = '';

    if (isAdmin) {
      tasksToShow = this.tasks;
      sectionsHtml = this.renderTaskSection('Todas as Tarefas', tasksToShow, isAdmin);
    } else {
      // Usuários normais: mostrar tarefas disponíveis e seção de completadas separadamente
      if (availableTasks.length > 0) {
        sectionsHtml += this.renderTaskSection('🎯 Tarefas Disponíveis', availableTasks, isAdmin);
      }
      
      if (assignedCompletedTasks.length > 0) {
        sectionsHtml += this.renderTaskSection('✅ Tarefas Atribuídas Concluídas', assignedCompletedTasks, isAdmin, true);
      }
      
      if (availableTasks.length === 0 && assignedCompletedTasks.length === 0) {
        sectionsHtml = '<div class="empty">🎉 Nenhuma tarefa pendente. Você está em dia com suas tarefas!</div>';
      }
    }

    taskList.innerHTML = sectionsHtml;

    // Store reference for onclick handlers
    window.taskComponent = {
      concludeTask: (taskId, points) => this.handleConcludeTask(taskId, points),
      deleteTask: (taskId, title) => this.handleDeleteTask(taskId, title)
    };
  }

  renderTaskSection(sectionTitle, tasks, isAdmin, isCompletedSection = false) {
    if (tasks.length === 0) return '';

    const sectionClass = isCompletedSection ? 'completed-tasks-section' : 'available-tasks-section';
    
    return `
      <div class="task-section ${sectionClass}">
        <h3 class="section-title">${sectionTitle}</h3>
        <div class="task-list-section">
          ${tasks.map(task => `
            <div class="task-item ${task.isCompleted ? 'task-completed' : ''} ${task.isAssigned ? 'task-assigned' : ''} ${isCompletedSection ? 'task-readonly' : ''}">
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
              ${isCompletedSection ? `
                <div class="task-completed-info">
                  <small>✅ Tarefa concluída com sucesso! Você ganhou ${task.points} pontos.</small>
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
                ${!isCompletedSection ? `
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
                ` : ''}
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `;
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
    
    // O smart cache agora é gerenciado automaticamente pelo StateManager
    // Apenas recarregar tarefas - o cache será limpo automaticamente quando necessário
    await this.loadTasks();
    
    this.showSuccessMessage('✅ Tarefas atualizadas!');
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

  async verifyTaskCompletionStatus(userId) {
    try {
      console.log('🔍 Verificando status real das tarefas completadas...');
      
      // Buscar todas as tarefas completadas do usuário de uma vez
      const { api } = await import('../services/api.js');
      const historyResponse = await api.getHistory(userId, { type: 'task_completed' });
      
      if (historyResponse && historyResponse.success && historyResponse.data) {
        const completedTaskIds = new Set(
          historyResponse.data
            .filter(entry => entry.type === 'task_completed' && entry.details?.taskId)
            .map(entry => entry.details.taskId)
        );
        
        // Atualizar status das tarefas baseado no histórico real
        let correctedTasks = 0;
        this.tasks.forEach(task => {
          const shouldBeCompleted = completedTaskIds.has(task.id);
          
          // Se há discrepância entre o status local e o servidor
          if (task.isCompleted !== shouldBeCompleted) {
            task.isCompleted = shouldBeCompleted;
            correctedTasks++;
            
            if (shouldBeCompleted) {
              console.log(`✅ Tarefa ${task.id} marcada como completada (estava incorreta)`);
            } else {
              console.log(`⚠️ Tarefa ${task.id} não está realmente completada (corrigindo status)`);
            }
          }
        });
        
        if (correctedTasks > 0) {
          console.log(`🔄 ${correctedTasks} tarefa(s) tiveram status corrigido`);
        } else {
          console.log(`✅ Status de todas as tarefas está sincronizado`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status das tarefas:', error);
    }
  }
}
