// Configurações avançadas do sistema

export const ADVANCED_CONFIG = {
  // Performance Settings
  PERFORMANCE: {
    LAZY_LOADING_THRESHOLD: 0.1,
    DEBOUNCE_DELAY: 300,
    THROTTLE_LIMIT: 100,
    CACHE_TTL: 300000, // 5 minutes
    MAX_CACHE_SIZE: 100
  },

  // UI Settings
  UI: {
    TOAST_DURATION: 4000,
    ANIMATION_DURATION: 300,
    MODAL_TRANSITION: 200,
    LOADING_MIN_TIME: 500,
    SKELETON_ANIMATION_SPEED: 1500
  },

  // Validation Settings
  VALIDATION: {
    MIN_TASK_NAME_LENGTH: 3,
    MAX_TASK_NAME_LENGTH: 100,
    MIN_PASSWORD_LENGTH: 6,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_POINTS_VALUE: 10000,
    DEBOUNCE_VALIDATION: 300
  },

  // PWA Settings
  PWA: {
    CACHE_STRATEGY: 'networkFirst',
    OFFLINE_FALLBACK: true,
    BACKGROUND_SYNC: true,
    UPDATE_CHECK_INTERVAL: 60000, // 1 minute
    SYNC_RETRY_INTERVAL: 30000 // 30 seconds
  },

  // Achievement System
  ACHIEVEMENTS: {
    CHECK_INTERVAL: 5000, // Check every 5 seconds
    NOTIFICATION_DURATION: 8000,
    AUTO_CHECK_ON_TASK_COMPLETE: true,
    CELEBRATION_ANIMATION: true
  },

  // Development Settings
  DEVELOPMENT: {
    ENABLE_PERFORMANCE_MONITORING: true,
    LOG_STATE_CHANGES: false,
    MOCK_API_DELAY: 500,
    DEBUG_MODE: false
  }
};

// Feature flags for progressive enhancement
export const FEATURE_FLAGS = {
  ENABLE_DARK_MODE: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_ACHIEVEMENTS: true,
  ENABLE_ANALYTICS: false,
  ENABLE_BETA_FEATURES: false,
  ENABLE_ADVANCED_SEARCH: true,
  ENABLE_BULK_OPERATIONS: true,
  ENABLE_EXPORT_IMPORT: true,
  ENABLE_THEMES: false
};

// Theme configurations
export const THEMES = {
  DEFAULT: {
    name: 'Padrão',
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40'
  },
  DARK: {
    name: 'Escuro',
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    light: '#212529',
    dark: '#f8f9fa'
  },
  HIGH_CONTRAST: {
    name: 'Alto Contraste',
    primary: '#0066cc',
    secondary: '#333333',
    success: '#006600',
    danger: '#cc0000',
    warning: '#cc6600',
    info: '#0066cc',
    light: '#ffffff',
    dark: '#000000'
  }
};

// Notification templates
export const NOTIFICATION_TEMPLATES = {
  TASK_COMPLETED: {
    title: 'Tarefa Concluída! 🎉',
    body: 'Parabéns! Você completou: {taskName}',
    icon: '/favicon.ico',
    tag: 'task-completed'
  },
  ACHIEVEMENT_UNLOCKED: {
    title: 'Nova Conquista! 🏆',
    body: 'Você desbloqueou: {achievementName}',
    icon: '/favicon.ico',
    tag: 'achievement-unlocked'
  },
  REMINDER: {
    title: 'Lembrete de Tarefa 📝',
    body: 'Você tem tarefas pendentes para hoje',
    icon: '/favicon.ico',
    tag: 'task-reminder'
  }
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  UNKNOWN_ERROR: 'Erro desconhecido. Contate o suporte.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Tarefa criada com sucesso! ✅',
  TASK_UPDATED: 'Tarefa atualizada com sucesso! ✅',
  TASK_DELETED: 'Tarefa excluída com sucesso! ✅',
  TASK_COMPLETED: 'Tarefa concluída com sucesso! 🎉',
  USER_CREATED: 'Usuário criado com sucesso! ✅',
  USER_UPDATED: 'Usuário atualizado com sucesso! ✅',
  SETTINGS_SAVED: 'Configurações salvas com sucesso! ✅',
  DATA_EXPORTED: 'Dados exportados com sucesso! 📥',
  DATA_IMPORTED: 'Dados importados com sucesso! 📤'
};

// API endpoints configuration
export const API_ENDPOINTS = {
  BASE: '/api',
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify'
  },
  USERS: {
    LIST: '/users',
    GET: '/users/:id',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    ACHIEVEMENTS: '/users/:id/achievements'
  },
  TASKS: {
    LIST: '/tasks',
    GET: '/tasks/:id',
    CREATE: '/tasks',
    UPDATE: '/tasks/:id',
    DELETE: '/tasks/:id',
    COMPLETE: '/tasks/:id/complete',
    ASSIGN: '/tasks/:id/assign'
  },
  ACHIEVEMENTS: {
    LIST: '/achievements',
    GET: '/achievements/:id',
    CREATE: '/achievements',
    UPDATE: '/achievements/:id',
    DELETE: '/achievements/:id',
    CHECK: '/users/:userId/check-achievements'
  },
  REWARDS: {
    LIST: '/rewards',
    GET: '/rewards/:id',
    CREATE: '/rewards',
    UPDATE: '/rewards/:id',
    DELETE: '/rewards/:id',
    REDEEM: '/rewards/:id/redeem'
  },
  RANKING: '/ranking',
  HISTORY: '/history',
  STATS: '/stats'
};

// Local storage keys
export const STORAGE_KEYS = {
  USER_SESSION: 'user_session',
  APP_PREFERENCES: 'app_preferences',
  OFFLINE_DATA: 'offline_data',
  PENDING_SYNC: 'pending_sync',
  CACHE_DATA: 'cache_data',
  THEME_PREFERENCE: 'theme_preference',
  NOTIFICATION_SETTINGS: 'notification_settings'
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_TASK: 'Ctrl+N',
  SAVE: 'Ctrl+S',
  SEARCH: 'Ctrl+F',
  CLOSE_MODAL: 'Escape',
  TOGGLE_SIDEBAR: 'Ctrl+B',
  REFRESH: 'F5',
  HELP: 'F1'
};

// Export utility function to get configuration
export function getConfig(path) {
  const keys = path.split('.');
  let current = { 
    ADVANCED_CONFIG, 
    FEATURE_FLAGS, 
    THEMES, 
    NOTIFICATION_TEMPLATES, 
    ERROR_MESSAGES, 
    SUCCESS_MESSAGES, 
    API_ENDPOINTS, 
    STORAGE_KEYS, 
    KEYBOARD_SHORTCUTS 
  };
  
  for (const key of keys) {
    if (current[key] === undefined) {
      return null;
    }
    current = current[key];
  }
  
  return current;
}

// Utility to check if feature is enabled
export function isFeatureEnabled(featureName) {
  return FEATURE_FLAGS[featureName] === true;
}

// Utility to get theme configuration
export function getTheme(themeName = 'DEFAULT') {
  return THEMES[themeName] || THEMES.DEFAULT;
}

// Development helpers
export function isDevelopment() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.port === '5173' ||
         window.location.port === '3000';
}

export function isProduction() {
  return !isDevelopment();
}
