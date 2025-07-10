// Configurações da aplicação

export const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbxo3CcWaKdFgRob-jyIwv359SDqWI2_nQc92SNlryqvPBXIrQtL4jJZORElseJqFmWB/exec",
  APP_NAME: "Sistema de Gamificação de Tarefas",
  VERSION: "2.0.0"
} as const;

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123"
} as const;

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
} as const;
