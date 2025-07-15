const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Logging
app.use(morgan('combined'));

// CORS configurado para frontend
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging personalizado
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📋 Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  next();
});

// Rotas da API
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/history', require('./routes/history'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/ranking', require('./routes/ranking'));

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: '🎮 Sistema de Gamificação - API Backend',
    version: '1.0.0',
    endpoints: [
      'GET /api/health - Status da API',
      'GET /api/users - Listar usuários',
      'POST /api/users - Criar usuário',
      'PUT /api/users/:id - Atualizar usuário',
      'DELETE /api/users/:id - Deletar usuário',
      'GET /api/tasks - Listar tarefas',
      'POST /api/tasks - Criar tarefa',
      'PUT /api/tasks/:id - Atualizar tarefa',
      'POST /api/tasks/:id/complete - Completar tarefa',
      'GET /api/rewards - Listar prêmios',
      'POST /api/rewards - Criar prêmio',
      'POST /api/rewards/:id/redeem - Resgatar prêmio',
      'GET /api/history - Histórico de atividades',
      'GET /api/ranking - Ranking de usuários'
    ]
  });
});

// Middleware de erro 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: `Rota ${req.method} ${req.url} não existe`,
    availableEndpoints: '/api/health, /api/users, /api/tasks, /api/rewards, /api/history, /api/ranking'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err);
  
  res.status(err.status || 500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`📚 Docs: http://localhost:${PORT}/`);
  console.log('🚀 ================================\n');
});

module.exports = app;
