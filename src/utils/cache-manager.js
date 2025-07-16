// Utilitário para limpeza de cache

export class CacheManager {
  static async clearAllCache() {
    try {
      console.log('🧹 Iniciando limpeza completa de cache...');
      
      // 1. Limpar todos os caches do Service Worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log(`🗑️ Removendo cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
        console.log('✅ Todos os caches do Service Worker removidos');
      }

      // 2. Limpar localStorage
      if ('localStorage' in window) {
        localStorage.clear();
        console.log('✅ localStorage limpo');
      }

      // 3. Limpar sessionStorage
      if ('sessionStorage' in window) {
        sessionStorage.clear();
        console.log('✅ sessionStorage limpo');
      }

      // 4. Forçar atualização do Service Worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.log('🔄 Atualizando Service Worker...');
          await registration.update();
        }
      }

      console.log('🎉 Cache limpo com sucesso! Recarregando página...');
      
      // 5. Recarregar a página para garantir dados frescos
      window.location.reload(true);
      
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      alert('Erro ao limpar cache. Tente recarregar a página manualmente.');
    }
  }

  static async clearSpecificCache(pattern) {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          for (const request of keys) {
            if (request.url.includes(pattern)) {
              await cache.delete(request);
              console.log(`🗑️ Removido do cache: ${request.url}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao limpar cache específico:', error);
    }
  }

  static async isTaskCompleted(taskId, userId) {
    try {
      // Debug apenas se solicitado
      const isDebug = window.location?.search?.includes('debug=true');
      if (isDebug) {
        console.log(`🔍 Verificando se tarefa ${taskId} foi completada pelo usuário ${userId}`);
      }
      
      // Importar a instância da API
      const { api } = await import('../services/api.js');
      
      // Usar o método getHistory da API com filtro de tipo
      const response = await api.getHistory(userId, { type: 'task_completed' });
      
      if (response && response.success && response.data) {
        const isCompleted = response.data.some(entry => 
          entry.type === 'task_completed' && 
          entry.details?.taskId === taskId
        );
        if (isDebug) {
          console.log(`✅ Tarefa ${taskId} completada: ${isCompleted}`);
        }
        return isCompleted;
      }
      
      if (isDebug) {
        console.log(`⚠️ Resposta inválida ou sem dados para tarefa ${taskId}`);
      }
      return false;
    } catch (error) {
      console.error(`❌ Erro ao verificar tarefa completada ${taskId}:`, error.message);
      // Se for erro de parsing JSON, provavelmente retornou HTML (404)
      if (error.message && error.message.includes('JSON')) {
        console.error('💥 Provavelmente recebeu HTML em vez de JSON - verifique se a API está rodando');
      }
      return false;
    }
  }
}

// Expor globalmente para debug
window.CacheManager = CacheManager;
