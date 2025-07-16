const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

// Utilitários
const readData = async () => {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Erro ao ler dados:', error);
    return { users: [], tasks: [], rewards: [], history: [], assignments: [] };
  }
};

const saveData = async (data) => {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error);
    throw error;
  }
};

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const addToHistory = async (entry) => {
  const data = await readData();
  data.history.push({
    id: generateId(),
    ...entry,
    timestamp: new Date().toISOString()
  });
  await saveData(data);
};

// GET /api/assignments - Listar todas as atribuições
router.get('/', async (req, res) => {
  try {
    const { userId, status } = req.query;
    console.log('📋 Listando atribuições...', { userId, status });
    
    const data = await readData();
    let assignments = data.assignments || [];
    
    // Filtrar por usuário se especificado
    if (userId) {
      assignments = assignments.filter(a => a.userId === userId);
    }
    
    // Filtrar por status se especificado
    if (status) {
      assignments = assignments.filter(a => a.status === status);
    }
    
    // Adicionar informações das tarefas e usuários
    const assignmentsWithInfo = assignments.map(assignment => {
      const task = data.tasks.find(t => t.id === assignment.taskId);
      const user = data.users.find(u => u.id === assignment.userId);
      
      return {
        ...assignment,
        taskTitle: task?.title || 'Tarefa não encontrada',
        taskPoints: task?.points || 0,
        userName: user?.name || 'Usuário não encontrado',
        userType: user?.type || 'unknown'
      };
    });
    
    res.json({ 
      success: true, 
      data: assignmentsWithInfo,
      total: assignmentsWithInfo.length 
    });
  } catch (error) {
    console.error('❌ Erro ao listar atribuições:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar atribuições',
      message: error.message 
    });
  }
});

// POST /api/assignments - Criar nova atribuição
router.post('/', async (req, res) => {
  try {
    const { taskId, userId, deadline, notes, assignedBy } = req.body;
    
    console.log('📋 Criando atribuição...', { taskId, userId, deadline, notes, assignedBy });
    
    // Validações
    if (!taskId || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'TaskId e userId são obrigatórios' 
      });
    }
    
    const data = await readData();
    
    // Verificar se a tarefa existe
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tarefa não encontrada' 
      });
    }
    
    // Verificar se o usuário existe
    const user = data.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }
    
    // Verificar se a tarefa já está atribuída a este usuário
    const existingAssignment = (data.assignments || []).find(a => 
      a.taskId === taskId && 
      a.userId === userId && 
      a.status === 'assigned'
    );
    
    if (existingAssignment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Esta tarefa já está atribuída a este usuário' 
      });
    }
    
    // Verificar se a tarefa já foi concluída por este usuário
    const completedAssignment = (data.assignments || []).find(a => 
      a.taskId === taskId && 
      a.userId === userId && 
      a.status === 'completed'
    );
    
    if (completedAssignment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Esta tarefa já foi concluída por este usuário' 
      });
    }
    
    // Criar atribuição
    const assignment = {
      id: generateId(),
      taskId,
      userId,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
      assignedBy: assignedBy || 'system',
      deadline: deadline || null,
      notes: notes || null,
      completedAt: null
    };
    
    // Inicializar assignments se não existir
    if (!data.assignments) {
      data.assignments = [];
    }
    
    data.assignments.push(assignment);
    await saveData(data);
    
    // Adicionar ao histórico
    await addToHistory({
      userId: assignedBy || 'system',
      type: 'task_assigned',
      description: `Tarefa '${task.title}' atribuída ao usuário '${user.name}'`,
      points: 0,
      details: {
        taskId,
        taskTitle: task.title,
        assignedUserId: userId,
        assignedUserName: user.name,
        deadline,
        notes
      },
      userName: assignedBy ? (data.users.find(u => u.id === assignedBy)?.name || 'Admin') : 'Sistema'
    });
    
    res.json({ 
      success: true, 
      data: assignment,
      message: 'Tarefa atribuída com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao criar atribuição:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar atribuição',
      message: error.message 
    });
  }
});

// POST /api/assignments/bulk - Atribuição em massa
router.post('/bulk', async (req, res) => {
  try {
    const { assignments: assignmentRequests, assignedBy } = req.body;
    
    console.log('📋 Criando atribuições em massa...', { count: assignmentRequests?.length, assignedBy });
    
    if (!Array.isArray(assignmentRequests) || assignmentRequests.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Lista de atribuições é obrigatória' 
      });
    }
    
    const data = await readData();
    const createdAssignments = [];
    const errors = [];
    
    // Processar cada atribuição
    for (let i = 0; i < assignmentRequests.length; i++) {
      const { taskId, userId, deadline, notes } = assignmentRequests[i];
      
      try {
        // Validações individuais
        const task = data.tasks.find(t => t.id === taskId);
        const user = data.users.find(u => u.id === userId);
        
        if (!task) {
          errors.push(`Tarefa ${taskId} não encontrada`);
          continue;
        }
        
        if (!user) {
          errors.push(`Usuário ${userId} não encontrado`);
          continue;
        }
        
        // Verificar se já existe atribuição
        const existingAssignment = (data.assignments || []).find(a => 
          a.taskId === taskId && 
          a.userId === userId && 
          ['assigned', 'completed'].includes(a.status)
        );
        
        if (existingAssignment) {
          errors.push(`Tarefa '${task.title}' já está atribuída ou foi concluída pelo usuário '${user.name}'`);
          continue;
        }
        
        // Criar atribuição
        const assignment = {
          id: generateId(),
          taskId,
          userId,
          status: 'assigned',
          assignedAt: new Date().toISOString(),
          assignedBy: assignedBy || 'system',
          deadline: deadline || null,
          notes: notes || null,
          completedAt: null
        };
        
        createdAssignments.push(assignment);
        
        // Adicionar ao histórico
        await addToHistory({
          userId: assignedBy || 'system',
          type: 'task_assigned',
          description: `Tarefa '${task.title}' atribuída ao usuário '${user.name}'`,
          points: 0,
          details: {
            taskId,
            taskTitle: task.title,
            assignedUserId: userId,
            assignedUserName: user.name,
            deadline,
            notes,
            bulkAssignment: true
          },
          userName: assignedBy ? (data.users.find(u => u.id === assignedBy)?.name || 'Admin') : 'Sistema'
        });
        
      } catch (err) {
        errors.push(`Erro ao processar atribuição ${i + 1}: ${err.message}`);
      }
    }
    
    // Salvar todas as atribuições criadas
    if (!data.assignments) {
      data.assignments = [];
    }
    
    data.assignments.push(...createdAssignments);
    await saveData(data);
    
    res.json({ 
      success: true, 
      data: {
        created: createdAssignments,
        createdCount: createdAssignments.length,
        errors: errors
      },
      message: `${createdAssignments.length} atribuições criadas com sucesso${errors.length > 0 ? ` (${errors.length} erros)` : ''}` 
    });
  } catch (error) {
    console.error('❌ Erro na atribuição em massa:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro na atribuição em massa',
      message: error.message 
    });
  }
});

// PUT /api/assignments/:id - Atualizar atribuição
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deadline, notes, completedBy } = req.body;
    
    console.log(`📋 Atualizando atribuição ${id}...`, { status, deadline, notes, completedBy });
    
    const data = await readData();
    
    const assignmentIndex = (data.assignments || []).findIndex(a => a.id === id);
    if (assignmentIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Atribuição não encontrada' 
      });
    }
    
    const assignment = data.assignments[assignmentIndex];
    const task = data.tasks.find(t => t.id === assignment.taskId);
    const user = data.users.find(u => u.id === assignment.userId);
    
    // Atualizar campos
    if (status !== undefined) {
      assignment.status = status;
      
      if (status === 'completed') {
        assignment.completedAt = new Date().toISOString();
        assignment.completedBy = completedBy || assignment.userId;
        
        // Adicionar pontos ao usuário
        if (user && task) {
          user.points = (user.points || 0) + task.points;
          
          // Adicionar ao histórico
          await addToHistory({
            userId: user.id,
            type: 'task_completed',
            description: `Tarefa '${task.title}' concluída`,
            points: task.points,
            details: {
              taskId: task.id,
              taskTitle: task.title,
              pointsEarned: task.points,
              completedViaAssignment: true
            },
            userName: user.name
          });
        }
      }
    }
    
    if (deadline !== undefined) {
      assignment.deadline = deadline;
    }
    
    if (notes !== undefined) {
      assignment.notes = notes;
    }
    
    await saveData(data);
    
    res.json({ 
      success: true, 
      data: assignment,
      message: 'Atribuição atualizada com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar atribuição:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar atribuição',
      message: error.message 
    });
  }
});

// DELETE /api/assignments/:id - Remover atribuição
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { removedBy } = req.body;
    
    console.log(`📋 Removendo atribuição ${id}...`, { removedBy });
    
    const data = await readData();
    
    const assignmentIndex = (data.assignments || []).findIndex(a => a.id === id);
    if (assignmentIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Atribuição não encontrada' 
      });
    }
    
    const assignment = data.assignments[assignmentIndex];
    const task = data.tasks.find(t => t.id === assignment.taskId);
    const user = data.users.find(u => u.id === assignment.userId);
    
    // Remover atribuição
    data.assignments.splice(assignmentIndex, 1);
    await saveData(data);
    
    // Adicionar ao histórico
    await addToHistory({
      userId: removedBy || 'system',
      type: 'assignment_removed',
      description: `Atribuição da tarefa '${task?.title || 'Tarefa removida'}' removida do usuário '${user?.name || 'Usuário removido'}'`,
      points: 0,
      details: {
        taskId: assignment.taskId,
        taskTitle: task?.title || 'Tarefa removida',
        userId: assignment.userId,
        userName: user?.name || 'Usuário removido',
        originalAssignedAt: assignment.assignedAt
      },
      userName: removedBy ? (data.users.find(u => u.id === removedBy)?.name || 'Admin') : 'Sistema'
    });
    
    res.json({ 
      success: true, 
      message: 'Atribuição removida com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao remover atribuição:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao remover atribuição',
      message: error.message 
    });
  }
});

// GET /api/assignments/user/:userId - Atribuições de um usuário específico
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    console.log(`📋 Listando atribuições do usuário ${userId}...`, { status });
    
    const data = await readData();
    let assignments = (data.assignments || []).filter(a => a.userId === userId);
    
    // Filtrar por status se especificado
    if (status) {
      assignments = assignments.filter(a => a.status === status);
    }
    
    // Adicionar informações das tarefas
    const assignmentsWithInfo = assignments.map(assignment => {
      const task = data.tasks.find(t => t.id === assignment.taskId);
      
      return {
        ...assignment,
        taskTitle: task?.title || 'Tarefa não encontrada',
        taskDescription: task?.description || '',
        taskPoints: task?.points || 0,
        taskCategory: task?.category || 'outros',
        taskPriority: task?.priority || 'media'
      };
    });
    
    res.json({ 
      success: true, 
      data: assignmentsWithInfo,
      total: assignmentsWithInfo.length 
    });
  } catch (error) {
    console.error('❌ Erro ao listar atribuições do usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar atribuições do usuário',
      message: error.message 
    });
  }
});

module.exports = router;
