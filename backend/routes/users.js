const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// DELETE /api/users/:id - Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deletando usuário ID: ${id}`);

    // Buscar usuário
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    // Não permitir deletar admin principal (exemplo: email === 'admin' ou type === 'admin')
    if (user.type === 'admin' && user.email === 'admin') {
      return res.status(403).json({ success: false, error: 'Não é possível deletar o administrador principal' });
    }

    const deletedUser = await prisma.user.delete({ where: { id: Number(id) } });
    const { password, ...userResponse } = deletedUser;
    console.log('✅ Usuário deletado com sucesso:', userResponse.email);
    res.json({ success: true, data: userResponse, message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar usuário', message: error.message });
  }
});
router.get('/', async (req, res) => {
  try {
    console.log('📋 Listando usuários...');
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, type: true, points: true }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
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
    const { username, password, name, email, type = 'user', points = 0 } = req.body;
    console.log('➕ Criando usuário:', { username, name, email, type, points });
    
    // Validações
    if (!username || !password || !name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: username, password, name, email' 
      });
    }
    
    // Verificar se email já existe
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'Email já está em uso' });
    }

    // Criar novo usuário
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        type: type.toLowerCase() === 'admin' || type.toLowerCase() === 'administrador' ? 'admin' : 'user',
        points: parseInt(points) || 0
      }
    });

    // Remover senha antes de enviar resposta
    const { password: _, ...userResponse } = user;

    res.json({
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
    // ...rota PUT corrigida, nada mais aqui...
    
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
