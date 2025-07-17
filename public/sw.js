// Service Worker para PWA - Sistema de Gamificação
const CACHE_NAME = 'gamification-v3.4.0'; // ✅ Versão atualizada com PWA completo
const CACHE_STATIC_NAME = 'gamification-static-v3.4.0';
const CACHE_DYNAMIC_NAME = 'gamification-dynamic-v3.4.0';

// URLs para cache estático (sempre disponível offline)
const STATIC_URLS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/App.js',
  '/src/styles/main.css',
  '/src/styles/components.css',
  '/src/styles/dashboard.css',
  '/src/styles/forms.css',
  '/src/styles/login.css',
  '/src/utils/pwa-manager.js',
  '/src/components/LoginComponent.js',
  '/src/components/DashboardComponent.js',
  '/src/components/TasksComponent.js',
  '/src/components/RewardsComponent.js',
  '/src/components/AchievementsComponent.js',
  '/src/components/RankingComponent.js',
  '/src/components/HistoryComponent.js',
  '/src/components/AdminPanelComponent.js',
  '/src/services/api.js',
  '/src/services/state.js',
  '/src/services/mockData.js',
  '/src/utils/config.js',
  '/src/utils/helpers.js',
  '/favicon.ico',
  '/vite.svg',
  '/icon.svg', // ✅ Novo ícone SVG
  '/manifest.json'
];

// URLs para cache dinâmico (API calls)
const API_URLS = [
  '/api/tasks',
  '/api/users',
  '/api/rewards',
  '/api/achievements',
  '/api/ranking',
  '/api/history'
];

// URLs que NUNCA devem ser cacheadas (operações críticas)
const NEVER_CACHE = [
  '/api/tasks/complete',
  '/api/tasks/user/',
  '/api/history?',
  '/api/users/points',
  '/api/assignments'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('🚀 SW: Instalando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache estático
      caches.open(CACHE_STATIC_NAME).then(cache => {
        console.log('📦 SW: Adicionando arquivos estáticos ao cache...');
        return cache.addAll(STATIC_URLS);
      }),
      
      // Pre-cache dinâmico
      caches.open(CACHE_DYNAMIC_NAME).then(cache => {
        console.log('🌐 SW: Preparando cache dinâmico...');
        return Promise.resolve();
      })
    ]).then(() => {
      console.log('✅ SW: Service Worker instalado com sucesso!');
      return self.skipWaiting();
    }).catch(error => {
      console.error('❌ SW: Erro na instalação:', error);
    })
  );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  console.log('🔄 SW: Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Remover caches antigos
          if (cacheName !== CACHE_STATIC_NAME && 
              cacheName !== CACHE_DYNAMIC_NAME &&
              cacheName !== CACHE_NAME) {
            console.log('🗑️ SW: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ SW: Service Worker ativado!');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar extensões do Chrome
  if (url.protocol === 'chrome-extension:') return;
  
  // NUNCA cachear URLs críticas
  if (shouldNeverCache(request.url)) {
    console.log('🚫 SW: Bypass cache para URL crítica:', request.url);
    event.respondWith(networkOnly(request));
    return;
  }
  
  // Estratégia Cache First para arquivos estáticos
  if (request.method === 'GET' && isStaticResource(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Estratégia Network First para APIs
  if (request.method === 'GET' && isApiRequest(request.url)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Estratégia Network First para outras requisições GET
  if (request.method === 'GET') {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Para POST/PUT/DELETE, sempre tentar network
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    event.respondWith(networkOnly(request));
    return;
  }
});

// Verificar se é recurso estático
function isStaticResource(url) {
  return STATIC_URLS.some(staticUrl => url.includes(staticUrl)) ||
         url.includes('.css') ||
         url.includes('.js') ||
         url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.jpeg') ||
         url.includes('.svg') ||
         url.includes('.ico');
}

// Verificar se NUNCA deve ser cacheado
function shouldNeverCache(url) {
  return NEVER_CACHE.some(neverCacheUrl => url.includes(neverCacheUrl));
}

// Verificar se é requisição de API
function isApiRequest(url) {
  return url.includes('/api/') || url.includes('localhost:3001');
}

// Estratégia Cache First
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 SW: Servindo do cache:', request.url);
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_STATIC_NAME);
      cache.put(request, networkResponse.clone());
      console.log('💾 SW: Adicionado ao cache:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔌 SW: Offline - servindo do cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline - recurso não disponível', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Estratégia Network First
async function networkFirst(request) {
  try {
    // ✅ Para operações críticas (complete, assign, etc.), sempre usar network fresh
    const isCriticalOperation = request.url.includes('/complete') || 
                               request.url.includes('/assign') || 
                               request.url.includes('/users/') ||
                               request.url.includes('/tasks/user/');
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET' && !isCriticalOperation) {
      const cache = await caches.open(CACHE_DYNAMIC_NAME);
      cache.put(request, networkResponse.clone());
      console.log('🌐 SW: Resposta da rede cacheada:', request.url);
    } else if (isCriticalOperation) {
      console.log('⚡ SW: Operação crítica - sem cache:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔌 SW: Rede falhou - tentando cache:', request.url);
    
    // ✅ Para operações críticas, não usar cache em caso de falha
    const isCriticalOperation = request.url.includes('/complete') || 
                               request.url.includes('/assign') || 
                               request.url.includes('/users/') ||
                               request.url.includes('/tasks/user/');
    
    if (isCriticalOperation) {
      console.log('❌ SW: Operação crítica falhou - sem fallback para cache');
      return new Response(JSON.stringify({
        success: false,
        error: 'Conectividade perdida - operação não pode ser completada offline'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('📦 SW: Servindo do cache offline:', request.url);
      return cachedResponse;
    }
    
    // Se é API e não tem cache, retornar dados mock
    if (isApiRequest(request.url)) {
      return handleOfflineApi(request);
    }
    
    return new Response('Offline - dados não disponíveis', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Estratégia Network Only (para operações críticas)
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Operação requer conexão com internet',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Lidar com APIs offline
function handleOfflineApi(request) {
  const url = request.url;
  
  // Dados mock básicos para funcionalidade offline
  let mockData = { success: true, data: [], offline: true };
  
  if (url.includes('/tasks')) {
    mockData.data = [
      {
        id: 'offline-1',
        title: 'Tarefa Offline',
        description: 'Esta é uma tarefa de exemplo disponível offline',
        completed: false,
        points: 10,
        category: 'pessoal'
      }
    ];
  } else if (url.includes('/achievements')) {
    mockData.data = [
      {
        id: 'offline-achievement',
        name: 'Modo Offline',
        description: 'Você está usando o app offline!',
        icon: '🔌',
        points: 5,
        unlocked: true
      }
    ];
  } else if (url.includes('/rewards')) {
    mockData.data = [
      {
        id: 'offline-reward',
        name: 'Recompensa Offline',
        description: 'Disponível offline',
        cost: 50,
        icon: '🎁'
      }
    ];
  }
  
  console.log('🎭 SW: Servindo dados mock offline para:', url);
  
  return new Response(JSON.stringify(mockData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Limpar cache antigo periodicamente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('🧹 SW: Cache limpo com sucesso!');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Background Sync para operações offline
self.addEventListener('sync', event => {
  console.log('🔄 SW: Background Sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

// Sincronizar tarefas quando voltar online
async function syncTasks() {
  try {
    // Aqui você implementaria a sincronização de dados offline
    console.log('🔄 SW: Sincronizando dados offline...');
    
    // Exemplo: buscar dados pendentes do IndexedDB e enviar para server
    // const pendingData = await getPendingData();
    // await sendPendingData(pendingData);
    
    console.log('✅ SW: Sincronização concluída!');
  } catch (error) {
    console.error('❌ SW: Erro na sincronização:', error);
  }
}

// Notificações Push (preparação)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nova notificação do Sistema de Gamificação',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'gamification-notification',
    renotify: true,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Gamificação', options)
  );
});

// Background Sync - Sincronização em segundo plano
self.addEventListener('sync', event => {
  console.log('🔄 Background sync acionado:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
  
  if (event.tag === 'sync-achievements') {
    event.waitUntil(syncAchievements());
  }
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

// Sincronizar dados offline quando conexão retornar
async function syncOfflineData() {
  try {
    console.log('🔄 Iniciando sincronização de dados offline...');
    
    // Obter dados pendentes do IndexedDB ou localStorage
    const pendingData = await getPendingOfflineData();
    
    for (const operation of pendingData) {
      try {
        const response = await fetch(operation.url, {
          method: operation.method,
          headers: {
            'Content-Type': 'application/json',
            ...operation.headers
          },
          body: operation.body ? JSON.stringify(operation.body) : undefined
        });
        
        if (response.ok) {
          console.log('✅ Operação sincronizada:', operation.id);
          await removePendingOperation(operation.id);
        }
      } catch (error) {
        console.log('❌ Erro na sincronização:', error);
      }
    }
    
    // Notificar aplicação sobre sincronização
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        synced: pendingData.length
      });
    });
    
  } catch (error) {
    console.log('❌ Erro na sincronização offline:', error);
  }
}

// Sincronizar conquistas
async function syncAchievements() {
  try {
    const response = await fetch('/api/achievements');
    if (response.ok) {
      const achievements = await response.json();
      console.log('🏆 Conquistas sincronizadas:', achievements.length);
    }
  } catch (error) {
    console.log('❌ Erro ao sincronizar conquistas:', error);
  }
}

// Sincronizar tarefas
async function syncTasks() {
  try {
    const response = await fetch('/api/tasks');
    if (response.ok) {
      const tasks = await response.json();
      console.log('📋 Tarefas sincronizadas:', tasks.length);
    }
  } catch (error) {
    console.log('❌ Erro ao sincronizar tarefas:', error);
  }
}

// Obter dados pendentes (implementação simplificada)
async function getPendingOfflineData() {
  // Em uma implementação real, isso viria do IndexedDB
  const pending = localStorage.getItem('pendingSync');
  return pending ? JSON.parse(pending) : [];
}

// Remover operação pendente após sincronização
async function removePendingOperation(operationId) {
  const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
  const filtered = pending.filter(op => op.id !== operationId);
  localStorage.setItem('pendingSync', JSON.stringify(filtered));
}

// Lidar com cliques em notificações
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🚀 Service Worker carregado - Sistema de Gamificação PWA v3.4.0');