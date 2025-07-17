// Configurações da aplicação

import { ADVANCED_CONFIG, FEATURE_FLAGS, isDevelopment } from './advanced-config.js';

// Detecta automaticamente se está em desenvolvimento
const isDevMode = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname === '' ||
         port === '3000' || 
         port === '5173' || 
         port === '8080';
};

// URL da API baseada no ambiente
const getApiUrl = () => {
  if (isDevMode()) {
    // Em desenvolvimento, usar backend Node.js local
    return 'http://localhost:3001/api';
  }
  // Em produção, usar backend Node.js na Vercel
  return 'https://seu-backend-gamification.vercel.app/api';
};

export const CONFIG = {
  API_URL: getApiUrl(),
  APP_NAME: "Sistema de Gamificação de Tarefas",
  VERSION: "2.1.0",
  
  // Configurações de desenvolvimento
  DEV_MODE: isDevMode(),
  USE_MOCK_DATA: false, // ✅ DESABILITADO: Usando backend Node.js real
  
  // Configurações avançadas
  PERFORMANCE: ADVANCED_CONFIG.PERFORMANCE,
  UI: ADVANCED_CONFIG.UI,
  VALIDATION: ADVANCED_CONFIG.VALIDATION,
  PWA: ADVANCED_CONFIG.PWA,
  ACHIEVEMENTS: ADVANCED_CONFIG.ACHIEVEMENTS,
  DEVELOPMENT: ADVANCED_CONFIG.DEVELOPMENT,
  
  // Feature flags
  FEATURES: FEATURE_FLAGS
};

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123"
};

export const MESSAGES = {
  LOGIN_SUCCESS: "Login realizado com sucesso!",
  LOGIN_ERROR: "Usuário ou senha incorretos.",
  TASK_CREATED: "Tarefa criada com sucesso!",
  TASK_COMPLETED: "Tarefa concluída!",
  REWARD_REDEEMED: "Prêmio resgatado!",
  INSUFFICIENT_POINTS: "Pontos insuficientes.",
  USER_CREATED: "Usuário criado com sucesso!",
  USER_UPDATED: "Usuário editado com sucesso!",
  USER_DELETED: "Usuário excluído com sucesso!",
  SHEET_STRUCTURED: "Planilha estruturada com sucesso!",
  GENERIC_ERROR: "Erro inesperado. Tente novamente."
};
