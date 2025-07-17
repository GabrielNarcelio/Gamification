// Componente de Distribuição de Tarefas

import { api } from '@/services/api.js';
import { stateManager } from '@/services/state.js';
import { escapeHtml } from '@/utils/helpers.js';

export class TaskDistributionComponent {
  constructor(container) {
    this.container = container;
    this.tasks = [];
    this.users = [];
    this.assignments = [];
    this.selectedUserId = null;
    this.selectedCategory = 'all';
    this.selectedPriority = 'all';
    this.render();
    this.loadData();
    
    // Subscribe to state changes
    this.unsubscribe = stateManager.subscribe(this.handleStateChange.bind(this));
    
    // Set global reference for onclick handlers
    window.taskDistribution = this;
  }

  handleStateChange(newState) {
    if (newState.user && newState.lastUpdate && this.lastUpdate !== newState.lastUpdate) {
      this.lastUpdate = newState.lastUpdate;
      this.loadData();
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    const state = stateManager.getState();
    if (state.userType !== 'Administrador') {
      this.container.innerHTML = '<div class="error">❌ Acesso negado. Apenas administradores podem acessar esta seção.</div>';
      return;
    }

    this.container.innerHTML = `
      <div class="task-distribution-header">
        <h3>📊 Distribuição de Tarefas</h3>
        <div class="distribution-stats" id="distribution-stats">
          <!-- Estatísticas serão carregadas aqui -->
        </div>
      </div>

      <div class="distribution-filters">
        <div class="filter-group">
          <label for="user-filter">Filtrar por usuário:</label>
          <select id="user-filter">
            <option value="">Todos os usuários</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="category-filter">Categoria:</label>
          <select id="category-filter">
            <option value="all">Todas as categorias</option>
            <option value="desenvolvimento">Desenvolvimento</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="administrativo">Administrativo</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="priority-filter">Prioridade:</label>
          <select id="priority-filter">
            <option value="all">Todas as prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        
        <button id="refresh-data" class="btn btn-secondary">🔄 Atualizar</button>
      </div>

      <div class="distribution-tabs">
        <button class="tab-button active" data-tab="available">📋 Disponíveis</button>
        <button class="tab-button" data-tab="assigned">👥 Atribuídas</button>
        <button class="tab-button" data-tab="completed">✅ Concluídas</button>
        <button class="tab-button" data-tab="bulk-assign">🎯 Atribuição em Massa</button>
      </div>

      <div class="distribution-content">
        <div id="tab-available" class="tab-content active">
          <div class="available-tasks-section">
            <h4>📋 Tarefas Disponíveis para Atribuição</h4>
            <div id="available-tasks-list" class="tasks-grid">
              <div class="loading">Carregando tarefas disponíveis...</div>
            </div>
          </div>
        </div>

        <div id="tab-assigned" class="tab-content">
          <div class="assigned-tasks-section">
            <h4>👥 Tarefas Atribuídas</h4>
            <div id="assigned-tasks-list" class="assignments-grid">
              <div class="loading">Carregando atribuições...</div>
            </div>
          </div>
        </div>

        <div id="tab-completed" class="tab-content">
          <div class="completed-tasks-section">
            <h4>✅ Tarefas Concluídas</h4>
            <div id="completed-tasks-list" class="completed-grid">
              <div class="loading">Carregando tarefas concluídas...</div>
            </div>
          </div>
        </div>

        <div id="tab-bulk-assign" class="tab-content">
          <div class="bulk-assign-section">
            <h4>🎯 Atribuição em Massa</h4>
            <div class="bulk-assign-form">
              <div class="form-group">
                <label>Selecionar usuários:</label>
                <div id="users-checkbox-list" class="checkbox-list">
                  <!-- Lista de usuários será carregada aqui -->
                </div>
              </div>
              
              <div class="form-group">
                <label>Selecionar tarefas:</label>
                <div id="tasks-checkbox-list" class="checkbox-list">
                  <!-- Lista de tarefas será carregada aqui -->
                </div>
              </div>
              
              <div class="form-group">
                <label for="bulk-deadline">Data limite (opcional):</label>
                <input type="datetime-local" id="bulk-deadline" />
              </div>
              
              <button id="bulk-assign-button" class="btn btn-primary">🎯 Atribuir Tarefas Selecionadas</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para atribuição individual -->
      <div id="assign-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h4>👤 Atribuir Tarefa</h4>
            <span class="close">&times;</span>
          </div>
          <div class="modal-body">
            <div id="assign-task-info"></div>
            <div class="form-group">
              <label for="assign-user">Selecionar usuário:</label>
              <select id="assign-user">
                <option value="">Selecione um usuário</option>
              </select>
            </div>
            <div class="form-group">
              <label for="assign-deadline">Data limite (opcional):</label>
              <input type="datetime-local" id="assign-deadline" />
            </div>
            <div class="form-group">
              <label for="assign-notes">Observações (opcional):</label>
              <textarea id="assign-notes" placeholder="Instruções especiais ou observações"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button id="confirm-assign" class="btn btn-primary">✅ Confirmar Atribuição</button>
            <button id="cancel-assign" class="btn btn-secondary">❌ Cancelar</button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab navigation
    const tabButtons = this.container.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Filters
    const userFilter = this.container.querySelector('#user-filter');
    const categoryFilter = this.container.querySelector('#category-filter');
    const priorityFilter = this.container.querySelector('#priority-filter');
    const refreshButton = this.container.querySelector('#refresh-data');

    userFilter?.addEventListener('change', (e) => {
      this.selectedUserId = e.target.value;
      this.applyFilters();
    });

    categoryFilter?.addEventListener('change', (e) => {
      this.selectedCategory = e.target.value;
      this.applyFilters();
    });

    priorityFilter?.addEventListener('change', (e) => {
      this.selectedPriority = e.target.value;
      this.applyFilters();
    });

    refreshButton?.addEventListener('click', () => {
      this.loadData();
    });

    // Bulk assign
    const bulkAssignButton = this.container.querySelector('#bulk-assign-button');
    bulkAssignButton?.addEventListener('click', () => {
      this.handleBulkAssign();
    });

    // Modal
    const modal = this.container.querySelector('#assign-modal');
    const closeModal = modal?.querySelector('.close');
    const cancelButton = modal?.querySelector('#cancel-assign');
    const confirmButton = modal?.querySelector('#confirm-assign');

    closeModal?.addEventListener('click', () => {
      this.closeAssignModal();
    });

    cancelButton?.addEventListener('click', () => {
      this.closeAssignModal();
    });

    confirmButton?.addEventListener('click', () => {
      this.handleConfirmAssign();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeAssignModal();
      }
    });
  }

  switchTab(tabName) {
    // Update active tab button
    const tabButtons = this.container.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    this.container.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

    // Update active tab content
    const tabContents = this.container.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    this.container.querySelector(`#tab-${tabName}`)?.classList.add('active');

    // Load specific data for the tab
    switch (tabName) {
      case 'available':
        this.renderAvailableTasks();
        break;
      case 'assigned':
        this.renderAssignedTasks();
        break;
      case 'completed':
        this.renderCompletedTasks();
        break;
      case 'bulk-assign':
        this.renderBulkAssignForm();
        break;
    }
  }

  async loadData() {
    try {
      console.log('🔄 Carregando dados de distribuição...');
      
      // Load tasks, users, and assignments in parallel
      const [tasksResponse, usersResponse, assignmentsResponse] = await Promise.all([
        api.getAllTasks(),
        api.getAllUsers(),
        api.getTaskAssignments()
      ]);

      console.log('📋 Resposta das tarefas:', tasksResponse);
      console.log('👥 Resposta dos usuários:', usersResponse);
      console.log('📊 Resposta das atribuições:', assignmentsResponse);

      this.tasks = tasksResponse.data || [];
      this.users = (usersResponse.data || []).filter(user => user.type !== 'admin');
      this.assignments = assignmentsResponse.data || [];

      console.log('✅ Dados carregados:', {
        tasks: this.tasks.length,
        users: this.users.length,
        assignments: this.assignments.length
      });

      this.renderStats();
      this.renderUserFilter();
      this.renderAvailableTasks();
    } catch (error) {
      console.error('❌ Erro ao carregar dados de distribuição:', error);
    }
  }

  renderStats() {
    const statsContainer = this.container.querySelector('#distribution-stats');
    if (!statsContainer) return;

    const availableTasks = this.tasks.filter(task => !this.isTaskAssigned(task.id) && !this.isTaskCompleted(task.id));
    const assignedTasks = this.assignments.filter(assignment => assignment.status === 'assigned');
    const completedTasks = this.assignments.filter(assignment => assignment.status === 'completed');
    const overdueTasks = this.assignments.filter(assignment => 
      assignment.status === 'assigned' && 
      assignment.deadline && 
      new Date(assignment.deadline) < new Date()
    );

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card available">
          <div class="stat-number">${availableTasks.length}</div>
          <div class="stat-label">📋 Disponíveis</div>
        </div>
        <div class="stat-card assigned">
          <div class="stat-number">${assignedTasks.length}</div>
          <div class="stat-label">👥 Atribuídas</div>
        </div>
        <div class="stat-card completed">
          <div class="stat-number">${completedTasks.length}</div>
          <div class="stat-label">✅ Concluídas</div>
        </div>
        <div class="stat-card overdue">
          <div class="stat-number">${overdueTasks.length}</div>
          <div class="stat-label">⏰ Atrasadas</div>
        </div>
      </div>
    `;
  }

  renderUserFilter() {
    const userFilter = this.container.querySelector('#user-filter');
    if (!userFilter) return;

    const currentValue = userFilter.value;
    userFilter.innerHTML = `
      <option value="">Todos os usuários</option>
      ${this.users.map(user => `
        <option value="${user.id}" ${currentValue === user.id ? 'selected' : ''}>
          ${escapeHtml(user.name)} (${user.points} pts)
        </option>
      `).join('')}
    `;
  }

  renderAvailableTasks() {
    const container = this.container.querySelector('#available-tasks-list');
    if (!container) return;

    const filteredTasks = this.getFilteredTasks();
    const availableTasks = filteredTasks.filter(task => 
      !this.isTaskAssigned(task.id) && 
      !this.isTaskCompleted(task.id)
    );

    if (availableTasks.length === 0) {
      container.innerHTML = '<div class="empty">📋 Nenhuma tarefa disponível para atribuição.</div>';
      return;
    }

    container.innerHTML = availableTasks.map(task => `
      <div class="task-card available-task">
        <div class="task-header">
          <h5>${escapeHtml(task.title || task.name)}</h5>
          <span class="task-points">${task.points} pts</span>
        </div>
        <div class="task-meta">
          <span class="task-category">${escapeHtml(task.category || 'Outros')}</span>
          <span class="task-priority priority-${task.priority || 'media'}">${this.getPriorityIcon(task.priority)} ${this.getPriorityLabel(task.priority)}</span>
        </div>
        <div class="task-description">
          ${escapeHtml(task.description)}
        </div>
        <div class="task-actions">
          <button class="btn btn-primary btn-sm" onclick="window.taskDistribution.openAssignModal('${task.id}')">
            👤 Atribuir
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.taskDistribution.viewTaskDetails('${task.id}')">
            👁️ Detalhes
          </button>
        </div>
      </div>
    `).join('');
  }

  renderAssignedTasks() {
    const container = this.container.querySelector('#assigned-tasks-list');
    if (!container) return;

    const filteredAssignments = this.getFilteredAssignments();
    const assignedTasks = filteredAssignments.filter(assignment => assignment.status === 'assigned');

    if (assignedTasks.length === 0) {
      container.innerHTML = '<div class="empty">👥 Nenhuma tarefa atribuída no momento.</div>';
      return;
    }

    container.innerHTML = assignedTasks.map(assignment => {
      const task = this.tasks.find(t => t.id === assignment.taskId);
      const user = this.users.find(u => u.id === assignment.userId);
      const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();

      return `
        <div class="assignment-card ${isOverdue ? 'overdue' : ''}">
          <div class="assignment-header">
            <h5>${escapeHtml(task?.title || task?.name || 'Tarefa não encontrada')}</h5>
            <span class="assignment-status">${isOverdue ? '⏰ Atrasada' : '⏳ Em andamento'}</span>
          </div>
          <div class="assignment-info">
            <div class="assigned-user">
              <strong>👤 Usuário:</strong> ${escapeHtml(user?.name || 'Usuário não encontrado')}
            </div>
            <div class="assigned-date">
              <strong>📅 Atribuída em:</strong> ${new Date(assignment.assignedAt).toLocaleDateString('pt-BR')}
            </div>
            ${assignment.deadline ? `
              <div class="assignment-deadline">
                <strong>⏰ Prazo:</strong> ${new Date(assignment.deadline).toLocaleDateString('pt-BR')}
              </div>
            ` : ''}
            ${assignment.notes ? `
              <div class="assignment-notes">
                <strong>📝 Observações:</strong> ${escapeHtml(assignment.notes)}
              </div>
            ` : ''}
          </div>
          <div class="assignment-actions">
            <button class="btn btn-warning btn-sm" onclick="window.taskDistribution.reassignTask('${assignment.id}')">
              🔄 Reatribuir
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.taskDistribution.unassignTask('${assignment.id}')">
              ❌ Remover Atribuição
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCompletedTasks() {
    const container = this.container.querySelector('#completed-tasks-list');
    if (!container) return;

    console.log('🔍 Renderizando tarefas concluídas...');
    console.log('📋 Total de atribuições carregadas:', this.assignments.length);
    
    const completedTasks = this.assignments.filter(assignment => assignment.status === 'completed');
    console.log('✅ Tarefas concluídas encontradas:', completedTasks.length);
    console.log('📊 Tarefas concluídas:', completedTasks);

    if (completedTasks.length === 0) {
      container.innerHTML = '<div class="empty">✅ Nenhuma tarefa concluída ainda.</div>';
      return;
    }

    container.innerHTML = completedTasks.map(assignment => {
      const task = this.tasks.find(t => t.id === assignment.taskId);
      const user = this.users.find(u => u.id === assignment.userId);
      
      console.log(`🔍 Processando tarefa ${assignment.taskId}:`, { task, user });

      return `
        <div class="completed-card">
          <div class="completed-header">
            <h5>✅ ${escapeHtml(task?.title || task?.name || 'Tarefa não encontrada')}</h5>
            <span class="completed-points">+${task?.points || 0} pts</span>
          </div>
          <div class="completed-info">
            <div class="completed-user">
              <strong>👤 Usuário:</strong> ${escapeHtml(user?.name || 'Usuário não encontrado')}
            </div>
            <div class="completed-date">
              <strong>📅 Concluída em:</strong> ${new Date(assignment.completedAt).toLocaleDateString('pt-BR')}
            </div>
            <div class="completion-time">
              <strong>⏱️ Tempo:</strong> ${this.calculateCompletionTime(assignment.assignedAt, assignment.completedAt)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderBulkAssignForm() {
    const usersContainer = this.container.querySelector('#users-checkbox-list');
    const tasksContainer = this.container.querySelector('#tasks-checkbox-list');

    if (!usersContainer || !tasksContainer) return;

    // Render users checkboxes
    usersContainer.innerHTML = this.users.map(user => `
      <label class="checkbox-item">
        <input type="checkbox" value="${user.id}" />
        <span>${escapeHtml(user.name)} (${user.points} pts)</span>
      </label>
    `).join('');

    // Render available tasks checkboxes
    const availableTasks = this.tasks.filter(task => 
      !this.isTaskAssigned(task.id) && 
      !this.isTaskCompleted(task.id)
    );

    tasksContainer.innerHTML = availableTasks.map(task => `
      <label class="checkbox-item">
        <input type="checkbox" value="${task.id}" />
        <span>${escapeHtml(task.title || task.name)} (${task.points} pts)</span>
      </label>
    `).join('');
  }

  // Utility methods
  isTaskAssigned(taskId) {
    return this.assignments.some(assignment => 
      assignment.taskId === taskId && 
      assignment.status === 'assigned'
    );
  }

  isTaskCompleted(taskId) {
    return this.assignments.some(assignment => 
      assignment.taskId === taskId && 
      assignment.status === 'completed'
    );
  }

  getPriorityIcon(priority) {
    switch (priority) {
      case 'alta': return '🔴';
      case 'media': return '🟡';
      case 'baixa': return '🟢';
      default: return '⚪';
    }
  }

  getPriorityLabel(priority) {
    switch (priority) {
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      case 'baixa': return 'Baixa';
      default: return 'Não definida';
    }
  }

  calculateCompletionTime(assignedAt, completedAt) {
    const assigned = new Date(assignedAt);
    const completed = new Date(completedAt);
    const diffMs = completed - assigned;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} e ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    }
  }

  // Modal and assignment methods
  openAssignModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = this.container.querySelector('#assign-modal');
    const taskInfo = modal.querySelector('#assign-task-info');
    const userSelect = modal.querySelector('#assign-user');

    taskInfo.innerHTML = `
      <div class="assign-task-preview">
        <h5>${escapeHtml(task.title || task.name)}</h5>
        <p>${escapeHtml(task.description)}</p>
        <div class="task-points">Pontuação: ${task.points} pts</div>
      </div>
    `;

    userSelect.innerHTML = `
      <option value="">Selecione um usuário</option>
      ${this.users.map(user => `
        <option value="${user.id}">${escapeHtml(user.name)} (${user.points} pts)</option>
      `).join('')}
    `;

    modal.style.display = 'block';
    modal.setAttribute('data-task-id', taskId);
  }

  closeAssignModal() {
    const modal = this.container.querySelector('#assign-modal');
    modal.style.display = 'none';
    modal.removeAttribute('data-task-id');
    
    // Clear form
    modal.querySelector('#assign-user').value = '';
    modal.querySelector('#assign-deadline').value = '';
    modal.querySelector('#assign-notes').value = '';
  }

  async handleConfirmAssign() {
    const modal = this.container.querySelector('#assign-modal');
    const taskId = modal.getAttribute('data-task-id');
    const userId = modal.querySelector('#assign-user').value;
    const deadline = modal.querySelector('#assign-deadline').value;
    const notes = modal.querySelector('#assign-notes').value;

    if (!userId) {
      alert('Por favor, selecione um usuário.');
      return;
    }

    try {
      const response = await api.assignTask({
        taskId,
        userId,
        deadline: deadline || null,
        notes: notes || null
      });

      if (response.success) {
        this.closeAssignModal();
        this.loadData();
        this.showSuccessMessage('✅ Tarefa atribuída com sucesso!');
      } else {
        alert('Erro ao atribuir tarefa: ' + response.message);
      }
    } catch (error) {
      console.error('❌ Erro ao atribuir tarefa:', error);
      alert('Erro inesperado ao atribuir tarefa.');
    }
  }

  async handleBulkAssign() {
    const selectedUsers = Array.from(this.container.querySelectorAll('#users-checkbox-list input:checked'))
      .map(input => input.value);
    const selectedTasks = Array.from(this.container.querySelectorAll('#tasks-checkbox-list input:checked'))
      .map(input => input.value);
    const deadline = this.container.querySelector('#bulk-deadline').value;

    if (selectedUsers.length === 0) {
      alert('Por favor, selecione pelo menos um usuário.');
      return;
    }

    if (selectedTasks.length === 0) {
      alert('Por favor, selecione pelo menos uma tarefa.');
      return;
    }

    const confirmMessage = `Confirma a atribuição de ${selectedTasks.length} tarefa(s) para ${selectedUsers.length} usuário(s)?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const assignments = [];
      for (const userId of selectedUsers) {
        for (const taskId of selectedTasks) {
          assignments.push({
            taskId,
            userId,
            deadline: deadline || null
          });
        }
      }

      const response = await api.bulkAssignTasks(assignments);

      if (response.success) {
        this.loadData();
        this.showSuccessMessage(`✅ ${assignments.length} atribuições realizadas com sucesso!`);
        
        // Clear selections
        this.container.querySelectorAll('#users-checkbox-list input').forEach(input => input.checked = false);
        this.container.querySelectorAll('#tasks-checkbox-list input').forEach(input => input.checked = false);
        this.container.querySelector('#bulk-deadline').value = '';
      } else {
        alert('Erro na atribuição em massa: ' + response.message);
      }
    } catch (error) {
      console.error('❌ Erro na atribuição em massa:', error);
      alert('Erro inesperado na atribuição em massa.');
    }
  }

  applyFilters() {
    // Apply filters to tasks and assignments based on selected criteria
    console.log('🔍 Aplicando filtros:', {
      userId: this.selectedUserId,
      category: this.selectedCategory,
      priority: this.selectedPriority
    });
    
    // Re-render all sections with filtered data
    this.renderAvailableTasks();
    this.renderAssignedTasks();
    this.renderCompletedTasks();
    this.renderStats(); // Update stats with filtered data
  }

  getFilteredTasks() {
    return this.tasks.filter(task => {
      // Category filter
      if (this.selectedCategory !== 'all' && task.category !== this.selectedCategory) {
        return false;
      }
      
      // Priority filter
      if (this.selectedPriority !== 'all' && task.priority !== this.selectedPriority) {
        return false;
      }
      
      return true;
    });
  }

  getFilteredAssignments() {
    return this.assignments.filter(assignment => {
      // User filter
      if (this.selectedUserId && assignment.userId !== this.selectedUserId) {
        return false;
      }
      
      return true;
    });
  }

  // Métodos que estão sendo chamados pelo onclick mas não estão implementados
  viewTaskDetails(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Check if task is assigned and get assignment info
    const assignment = this.assignments.find(a => a.taskId === taskId && a.status === 'assigned');
    const assignedUser = assignment ? this.users.find(u => u.id === assignment.userId) : null;
    
    const details = `📋 DETALHES DA TAREFA
    
🏷️ Título: ${task.title || task.name}
📝 Descrição: ${task.description}
⭐ Pontos: ${task.points}
📂 Categoria: ${task.category || 'Outros'}
🎯 Prioridade: ${this.getPriorityLabel(task.priority)}
📅 Criada em: ${new Date(task.createdAt || Date.now()).toLocaleDateString('pt-BR')}

${assignment ? `👤 ATRIBUIÇÃO:
• Usuário: ${assignedUser?.name || 'Não encontrado'}
• Atribuída em: ${new Date(assignment.assignedAt).toLocaleDateString('pt-BR')}
${assignment.deadline ? `• Prazo: ${new Date(assignment.deadline).toLocaleDateString('pt-BR')}` : ''}
${assignment.notes ? `• Observações: ${assignment.notes}` : ''}` : '✅ Status: Disponível para atribuição'}`;
    
    alert(details);
  }

  async reassignTask(assignmentId) {
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) return;
    
    const task = this.tasks.find(t => t.id === assignment.taskId);
    const currentUser = this.users.find(u => u.id === assignment.userId);
    
    // Create a modal-like experience using prompt
    const userOptions = this.users
      .filter(u => u.id !== assignment.userId) // Exclude current user
      .map((u, index) => `${index + 1}. ${u.name} (${u.points} pts)`)
      .join('\n');
    
    const newUserIndex = prompt(`Reatribuir tarefa "${task?.title || 'Tarefa'}" de "${currentUser?.name || 'Usuário'}" para:\n\n${userOptions}\n\nDigite o número do usuário:`);
    
    if (!newUserIndex || isNaN(newUserIndex)) return;
    
    const selectedUser = this.users.filter(u => u.id !== assignment.userId)[parseInt(newUserIndex) - 1];
    if (!selectedUser) {
      alert('Usuário inválido selecionado.');
      return;
    }
    
    try {
      const response = await api.updateAssignment(assignmentId, { userId: selectedUser.id });
      if (response.success) {
        this.loadData();
        this.showSuccessMessage(`✅ Tarefa reatribuída para ${selectedUser.name} com sucesso!`);
      } else {
        alert('Erro ao reatribuir tarefa: ' + response.message);
      }
    } catch (error) {
      console.error('❌ Erro ao reatribuir tarefa:', error);
      alert('Erro inesperado ao reatribuir tarefa.');
    }
  }

  async unassignTask(assignmentId) {
    if (!confirm('Tem certeza que deseja remover esta atribuição?')) {
      return;
    }
    
    try {
      const response = await api.removeAssignment(assignmentId);
      if (response.success) {
        this.loadData();
        this.showSuccessMessage('✅ Atribuição removida com sucesso!');
      } else {
        alert('Erro ao remover atribuição: ' + response.message);
      }
    } catch (error) {
      console.error('❌ Erro ao remover atribuição:', error);
      alert('Erro inesperado ao remover atribuição.');
    }
  }

  showSuccessMessage(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  refresh() {
    this.loadData();
  }
}

// Global reference will be set in constructor
