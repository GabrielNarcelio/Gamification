const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

// Utilitários para manipulação de dados
const readData = async () => {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Erro ao ler dados:', error);
    return { users: [], tasks: [], rewards: [], history: [], achievements: [], userAchievements: [] };
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

// Conquistas pré-definidas do sistema
const DEFAULT_ACHIEVEMENTS = [
  {
    id: 'first_login',
    name: 'Primeiro Acesso',
    description: 'Faça seu primeiro login no sistema',
    icon: '👋',
    points: 10,
    type: 'login',
    condition: { type: 'login_count', value: 1 },
    rarity: 'common'
  },
  {
    id: 'task_beginner',
    name: 'Iniciante',
    description: 'Complete sua primeira tarefa',
    icon: '🎯',
    points: 20,
    type: 'task',
    condition: { type: 'tasks_completed', value: 1 },
    rarity: 'common'
  },
  {
    id: 'task_warrior',
    name: 'Guerreiro das Tarefas',
    description: 'Complete 10 tarefas',
    icon: '⚔️',
    points: 100,
    type: 'task',
    condition: { type: 'tasks_completed', value: 10 },
    rarity: 'rare'
  },
  {
    id: 'task_master',
    name: 'Mestre das Tarefas',
    description: 'Complete 50 tarefas',
    icon: '👑',
    points: 500,
    type: 'task',
    condition: { type: 'tasks_completed', value: 50 },
    rarity: 'epic'
  },
  {
    id: 'points_collector',
    name: 'Colecionador',
    description: 'Acumule 100 pontos',
    icon: '💎',
    points: 50,
    type: 'points',
    condition: { type: 'total_points', value: 100 },
    rarity: 'uncommon'
  },
  {
    id: 'points_millionaire',
    name: 'Milionário',
    description: 'Acumule 1000 pontos',
    icon: '💰',
    points: 200,
    type: 'points',
    condition: { type: 'total_points', value: 1000 },
    rarity: 'legendary'
  },
  {
    id: 'daily_streak_7',
    name: 'Semana Dedicada',
    description: 'Complete tarefas por 7 dias consecutivos',
    icon: '🔥',
    points: 150,
    type: 'streak',
    condition: { type: 'daily_streak', value: 7 },
    rarity: 'rare'
  },
  {
    id: 'social_helper',
    name: 'Ajudante Social',
    description: 'Complete 5 tarefas do tipo "Social"',
    icon: '🤝',
    points: 75,
    type: 'category',
    condition: { type: 'category_tasks', category: 'social', value: 5 },
    rarity: 'uncommon'
  }
];

// GET /api/achievements - Listar todas as conquistas disponíveis
router.get('/', async (req, res) => {
  try {
    console.log('🏆 Listando conquistas...');
    const data = await readData();
    
    // Garantir que conquistas existam no banco
    if (!data.achievements) {
      data.achievements = DEFAULT_ACHIEVEMENTS;
      await saveData(data);
    }
    
    res.json({ 
      success: true, 
      data: data.achievements,
      total: data.achievements.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar conquistas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar conquistas',
      message: error.message 
    });
  }
});

// GET /api/achievements/user/:userId - Listar conquistas de um usuário específico
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🏆 Buscando conquistas do usuário: ${userId}`);
    
    const data = await readData();
    
    if (!data.userAchievements) {
      data.userAchievements = [];
    }
    
    if (!data.achievements) {
      data.achievements = DEFAULT_ACHIEVEMENTS;
      await saveData(data);
    }
    
    // Buscar conquistas do usuário
    const userAchievements = data.userAchievements.filter(ua => ua.userId === userId);
    
    // Criar lista completa com status
    const achievementsWithStatus = data.achievements.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
      return {
        ...achievement,
        unlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt || null,
        progress: userAchievement?.progress || 0
      };
    });
    
    // Separar por status
    const unlocked = achievementsWithStatus.filter(a => a.unlocked);
    const locked = achievementsWithStatus.filter(a => !a.unlocked);
    
    res.json({ 
      success: true, 
      data: {
        all: achievementsWithStatus,
        unlocked,
        locked,
        stats: {
          total: achievementsWithStatus.length,
          unlocked: unlocked.length,
          locked: locked.length,
          totalPoints: unlocked.reduce((sum, a) => sum + a.points, 0)
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar conquistas do usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar conquistas do usuário',
      message: error.message 
    });
  }
});

// POST /api/achievements/check/:userId - Verificar e desbloquear conquistas para um usuário
router.post('/check/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Verificando conquistas para usuário: ${userId}`);
    
    const data = await readData();
    
    if (!data.achievements) {
      data.achievements = DEFAULT_ACHIEVEMENTS;
    }
    
    if (!data.userAchievements) {
      data.userAchievements = [];
    }
    
    const user = data.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }
    
    const userAchievements = data.userAchievements.filter(ua => ua.userId === userId);
    const userHistory = data.history.filter(h => h.userId === userId);
    const newlyUnlocked = [];
    
    // Verificar cada conquista
    for (const achievement of data.achievements) {
      // Verificar se já foi desbloqueada
      const alreadyUnlocked = userAchievements.find(ua => ua.achievementId === achievement.id);
      if (alreadyUnlocked) continue;
      
      let shouldUnlock = false;
      let progress = 0;
      
      // Verificar condições baseadas no tipo
      switch (achievement.condition.type) {
        case 'login_count':
          const loginCount = userHistory.filter(h => h.type === 'user_login').length;
          progress = loginCount;
          shouldUnlock = loginCount >= achievement.condition.value;
          break;
          
        case 'tasks_completed':
          const completedTasks = userHistory.filter(h => h.type === 'task_completed').length;
          progress = completedTasks;
          shouldUnlock = completedTasks >= achievement.condition.value;
          break;
          
        case 'total_points':
          progress = user.points;
          shouldUnlock = user.points >= achievement.condition.value;
          break;
          
        case 'category_tasks':
          const categoryTasks = userHistory.filter(h => 
            h.type === 'task_completed' && 
            h.details?.category === achievement.condition.category
          ).length;
          progress = categoryTasks;
          shouldUnlock = categoryTasks >= achievement.condition.value;
          break;
          
        case 'daily_streak':
          // Calcular streak atual (implementação simplificada)
          const recentDays = 7; // Verificar últimos 7 dias
          const now = new Date();
          const dailyCompletions = [];
          
          for (let i = 0; i < recentDays; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));
            
            const tasksOnDay = userHistory.filter(h => 
              h.type === 'task_completed' &&
              new Date(h.timestamp) >= dayStart &&
              new Date(h.timestamp) <= dayEnd
            ).length;
            
            dailyCompletions.push(tasksOnDay > 0);
          }
          
          // Calcular streak consecutivo a partir de hoje
          let currentStreak = 0;
          for (const hasTask of dailyCompletions) {
            if (hasTask) {
              currentStreak++;
            } else {
              break;
            }
          }
          
          progress = currentStreak;
          shouldUnlock = currentStreak >= achievement.condition.value;
          break;
      }
      
      if (shouldUnlock) {
        // Desbloquear conquista
        const userAchievement = {
          id: generateId(),
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date().toISOString(),
          progress: achievement.condition.value
        };
        
        data.userAchievements.push(userAchievement);
        newlyUnlocked.push(achievement);
        
        // Adicionar pontos ao usuário
        const userIndex = data.users.findIndex(u => u.id === userId);
        data.users[userIndex].points += achievement.points;
        
        // Adicionar ao histórico
        const historyEntry = {
          id: generateId(),
          userId,
          type: 'achievement_unlocked',
          description: `Conquista desbloqueada: ${achievement.name}`,
          points: achievement.points,
          timestamp: new Date().toISOString(),
          details: {
            achievementId: achievement.id,
            achievementName: achievement.name,
            achievementRarity: achievement.rarity
          }
        };
        
        data.history.push(historyEntry);
        
        console.log(`🏆 Conquista desbloqueada: ${achievement.name} para ${user.name}`);
      }
    }
    
    await saveData(data);
    
    res.json({ 
      success: true, 
      data: {
        newlyUnlocked,
        totalChecked: data.achievements.length,
        newUnlocks: newlyUnlocked.length
      },
      message: newlyUnlocked.length > 0 ? 
        `${newlyUnlocked.length} nova(s) conquista(s) desbloqueada(s)!` : 
        'Nenhuma nova conquista desbloqueada'
    });
  } catch (error) {
    console.error('❌ Erro ao verificar conquistas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao verificar conquistas',
      message: error.message 
    });
  }
});

// POST /api/achievements - Criar nova conquista (admin)
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, points, type, condition, rarity } = req.body;
    console.log('➕ Criando nova conquista:', name);
    
    if (!name || !description || !condition) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: name, description, condition' 
      });
    }
    
    const data = await readData();
    
    if (!data.achievements) {
      data.achievements = DEFAULT_ACHIEVEMENTS;
    }
    
    const newAchievement = {
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      icon: icon || '🏆',
      points: parseInt(points) || 0,
      type: type || 'custom',
      condition,
      rarity: rarity || 'common',
      createdAt: new Date().toISOString()
    };
    
    data.achievements.push(newAchievement);
    await saveData(data);
    
    console.log('✅ Conquista criada com sucesso:', newAchievement.name);
    res.status(201).json({ 
      success: true, 
      data: newAchievement,
      message: 'Conquista criada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar conquista:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar conquista',
      message: error.message 
    });
  }
});

// DELETE /api/achievements/:id - Deletar conquista (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deletando conquista ID: ${id}`);
    
    const data = await readData();
    
    if (!data.achievements) {
      data.achievements = [];
    }
    
    const achievementIndex = data.achievements.findIndex(a => a.id === id);
    
    if (achievementIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conquista não encontrada' 
      });
    }
    
    const deletedAchievement = data.achievements.splice(achievementIndex, 1)[0];
    
    // Remover também as conquistas dos usuários relacionadas
    if (data.userAchievements) {
      data.userAchievements = data.userAchievements.filter(ua => ua.achievementId !== id);
    }
    
    await saveData(data);
    
    console.log('✅ Conquista deletada com sucesso:', deletedAchievement.name);
    res.json({ 
      success: true, 
      data: deletedAchievement,
      message: 'Conquista deletada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar conquista:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao deletar conquista',
      message: error.message 
    });
  }
});

module.exports = router;
