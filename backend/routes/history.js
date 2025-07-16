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

// GET /api/history - Listar histórico completo ou filtrado
router.get('/', async (req, res) => {
  try {
    const { userId, type, limit = 10, offset = 0 } = req.query; // ✅ Reduzido para 10
    console.log('📜 Listando histórico...', { userId, type, limit, offset });
    
    const data = await readData();
    let history = [...data.history];
    
    // Filtrar por usuário se especificado
    if (userId) {
      history = history.filter(h => h.userId === userId);
    }
    
    // Filtrar por tipo se especificado
    if (type) {
      history = history.filter(h => h.type === type);
    }
    
    // Ordenar por timestamp (mais recente primeiro)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Paginação
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = history.slice(startIndex, endIndex);
    
    // Adicionar informações dos usuários
    const historyWithUsers = paginatedHistory.map(entry => {
      const user = data.users.find(u => u.id === entry.userId);
      return {
        ...entry,
        userName: user ? user.name : (entry.userId === 'system' ? 'Sistema' : 'Usuário removido')
      };
    });
    
    res.json({ 
      success: true, 
      data: historyWithUsers,
      pagination: {
        total: history.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < history.length
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar histórico:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar histórico',
      message: error.message 
    });
  }
});

// GET /api/history/user/:userId - Histórico específico de um usuário
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = 20, offset = 0 } = req.query;
    console.log(`📜 Listando histórico do usuário: ${userId}`, { type, limit, offset });
    
    const data = await readData();
    let userHistory = data.history.filter(h => h.userId === userId);
    
    // Filtrar por tipo se especificado
    if (type) {
      userHistory = userHistory.filter(h => h.type === type);
    }
    
    // Ordenar por timestamp (mais recente primeiro)
    userHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Paginação
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = userHistory.slice(startIndex, endIndex);
    
    // Adicionar nome do usuário
    const user = data.users.find(u => u.id === userId);
    const historyWithUser = paginatedHistory.map(entry => ({
      ...entry,
      userName: user ? user.name : 'Usuário removido'
    }));
    
    res.json({ 
      success: true, 
      data: historyWithUser,
      pagination: {
        total: userHistory.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < userHistory.length
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar histórico do usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar histórico do usuário',
      message: error.message 
    });
  }
});

// GET /api/history/stats - Estatísticas do histórico
router.get('/stats', async (req, res) => {
  try {
    const { userId, period = '30d' } = req.query;
    console.log('📊 Gerando estatísticas do histórico...', { userId, period });
    
    const data = await readData();
    let history = [...data.history];
    
    // Filtrar por usuário se especificado
    if (userId) {
      history = history.filter(h => h.userId === userId);
    }
    
    // Filtrar por período
    const now = new Date();
    let periodStart;
    
    switch (period) {
      case '7d':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        periodStart = new Date(0); // Todos os tempos
    }
    
    history = history.filter(h => new Date(h.timestamp) >= periodStart);
    
    // Calcular estatísticas
    const stats = {
      total: history.length,
      byType: {},
      pointsActivity: {
        earned: 0,
        spent: 0,
        net: 0
      },
      dailyActivity: {},
      topActivities: []
    };
    
    // Contagem por tipo
    history.forEach(entry => {
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      
      // Atividade de pontos
      if (entry.points > 0) {
        stats.pointsActivity.earned += entry.points;
      } else if (entry.points < 0) {
        stats.pointsActivity.spent += Math.abs(entry.points);
      }
      
      // Atividade diária
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
    });
    
    stats.pointsActivity.net = stats.pointsActivity.earned - stats.pointsActivity.spent;
    
    // Top atividades
    stats.topActivities = Object.entries(stats.byType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    res.json({ 
      success: true, 
      data: stats,
      period,
      userId: userId || 'all'
    });
  } catch (error) {
    console.error('❌ Erro ao gerar estatísticas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar estatísticas',
      message: error.message 
    });
  }
});

// GET /api/history/types - Listar tipos de atividades disponíveis
router.get('/types', async (req, res) => {
  try {
    console.log('📋 Listando tipos de atividades...');
    const data = await readData();
    
    const types = [...new Set(data.history.map(h => h.type))];
    const typesWithCount = types.map(type => ({
      type,
      count: data.history.filter(h => h.type === type).length,
      description: getTypeDescription(type)
    }));
    
    res.json({ 
      success: true, 
      data: typesWithCount,
      total: types.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar tipos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar tipos',
      message: error.message 
    });
  }
});

// GET /api/history/recent - Atividades recentes
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    console.log(`📜 Listando ${limit} atividades recentes...`);
    
    const data = await readData();
    
    // Ordenar por timestamp (mais recente primeiro)
    const recentHistory = data.history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));
    
    // Adicionar informações dos usuários
    const historyWithUsers = recentHistory.map(entry => {
      const user = data.users.find(u => u.id === entry.userId);
      return {
        ...entry,
        userName: user ? user.name : (entry.userId === 'system' ? 'Sistema' : 'Usuário removido')
      };
    });
    
    res.json({ 
      success: true, 
      data: historyWithUsers,
      total: recentHistory.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar atividades recentes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar atividades recentes',
      message: error.message 
    });
  }
});

// Função auxiliar para descrição dos tipos
function getTypeDescription(type) {
  const descriptions = {
    'task_completed': 'Tarefa concluída',
    'task_created': 'Tarefa criada',
    'task_updated': 'Tarefa atualizada',
    'task_deleted': 'Tarefa deletada',
    'reward_redeemed': 'Prêmio resgatado',
    'user_created': 'Usuário criado',
    'user_updated': 'Usuário atualizado',
    'user_deleted': 'Usuário deletado',
    'user_login': 'Login realizado'
  };
  
  return descriptions[type] || 'Atividade desconhecida';
}

module.exports = router;
