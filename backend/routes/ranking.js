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

// GET /api/ranking - Ranking geral de usuários
router.get('/', async (req, res) => {
  try {
    const { limit = 10, includeAdmin = 'false' } = req.query;
    console.log('🏆 Gerando ranking geral...', { limit, includeAdmin });
    
    const data = await readData();
    let users = [...data.users];
    
    // Filtrar admin se solicitado
    if (includeAdmin === 'false') {
      users = users.filter(u => u.type !== 'admin');
    }
    
    // Ordenar por pontos (maior para menor)
    users.sort((a, b) => b.points - a.points);
    
    // Limitar resultados
    const topUsers = users.slice(0, parseInt(limit));
    
    // Adicionar posição e informações extras
    const ranking = topUsers.map((user, index) => {
      // Remover senha
      const { password, ...userWithoutPassword } = user;
      
      // Calcular estatísticas do usuário
      const userHistory = data.history.filter(h => h.userId === user.id);
      const tasksCompleted = userHistory.filter(h => h.type === 'task_completed').length;
      const rewardsRedeemed = userHistory.filter(h => h.type === 'reward_redeemed').length;
      const totalPointsEarned = userHistory
        .filter(h => h.points > 0)
        .reduce((sum, h) => sum + h.points, 0);
      const totalPointsSpent = userHistory
        .filter(h => h.points < 0)
        .reduce((sum, h) => sum + Math.abs(h.points), 0);
      
      return {
        position: index + 1,
        ...userWithoutPassword,
        badge: getBadge(index + 1),
        stats: {
          tasksCompleted,
          rewardsRedeemed,
          totalPointsEarned,
          totalPointsSpent,
          efficiency: tasksCompleted > 0 ? Math.round(totalPointsEarned / tasksCompleted) : 0
        }
      };
    });
    
    res.json({ 
      success: true, 
      data: ranking,
      total: users.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao gerar ranking:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar ranking',
      message: error.message 
    });
  }
});

// GET /api/ranking/user/:userId - Posição específica de um usuário
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { includeAdmin = 'false' } = req.query;
    console.log(`🔍 Buscando posição do usuário: ${userId}`);
    
    const data = await readData();
    let users = [...data.users];
    
    // Filtrar admin se solicitado
    if (includeAdmin === 'false') {
      users = users.filter(u => u.type !== 'admin');
    }
    
    // Ordenar por pontos
    users.sort((a, b) => b.points - a.points);
    
    // Encontrar posição do usuário
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado no ranking' 
      });
    }
    
    const user = users[userIndex];
    const { password, ...userWithoutPassword } = user;
    
    // Calcular estatísticas
    const userHistory = data.history.filter(h => h.userId === userId);
    const tasksCompleted = userHistory.filter(h => h.type === 'task_completed').length;
    const rewardsRedeemed = userHistory.filter(h => h.type === 'reward_redeemed').length;
    const totalPointsEarned = userHistory
      .filter(h => h.points > 0)
      .reduce((sum, h) => sum + h.points, 0);
    const totalPointsSpent = userHistory
      .filter(h => h.points < 0)
      .reduce((sum, h) => sum + Math.abs(h.points), 0);
    
    const userRanking = {
      position: userIndex + 1,
      ...userWithoutPassword,
      badge: getBadge(userIndex + 1),
      stats: {
        tasksCompleted,
        rewardsRedeemed,
        totalPointsEarned,
        totalPointsSpent,
        efficiency: tasksCompleted > 0 ? Math.round(totalPointsEarned / tasksCompleted) : 0
      },
      surrounding: getSurroundingUsers(users, userIndex)
    };
    
    res.json({ 
      success: true, 
      data: userRanking,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('❌ Erro ao buscar posição do usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar posição do usuário',
      message: error.message 
    });
  }
});

// GET /api/ranking/stats - Estatísticas gerais do ranking
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Gerando estatísticas do ranking...');
    const data = await readData();
    
    const users = data.users.filter(u => u.type !== 'admin');
    const totalPoints = users.reduce((sum, u) => sum + u.points, 0);
    const averagePoints = users.length > 0 ? Math.round(totalPoints / users.length) : 0;
    
    // Distribuição de pontos
    const pointsDistribution = {
      '0-50': users.filter(u => u.points >= 0 && u.points <= 50).length,
      '51-100': users.filter(u => u.points >= 51 && u.points <= 100).length,
      '101-200': users.filter(u => u.points >= 101 && u.points <= 200).length,
      '201-500': users.filter(u => u.points >= 201 && u.points <= 500).length,
      '500+': users.filter(u => u.points > 500).length
    };
    
    // Atividade recente (últimos 7 dias)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = data.history.filter(h => 
      new Date(h.timestamp) >= weekAgo && h.type === 'task_completed'
    );
    
    const activeUsers = new Set(recentActivity.map(h => h.userId)).size;
    
    // Top performers (por eficiência)
    const userStats = users.map(user => {
      const userHistory = data.history.filter(h => h.userId === user.id);
      const tasksCompleted = userHistory.filter(h => h.type === 'task_completed').length;
      const totalPointsEarned = userHistory
        .filter(h => h.points > 0)
        .reduce((sum, h) => sum + h.points, 0);
      
      return {
        userId: user.id,
        name: user.name,
        points: user.points,
        tasksCompleted,
        efficiency: tasksCompleted > 0 ? Math.round(totalPointsEarned / tasksCompleted) : 0
      };
    });
    
    const topPerformers = userStats
      .filter(u => u.tasksCompleted >= 3) // Mínimo 3 tarefas
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);
    
    const stats = {
      totalUsers: users.length,
      totalPoints,
      averagePoints,
      highestScore: users.length > 0 ? Math.max(...users.map(u => u.points)) : 0,
      lowestScore: users.length > 0 ? Math.min(...users.map(u => u.points)) : 0,
      pointsDistribution,
      activeUsersWeek: activeUsers,
      topPerformers,
      generatedAt: new Date().toISOString()
    };
    
    res.json({ 
      success: true, 
      data: stats
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

// GET /api/ranking/period/:period - Ranking por período
router.get('/period/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { limit = 10 } = req.query;
    console.log(`🏆 Gerando ranking para período: ${period}`);
    
    // Definir período
    const now = new Date();
    let periodStart;
    
    switch (period) {
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        periodStart = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Período inválido. Use: week, month, year' 
        });
    }
    
    const data = await readData();
    
    // Filtrar atividades do período
    const periodHistory = data.history.filter(h => 
      new Date(h.timestamp) >= periodStart && h.points > 0
    );
    
    // Calcular pontos por usuário no período
    const userPoints = {};
    periodHistory.forEach(h => {
      userPoints[h.userId] = (userPoints[h.userId] || 0) + h.points;
    });
    
    // Criar ranking do período
    const periodRanking = Object.entries(userPoints)
      .map(([userId, points]) => {
        const user = data.users.find(u => u.id === userId);
        if (!user || user.type === 'admin') return null;
        
        const { password, ...userWithoutPassword } = user;
        const tasksInPeriod = periodHistory.filter(h => 
          h.userId === userId && h.type === 'task_completed'
        ).length;
        
        return {
          ...userWithoutPassword,
          pointsInPeriod: points,
          tasksInPeriod
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.pointsInPeriod - a.pointsInPeriod)
      .slice(0, parseInt(limit))
      .map((user, index) => ({
        position: index + 1,
        ...user,
        badge: getBadge(index + 1)
      }));
    
    res.json({ 
      success: true, 
      data: periodRanking,
      period,
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
      total: periodRanking.length
    });
  } catch (error) {
    console.error('❌ Erro ao gerar ranking por período:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar ranking por período',
      message: error.message 
    });
  }
});

// Função auxiliar para badges
function getBadge(position) {
  switch (position) {
    case 1:
      return { emoji: '🥇', name: 'Ouro', color: '#FFD700' };
    case 2:
      return { emoji: '🥈', name: 'Prata', color: '#C0C0C0' };
    case 3:
      return { emoji: '🥉', name: 'Bronze', color: '#CD7F32' };
    default:
      return { emoji: '🏅', name: 'Participante', color: '#6B73FF' };
  }
}

// Função auxiliar para usuários próximos
function getSurroundingUsers(users, currentIndex) {
  const start = Math.max(0, currentIndex - 2);
  const end = Math.min(users.length, currentIndex + 3);
  
  return users.slice(start, end).map((user, index) => {
    const { password, ...userWithoutPassword } = user;
    return {
      position: start + index + 1,
      ...userWithoutPassword,
      badge: getBadge(start + index + 1),
      isCurrent: start + index === currentIndex
    };
  });
}

module.exports = router;
