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

// GET /api/rewards - Listar todos os prêmios
router.get('/', async (req, res) => {
  try {
    console.log('🎁 Listando prêmios...');
    const data = await readData();
    
    res.json({ 
      success: true, 
      data: data.rewards,
      total: data.rewards.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar prêmios:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar prêmios',
      message: error.message 
    });
  }
});

// GET /api/rewards/:id - Buscar prêmio específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando prêmio ID: ${id}`);
    
    const data = await readData();
    const reward = data.rewards.find(r => r.id === id);
    
    if (!reward) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prêmio não encontrado' 
      });
    }
    
    res.json({ 
      success: true, 
      data: reward 
    });
  } catch (error) {
    console.error('❌ Erro ao buscar prêmio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar prêmio',
      message: error.message 
    });
  }
});

// POST /api/rewards - Criar novo prêmio (apenas admin)
router.post('/', async (req, res) => {
  try {
    const { title, description, cost, category, stock } = req.body;
    console.log('➕ Criando prêmio:', { title, cost, category, stock });
    
    // Validações
    if (!title || !description || !cost) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: title, description, cost' 
      });
    }
    
    if (cost < 1 || cost > 10000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Custo deve estar entre 1 e 10000 pontos' 
      });
    }
    
    if (stock && (stock < 0 || stock > 1000)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Estoque deve estar entre 0 e 1000' 
      });
    }
    
    const data = await readData();
    
    // Criar novo prêmio
    const newReward = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      cost: parseInt(cost),
      category: category || 'Geral',
      stock: stock ? parseInt(stock) : 999,
      createdAt: new Date().toISOString()
    };
    
    data.rewards.push(newReward);
    await saveData(data);
    
    console.log('✅ Prêmio criado com sucesso:', newReward.title);
    res.status(201).json({ 
      success: true, 
      data: newReward,
      message: 'Prêmio criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar prêmio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar prêmio',
      message: error.message 
    });
  }
});

// PUT /api/rewards/:id - Atualizar prêmio
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`✏️ Atualizando prêmio ID: ${id}`, updates);
    
    const data = await readData();
    const rewardIndex = data.rewards.findIndex(r => r.id === id);
    
    if (rewardIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prêmio não encontrado' 
      });
    }
    
    // Validar custo se estiver sendo atualizado
    if (updates.cost && (updates.cost < 1 || updates.cost > 10000)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Custo deve estar entre 1 e 10000 pontos' 
      });
    }
    
    // Validar estoque se estiver sendo atualizado
    if (updates.stock && (updates.stock < 0 || updates.stock > 1000)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Estoque deve estar entre 0 e 1000' 
      });
    }
    
    // Atualizar prêmio
    data.rewards[rewardIndex] = { 
      ...data.rewards[rewardIndex], 
      ...updates,
      cost: updates.cost ? parseInt(updates.cost) : data.rewards[rewardIndex].cost,
      stock: updates.stock !== undefined ? parseInt(updates.stock) : data.rewards[rewardIndex].stock,
      updatedAt: new Date().toISOString()
    };
    
    await saveData(data);
    
    console.log('✅ Prêmio atualizado com sucesso:', data.rewards[rewardIndex].title);
    res.json({ 
      success: true, 
      data: data.rewards[rewardIndex],
      message: 'Prêmio atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar prêmio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar prêmio',
      message: error.message 
    });
  }
});

// DELETE /api/rewards/:id - Deletar prêmio
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deletando prêmio ID: ${id}`);
    
    const data = await readData();
    const rewardIndex = data.rewards.findIndex(r => r.id === id);
    
    if (rewardIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prêmio não encontrado' 
      });
    }
    
    const deletedReward = data.rewards.splice(rewardIndex, 1)[0];
    await saveData(data);
    
    console.log('✅ Prêmio deletado com sucesso:', deletedReward.title);
    res.json({ 
      success: true, 
      data: deletedReward,
      message: 'Prêmio deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar prêmio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao deletar prêmio',
      message: error.message 
    });
  }
});

// POST /api/rewards/:id/redeem - Resgatar prêmio
router.post('/:id/redeem', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    console.log(`🎁 Resgatando prêmio ID: ${id} para usuário: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'UserId é obrigatório' 
      });
    }
    
    const data = await readData();
    const reward = data.rewards.find(r => r.id === id);
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (!reward) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prêmio não encontrado' 
      });
    }
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }
    
    // Verificar se usuário tem pontos suficientes
    if (data.users[userIndex].points < reward.cost) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pontos insuficientes',
        required: reward.cost,
        available: data.users[userIndex].points
      });
    }
    
    // Verificar estoque
    if (reward.stock <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prêmio fora de estoque' 
      });
    }
    
    // Deduzir pontos do usuário
    data.users[userIndex].points -= reward.cost;
    
    // Reduzir estoque
    const rewardIndex = data.rewards.findIndex(r => r.id === id);
    data.rewards[rewardIndex].stock -= 1;
    
    // Adicionar ao histórico
    const historyEntry = {
      id: generateId(),
      userId: userId,
      type: 'reward_redeemed',
      description: `Prêmio '${reward.title}' resgatado`,
      points: -reward.cost,
      timestamp: new Date().toISOString(),
      details: {
        rewardId: reward.id,
        rewardTitle: reward.title,
        pointsSpent: reward.cost,
        remainingStock: data.rewards[rewardIndex].stock
      }
    };
    
    data.history.push(historyEntry);
    await saveData(data);
    
    console.log(`✅ Prêmio resgatado: ${reward.title} (-${reward.cost} pontos)`);
    res.json({ 
      success: true, 
      data: {
        reward,
        pointsSpent: reward.cost,
        newUserPoints: data.users[userIndex].points,
        remainingStock: data.rewards[rewardIndex].stock
      },
      message: `Prêmio resgatado! -${reward.cost} pontos`
    });
  } catch (error) {
    console.error('❌ Erro ao resgatar prêmio:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao resgatar prêmio',
      message: error.message 
    });
  }
});

// GET /api/rewards/user/:userId - Listar prêmios resgatados por usuário
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📋 Listando prêmios resgatados pelo usuário: ${userId}`);
    
    const data = await readData();
    const redeemedRewards = data.history.filter(h => 
      h.type === 'reward_redeemed' && h.userId === userId
    );
    
    res.json({ 
      success: true, 
      data: redeemedRewards,
      total: redeemedRewards.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar prêmios do usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar prêmios do usuário',
      message: error.message 
    });
  }
});

// GET /api/rewards/categories - Listar categorias de prêmios
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 Listando categorias de prêmios...');
    const data = await readData();
    
    const categories = [...new Set(data.rewards.map(r => r.category))];
    
    res.json({ 
      success: true, 
      data: categories,
      total: categories.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar categorias:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar categorias',
      message: error.message 
    });
  }
});

module.exports = router;
