// Configurações da aplicação

// Detecta automaticamente se está em desenvolvimento
const isDevelopment = () => {
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
  if (isDevelopment()) {
    // Em desenvolvimento, usar backend Node.js local
    return 'http://localhost:3001/api';
  }
  // Em produção, usar backend Node.js na Vercel
  return 'https://seu-backend-gamification.vercel.app/api';
};

export const CONFIG = {
  API_URL: getApiUrl(),
  APP_NAME: "Sistema de Gamificação de Tarefas",
  VERSION: "2.0.0",
  
  // Configurações de desenvolvimento
  DEV_MODE: isDevelopment(),
  USE_MOCK_DATA: false // ✅ DESABILITADO: Usando backend Node.js real
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
