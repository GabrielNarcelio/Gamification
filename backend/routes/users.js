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

// GET /api/users - Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    console.log('📋 Listando usuários...');
    const data = await readData();
    
    // Remover senhas antes de enviar
    const usersWithoutPassword = data.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json({ 
      success: true, 
      data: usersWithoutPassword,
      total: usersWithoutPassword.length
    });
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar usuários',
      message: error.message 
    });
  }
});

// GET /api/users/:id - Buscar usuário específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando usuário ID: ${id}`);
    
    const data = await readData();
    const user = data.users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }
    
    // Remover senha antes de enviar
    const { password, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      data: userWithoutPassword 
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar usuário',
      message: error.message 
    });
  }
});

// POST /api/users - Criar novo usuário (via painel admin)
router.post('/', async (req, res) => {
  try {
    const { username, password, name, email, type = 'user' } = req.body;
    console.log('➕ Criando usuário:', { username, name, email, type });
    
    // Validações
    if (!username || !password || !name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: username, password, name, email' 
      });
    }
    
    const data = await readData();
    
    // Verificar se username já existe
    const existingUser = data.users.find(u => u.username === username);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Nome de usuário já existe' 
      });
    }
    
    // Verificar se email já existe
    const existingEmail = data.users.find(u => u.email === email);
    if (existingEmail) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email já está em uso' 
      });
    }
    
    // Criar novo usuário
    const newUser = {
      id: generateId(),
      username: username.toLowerCase().trim(),
      password, // Em produção, deveria ser hasheada
      name: name.trim(),
      email: email.toLowerCase().trim(),
      type: type.toLowerCase(),
      points: 0,
      createdAt: new Date().toISOString()
    };
    
    data.users.push(newUser);
    await saveData(data);
    
    // Adicionar ao histórico
    const historyEntry = {
      id: generateId(),
      userId: newUser.id,
      type: 'user_created',
      description: `Usuário '${newUser.name}' criado`,
      points: 0,
      timestamp: new Date().toISOString(),
      details: {
        username: newUser.username,
        type: newUser.type
      }
    };
    
    data.history.push(historyEntry);
    await saveData(data);
    
    // Remover senha antes de enviar resposta
    const { password: _, ...userResponse } = newUser;
    
    console.log('✅ Usuário criado com sucesso:', userResponse.username);
    res.status(201).json({ 
      success: true, 
      data: userResponse,
      message: 'Usuário criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar usuário',
      message: error.message 
    });
  }
});

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`✏️ Atualizando usuário ID: ${id}`, updates);
    
    const data = await readData();
    const userIndex = data.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }
    
    // Verificar se novo username já existe (se estiver sendo alterado)
    if (updates.username && updates.username !== data.users[userIndex].username) {
      const existingUser = data.users.find(u => 
        u.username === updates.username && u.id !== id
      );
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          error: 'Nome de usuário já existe' 
        });
      }
    }
    
    // Verificar se novo email já existe (se estiver sendo alterado)
    if (updates.email && updates.email !== data.users[userIndex].email) {
      const existingEmail = data.users.find(u => 
        u.email === updates.email && u.id !== id
      );
      if (existingEmail) {
        return res.status(409).json({ 
          success: false, 
          error: 'Email já está em uso' 
        });
      }
    }
    
    // Atualizar usuário
    const oldUser = { ...data.users[userIndex] };
    data.users[userIndex] = { 
      ...data.users[userIndex], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await saveData(data);
    
    // Adicionar ao histórico
    const historyEntry = {
      id: generateId(),
      userId: id,
      type: 'user_updated',
      description: `Usuário '${data.users[userIndex].name}' atualizado`,
      points: 0,
      timestamp: new Date().toISOString(),
      details: {
        changes: Object.keys(updates)
      }
    };
    
    data.history.push(historyEntry);
    await saveData(data);
    
    // Remover senha antes de enviar resposta
    const { password, ...userResponse } = data.users[userIndex];
    
    console.log('✅ Usuário atualizado com sucesso:', userResponse.username);
    res.json({ 
      success: true, 
      data: userResponse,
      message: 'Usuário atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar usuário',
      message: error.message 
    });
  }
});

// DELETE /api/users/:id - Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deletando usuário ID: ${id}`);
    
    const data = await readData();
    const userIndex = data.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }
    
    // Não permitir deletar admin principal
    if (data.users[userIndex].username === 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Não é possível deletar o administrador principal' 
      });
    }
    
    const deletedUser = data.users.splice(userIndex, 1)[0];
    await saveData(data);
    
    // Adicionar ao histórico
    const historyEntry = {
      id: generateId(),
      userId: 'system',
      type: 'user_deleted',
      description: `Usuário '${deletedUser.name}' deletado`,
      points: 0,
      timestamp: new Date().toISOString(),
      details: {
        deletedUsername: deletedUser.username,
        deletedUserType: deletedUser.type
      }
    };
    
    data.history.push(historyEntry);
    await saveData(data);
    
    // Remover senha antes de enviar resposta
    const { password, ...userResponse } = deletedUser;
    
    console.log('✅ Usuário deletado com sucesso:', userResponse.username);
    res.json({ 
      success: true, 
      data: userResponse,
      message: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao deletar usuário',
      message: error.message 
    });
  }
});

// POST /api/users/login - Autenticação (login)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`🔐 Tentativa de login: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username e password são obrigatórios' 
      });
    }
    
    const data = await readData();
    const user = data.users.find(u => 
      u.username === username.toLowerCase() && u.password === password
    );
    
    if (!user) {
      console.log('❌ Login falhou: credenciais inválidas');
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário ou senha incorretos' 
      });
    }
    
    // Adicionar ao histórico
    const historyEntry = {
      id: generateId(),
      userId: user.id,
      type: 'user_login',
      description: `Usuário '${user.name}' fez login`,
      points: 0,
      timestamp: new Date().toISOString(),
      details: {
        username: user.username,
        userAgent: req.headers['user-agent']
      }
    };
    
    data.history.push(historyEntry);
    await saveData(data);
    
    // Remover senha antes de enviar resposta
    const { password: _, ...userResponse } = user;
    
    console.log('✅ Login realizado com sucesso:', user.username);
    res.json({ 
      success: true, 
      data: userResponse,
      message: 'Login realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro no servidor',
      message: error.message 
    });
  }
});

module.exports = router;
