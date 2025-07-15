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
    return { users: [], tasks: [], rewards: [], history: [] };
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

// GET /api/tasks - Listar todas as tarefas
router.get('/', async (req, res) => {
  try {
    console.log('📋 Listando tarefas...');
    const data = await readData();
    
    // Adicionar informações do criador
    const tasksWithCreator = data.tasks.map(task => {
      const creator = data.users.find(u => u.id === task.createdBy);
      return {
        ...task,
        creatorName: creator ? creator.name : 'Usuário removido'
      };
    });
    
    res.json({ 
      success: true, 
      data: tasksWithCreator,
      total: tasksWithCreator.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar tarefas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar tarefas',
      message: error.message 
    });
  }
});

// GET /api/tasks/:id - Buscar tarefa específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando tarefa ID: ${id}`);
    
    const data = await readData();
    const task = data.tasks.find(t => t.id === id);
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tarefa não encontrada' 
      });
    }
    
    // Adicionar informações do criador
    const creator = data.users.find(u => u.id === task.createdBy);
    const taskWithCreator = {
      ...task,
      creatorName: creator ? creator.name : 'Usuário removido'
    };
    
    res.json({ 
      success: true, 
      data: taskWithCreator 
    });
  } catch (error) {
    console.error('❌ Erro ao buscar tarefa:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar tarefa',
      message: error.message 
    });
  }
});

// POST /api/tasks - Criar nova tarefa (apenas admin)
router.post('/', async (req, res) => {
  try {
    console.log('📦 Body recebido:', req.body);
    
    const { title, description, points, createdBy } = req.body;
    const category = req.body.category || 'Geral';
    const difficulty = req.body.difficulty || 'medium';
    
    console.log('➕ Criando tarefa:', { title, points, category, difficulty, createdBy });
    
    // Validações
    if (!title || !description || !points || !createdBy) {
      console.log('❌ Campos obrigatórios faltando:', { title: !!title, description: !!description, points: !!points, createdBy: !!createdBy });
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: title, description, points, createdBy' 
      });
    }
    
    // ✅ Verificar se é admin
    console.log('🔍 Verificando se é admin:', { createdBy, isAdmin: createdBy === 'admin' });
    if (createdBy !== 'admin') {
      console.log('❌ Usuário não é admin:', createdBy);
      return res.status(403).json({ 
        success: false, 
        error: 'Apenas administradores podem criar tarefas' 
      });
    }
    
    console.log('✅ Usuário é admin, prosseguindo...');
    
    if (points < 1 || points > 1000) {
      console.log('❌ Pontos inválidos:', points);
      return res.status(400).json({ 
        success: false, 
        error: 'Pontos devem estar entre 1 e 1000' 
      });
    }
    
    console.log('✅ Pontos válidos:', points);
    
    const data = await readData();
    console.log('✅ Dados carregados, criando nova tarefa...');
    
    // Criar nova tarefa
    const newTask = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      points: parseInt(points),
      category: category,
      difficulty: difficulty,
      createdAt: new Date().toISOString(),
      createdBy: createdBy
    };
    
    console.log('🆕 Nova tarefa criada:', newTask);
    
    data.tasks.push(newTask);
    await saveData(data);
    
    console.log('💾 Tarefa salva no banco, adicionando ao histórico...');
    
    // Adicionar ao histórico
    const historyEntry = {
      id: generateId(),
      userId: createdBy,
      type: 'task_created',
      description: `Tarefa '${newTask.title}' criada`,
      points: 0,
      timestamp: new Date().toISOString(),
      details: {
        taskId: newTask.id,
        taskTitle: newTask.title,
        taskPoints: newTask.points
      }
    };
    
    data.history.push(historyEntry);
    await saveData(data);
    
    console.log('📜 Histórico atualizado, buscando nome do criador...');
    
    // Adicionar nome do criador na resposta  
    let creator = null;
    let creatorName = 'Admin';
    
    if (createdBy && createdBy !== 'admin') {
      console.log('🔍 Procurando usuário criador:', createdBy);
      creator = data.users.find(u => u.id === createdBy);
      if (creator) {
        creatorName = creator.name;
        console.log('✅ Criador encontrado:', creatorName);
      } else {
        console.log('❌ Criador não encontrado no banco de dados:', createdBy);
        return res.status(404).json({ 
          success: false, 
          error: 'Usuário criador não encontrado' 
        });
      }
    } else {
      console.log('✅ Criador é admin, usando nome padrão');
    }
    
    const taskWithCreator = {
      ...newTask,
      creatorName: creatorName
    };
    
    console.log('✅ Tarefa criada com sucesso:', newTask.title);
    res.status(201).json({ 
      success: true, 
      data: taskWithCreator,
      message: 'Tarefa criada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar tarefa:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar tarefa',
      message: error.message 
    });
  }
});

// PUT /api/tasks/:id - Atualizar tarefa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`✏️ Atualizando tarefa ID: ${id}`, updates);
    
    const data = await readData();
    const taskIndex = data.tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tarefa não encontrada' 
      });
    }
    
    // Validar pontos se estiver sendo atualizado
    if (updates.points && (updates.points < 1 || updates.points > 1000)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pontos devem estar entre 1 e 1000' 
      });
    }
    
    // Atualizar tarefa
    const oldTask = { ...data.tasks[taskIndex] };
    data.tasks[taskIndex] = { 
      ...data.tasks[taskIndex], 
      ...updates,
      points: updates.points ? parseInt(updates.points) : data.tasks[taskIndex].points,
      updatedAt: new Date().toISOString()
    };
    
    await saveData(data);
    
    // Adicionar ao histórico
    const historyEntry = {
      id: generateId(),
      userId: oldTask.createdBy,
      type: 'task_updated',
      description: `Tarefa '${data.tasks[taskIndex].title}' atualizada`,
      points: 0,
      timestamp: new Date().toISOString(),
      details: {
        taskId: id,
        changes: Object.keys(updates)
      }
    };
    
    data.history.push(historyEntry);
    await saveData(data);
    
    // Adicionar nome do criador na resposta
    const creator = data.users.find(u => u.id === data.tasks[taskIndex].createdBy);
    const taskWithCreator = {
      ...data.tasks[taskIndex],
      creatorName: creator ? creator.name : 'Usuário removido'
    };
    
    console.log('✅ Tarefa atualizada com sucesso:', data.tasks[taskIndex].title);
    res.json({ 
      success: true, 
      data: taskWithCreator,
      message: 'Tarefa atualizada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar tarefa',
      message: error.message 
    });
  }
});

// DELETE /api/tasks/:id - Deletar tarefa
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deletando tarefa ID: ${id}`);
    
    const data = await readData();
    const taskIndex = data.tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tarefa não encontrada' 
      });
    }
    
    const deletedTask = data.tasks.splice(taskIndex, 1)[0];
    await saveData(data);
    
    // Adicionar ao histórico
    const historyEntry = {
      id: generateId(),
      userId: deletedTask.createdBy,
      type: 'task_deleted',
      description: `Tarefa '${deletedTask.title}' deletada`,
      points: 0,
      timestamp: new Date().toISOString(),
      details: {
        deletedTaskTitle: deletedTask.title,
        deletedTaskPoints: deletedTask.points
      }
    };
    
    data.history.push(historyEntry);
    await saveData(data);
    
    console.log('✅ Tarefa deletada com sucesso:', deletedTask.title);
    res.json({ 
      success: true, 
      data: deletedTask,
      message: 'Tarefa deletada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar tarefa:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao deletar tarefa',
      message: error.message 
    });
  }
});

// POST /api/tasks/:id/complete - Completar tarefa
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    console.log(`✅ Completando tarefa ID: ${id} para usuário: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'UserId é obrigatório' 
      });
    }
    
    const data = await readData();
    const task = data.tasks.find(t => t.id === id);
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tarefa não encontrada' 
      });
    }
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }
    
    // Verificar se tarefa já foi completada por este usuário
    const alreadyCompleted = data.history.find(h => 
      h.type === 'task_completed' && 
      h.userId === userId && 
      h.details.taskId === id
    );
    
    if (alreadyCompleted) {
      return res.status(409).json({ 
        success: false, 
        error: 'Tarefa já foi completada por este usuário' 
      });
    }
    
    // Adicionar pontos ao usuário
    data.users[userIndex].points += task.points;
    
    // Adicionar ao histórico
    const historyEntry = {
      id: generateId(),
      userId: userId,
      type: 'task_completed',
      description: `Tarefa '${task.title}' concluída`,
      points: task.points,
      timestamp: new Date().toISOString(),
      details: {
        taskId: task.id,
        taskTitle: task.title,
        pointsEarned: task.points
      }
    };
    
    data.history.push(historyEntry);
    await saveData(data);
    
    // ✨ VERIFICAR CONQUISTAS AUTOMATICAMENTE
    try {
      console.log(`🏆 Verificando conquistas para usuário: ${userId}`);
      
      // Importar e verificar conquistas
      const fs = require('fs').promises;
      const path = require('path');
      
      // Lógica simplificada de verificação de conquistas
      if (!data.achievements) {
        console.log('📋 Nenhuma conquista configurada ainda');
      } else if (!data.userAchievements) {
        data.userAchievements = [];
      } else {
        // Verificar conquista básica de primeira tarefa
        const userAchievements = data.userAchievements.filter(ua => ua.userId === userId);
        const completedTasksCount = data.history.filter(h => 
          h.type === 'task_completed' && h.userId === userId
        ).length;
        
        // Verificar se deve desbloquear "primeira tarefa"
        const firstTaskAchievement = data.achievements.find(a => a.id === 'task_beginner');
        const hasFirstTask = userAchievements.find(ua => ua.achievementId === 'task_beginner');
        
        if (firstTaskAchievement && !hasFirstTask && completedTasksCount === 1) {
          const newAchievement = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId,
            achievementId: 'task_beginner',
            unlockedAt: new Date().toISOString(),
            progress: 1
          };
          
          data.userAchievements.push(newAchievement);
          data.users[userIndex].points += firstTaskAchievement.points;
          
          console.log(`🎉 Conquista desbloqueada: ${firstTaskAchievement.name} (+${firstTaskAchievement.points} pontos)`);
          
          // Adicionar ao histórico
          const achievementHistory = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId,
            type: 'achievement_unlocked',
            description: `Conquista desbloqueada: ${firstTaskAchievement.name}`,
            points: firstTaskAchievement.points,
            timestamp: new Date().toISOString(),
            details: {
              achievementId: firstTaskAchievement.id,
              achievementName: firstTaskAchievement.name
            }
          };
          
          data.history.push(achievementHistory);
          await saveData(data);
        }
      }
    } catch (achievementError) {
      console.error('⚠️ Erro ao verificar conquistas automaticamente:', achievementError);
      // Não falhar a requisição por causa de erro nas conquistas
    }
    
    console.log(`✅ Tarefa completada: ${task.title} (+${task.points} pontos)`);
    res.json({ 
      success: true, 
      data: {
        task,
        pointsEarned: task.points,
        newUserPoints: data.users[userIndex].points
      },
      message: `Tarefa completada! +${task.points} pontos`
    });
  } catch (error) {
    console.error('❌ Erro ao completar tarefa:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao completar tarefa',
      message: error.message 
    });
  }
});

// GET /api/tasks/user/:userId - Listar tarefas completadas por usuário
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📋 Listando tarefas completadas pelo usuário: ${userId}`);
    
    const data = await readData();
    const completedTasks = data.history.filter(h => 
      h.type === 'task_completed' && h.userId === userId
    );
    
    res.json({ 
      success: true, 
      data: completedTasks,
      total: completedTasks.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar tarefas do usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar tarefas do usuário',
      message: error.message 
    });
  }
});

module.exports = router;
