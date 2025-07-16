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
      // Sempre buscar dados frescos, sem cache
      const response = await fetch(`/api/history?userId=${userId}&type=task_completed`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data.some(entry => 
          entry.type === 'task_completed' && 
          entry.details?.taskId === taskId
        );
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar tarefa completada:', error);
      return false;
    }
  }
}

// Expor globalmente para debug
window.CacheManager = CacheManager;
