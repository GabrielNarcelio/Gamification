// Gerenciador Inteligente de Cache

export class SmartCacheManager {
  constructor() {
    this.lastDataVersions = new Map(); // Rastrear versões dos dados
    this.errorCounts = new Map(); // Contar erros por endpoint
    this.autoRefreshIntervals = new Map(); // Intervalos de refresh automático
    this.initialized = false;
  }

  static getInstance() {
    if (!SmartCacheManager.instance) {
      SmartCacheManager.instance = new SmartCacheManager();
    }
    return SmartCacheManager.instance;
  }

  async init() {
    if (this.initialized) return;
    
    console.log('🧠 SmartCacheManager: Inicializando sistema inteligente de cache...');
    
    // Configurar intervalos de refresh automático para dados críticos
    this.setupAutoRefresh();
    
    // Configurar detection de mudanças de rede
    this.setupNetworkDetection();
    
    // Configurar limpeza automática de cache antigo
    this.setupAutomaticCleanup();
    
    this.initialized = true;
    console.log('✅ SmartCacheManager: Sistema inicializado');
  }

  // Detectar se dados estão desatualizados
  async isDataStale(endpoint, maxAge = 5 * 60 * 1000) { // 5 minutos default
    try {
      if (!('caches' in window)) return true;

      const cache = await caches.open('api-cache');
      const response = await cache.match(endpoint);
      
      if (!response) return true;

      const cachedTime = response.headers.get('cached-at');
      if (!cachedTime) return true;

      const age = Date.now() - parseInt(cachedTime);
      return age > maxAge;
    } catch (error) {
      console.warn('⚠️ Erro ao verificar idade do cache:', error);
      return true;
    }
  }

  // Limpar cache seletivamente baseado em padrões
  async smartClearCache(patterns = []) {
    try {
      console.log('🧹 SmartCacheManager: Limpeza seletiva de cache...', patterns);
      
      if (!('caches' in window)) return;

      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const shouldDelete = patterns.some(pattern => 
            request.url.includes(pattern)
          );
          
          if (shouldDelete) {
            await cache.delete(request);
            console.log(`🗑️ Cache removido: ${request.url}`);
          }
        }
      }
      
      console.log('✅ Limpeza seletiva concluída');
    } catch (error) {
      console.error('❌ Erro na limpeza seletiva:', error);
    }
  }

  // Clear specific API endpoints from cache
  async clearSpecificEndpoints(endpoints) {
    try {
      console.log('🧹 Limpando endpoints específicos:', endpoints);
      
      if (!('caches' in window)) {
        console.warn('⚠️ Cache API não disponível');
        return;
      }
      
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const url = new URL(request.url);
          
          // Check if this request matches any of the endpoints to clear
          const shouldClear = endpoints.some(endpoint => 
            url.pathname.includes(endpoint) || request.url.includes(endpoint)
          );
          
          if (shouldClear) {
            await cache.delete(request);
            console.log(`🗑️ Removido do cache: ${request.url}`);
          }
        }
      }
      
      console.log('✅ Endpoints específicos limpos do cache');
    } catch (error) {
      console.error('❌ Erro ao limpar endpoints específicos:', error);
    }
  }

  // Detectar e corrigir problemas de cache automaticamente
  async detectAndFixCacheIssues(endpoint) {
    const errorCount = this.errorCounts.get(endpoint) || 0;
    
    // Se houver muitos erros, limpar cache deste endpoint
    if (errorCount >= 3) {
      console.log(`🔧 Detectados ${errorCount} erros em ${endpoint}, limpando cache...`);
      await this.smartClearCache([endpoint]);
      this.errorCounts.set(endpoint, 0);
      return true;
    }
    
    return false;
  }

  // Registrar erro para um endpoint
  recordError(endpoint) {
    const current = this.errorCounts.get(endpoint) || 0;
    this.errorCounts.set(endpoint, current + 1);
    
    // Auto-correção após 3 erros
    if (current + 1 >= 3) {
      setTimeout(() => this.detectAndFixCacheIssues(endpoint), 1000);
    }
  }

  // Registrar sucesso para um endpoint (resetar contador de erros)
  recordSuccess(endpoint) {
    this.errorCounts.set(endpoint, 0);
  }

  // Configurar refresh automático para dados críticos
  setupAutoRefresh() {
    const criticalEndpoints = [
      { pattern: '/api/tasks', interval: 30000 }, // 30 segundos
      { pattern: '/api/rewards', interval: 60000 }, // 1 minuto
      { pattern: '/api/achievements', interval: 45000 }, // 45 segundos
      { pattern: '/api/ranking', interval: 30000 } // 30 segundos
    ];

    criticalEndpoints.forEach(({ pattern, interval }) => {
      const intervalId = setInterval(async () => {
        if (await this.isDataStale(pattern, interval / 2)) {
          console.log(`🔄 Auto-refresh: ${pattern}`);
          await this.smartClearCache([pattern]);
        }
      }, interval);
      
      this.autoRefreshIntervals.set(pattern, intervalId);
    });
  }

  // Detectar mudanças de conectividade
  setupNetworkDetection() {
    if ('navigator' in window && 'onLine' in navigator) {
      window.addEventListener('online', () => {
        console.log('🌐 Conectividade restaurada, atualizando dados...');
        this.refreshAllCriticalData();
      });

      window.addEventListener('offline', () => {
        console.log('📴 Modo offline detectado');
      });
    }
  }

  // Configurar limpeza automática de cache antigo
  setupAutomaticCleanup() {
    // Limpar cache antigo a cada 10 minutos
    setInterval(async () => {
      await this.cleanupOldCache();
    }, 10 * 60 * 1000);
  }

  // Limpar cache antigo (mais de 1 hora)
  async cleanupOldCache() {
    try {
      if (!('caches' in window)) return;

      console.log('🧹 Limpeza automática de cache antigo...');
      const maxAge = 60 * 60 * 1000; // 1 hora
      let cleanedCount = 0;

      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          const cachedTime = response?.headers.get('cached-at');
          
          if (cachedTime) {
            const age = Date.now() - parseInt(cachedTime);
            if (age > maxAge) {
              await cache.delete(request);
              cleanedCount++;
            }
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`✅ ${cleanedCount} entradas de cache antigas removidas`);
      }
    } catch (error) {
      console.error('❌ Erro na limpeza automática:', error);
    }
  }

  // Atualizar todos os dados críticos
  async refreshAllCriticalData() {
    const patterns = ['/api/tasks', '/api/rewards', '/api/achievements', '/api/ranking'];
    await this.smartClearCache(patterns);
  }

  // Destruir (limpar intervalos)
  destroy() {
    this.autoRefreshIntervals.forEach(intervalId => {
      clearInterval(intervalId);
    });
    this.autoRefreshIntervals.clear();
    this.initialized = false;
  }

  // Hook para integração com API Service
  async onApiRequest(endpoint) {
    // Verificar se precisa de refresh automático
    if (await this.isDataStale(endpoint)) {
      await this.smartClearCache([endpoint]);
    }
  }

  async onApiSuccess(endpoint) {
    this.recordSuccess(endpoint);
  }

  async onApiError(endpoint, error) {
    console.warn(`⚠️ Erro na API ${endpoint}:`, error.message);
    this.recordError(endpoint);
  }
}

// Instância global
export const smartCache = SmartCacheManager.getInstance();
