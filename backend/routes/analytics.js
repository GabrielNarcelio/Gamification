// Novo endpoint para analytics
router.get('/analytics', async (req, res) => {
  try {
    const data = await readData();
    
    const analytics = {
      userStats: {
        total: data.users.length,
        active: data.users.filter(u => {
          const lastActivity = data.history
            .filter(h => h.userId === u.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
          
          if (!lastActivity) return false;
          
          const daysSinceActivity = (Date.now() - new Date(lastActivity.timestamp)) / (1000 * 60 * 60 * 24);
          return daysSinceActivity <= 7; // Ativo nos últimos 7 dias
        }).length,
        admins: data.users.filter(u => u.type === 'admin').length
      },
      
      taskStats: {
        total: data.tasks.length,
        completed: data.history.filter(h => h.type === 'task_completed').length,
        averagePoints: data.tasks.reduce((sum, t) => sum + t.points, 0) / data.tasks.length
      },
      
      pointsDistribution: {
        totalDistributed: data.history
          .filter(h => h.points > 0)
          .reduce((sum, h) => sum + h.points, 0),
        totalSpent: Math.abs(data.history
          .filter(h => h.points < 0)
          .reduce((sum, h) => sum + h.points, 0))
      },
      
      topPerformers: data.users
        .filter(u => u.type !== 'admin')
        .sort((a, b) => b.points - a.points)
        .slice(0, 5)
        .map(u => ({ name: u.name, points: u.points })),
      
      activityTimeline: getActivityTimeline(data.history)
    };
    
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('❌ Erro ao gerar analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar analytics' 
    });
  }
});

const getActivityTimeline = (history) => {
  const last30Days = {};
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last30Days[dateStr] = 0;
  }
  
  history.forEach(h => {
    const date = new Date(h.timestamp).toISOString().split('T')[0];
    if (last30Days.hasOwnProperty(date)) {
      last30Days[date]++;
    }
  });
  
  return Object.entries(last30Days).map(([date, count]) => ({ date, count }));
};
