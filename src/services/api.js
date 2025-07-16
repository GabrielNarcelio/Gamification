// Service para comunicação com Backend Node.js REST API

import { CONFIG } from '../utils/config.js';
import { mockData, simulateNetworkDelay, generateId } from './mockData.js';

export class ApiService {
  constructor() {
    this.baseUrl = CONFIG.API_URL;
    this.useMockData = CONFIG.USE_MOCK_DATA;
    this.isDevelopment = CONFIG.DEV_MODE;
    
    // Log do modo atual
    if (this.isDevelopment) {
      console.log('🚀 Modo desenvolvimento ativo - usando Backend Node.js');
      console.log(`📡 API URL: ${this.baseUrl}`);
    } else {
      console.log('🚀 Modo produção - usando Backend Node.js');
    }
  }

  // Método auxiliar para verificar se deve usar dados simulados
  async shouldUseMockData() {
    // Se forçado pela configuração, usar mock
    if (this.useMockData) {
      console.log('📋 Configuração forçando uso de mock data');
      return true;
    }
    
    // Caso contrário, tentar API real
    return false;
  }

  // Método auxiliar para fazer requests REST
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Configurações padrão para requests REST
      const defaultOptions = {
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      };

      console.log(`🌐 Fazendo request REST para: ${url}`);
      console.log(`📋 Método: ${defaultOptions.method || 'GET'}`);
      
      const response = await fetch(url, defaultOptions);
      
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response ok: ${response.ok}`);
      console.log(`📊 Response headers:`, Array.from(response.headers.entries()));
      
      // Verificar se response é JSON
      const contentType = response.headers.get('content-type');
      console.log(`📊 Content-Type: ${contentType}`);
      
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Response não é JSON: ${contentType}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response não OK - Status: ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Response data:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ Erro na request REST:`, error);
      throw error;
    }
  }

  // Método auxiliar para tratar erros CORS e fazer fallback
  async handleCorsError(error, methodName, fallbackData) {
    console.error(`❌ Erro CORS em ${methodName}:`, error);
    
    // Se estiver usando mock data ou ocorrer erro CORS, usar fallback
    if (this.useMockData || error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.log(`🔄 Usando dados simulados para ${methodName} (CORS/Network error)`);
      await simulateNetworkDelay();
      return { success: true, data: fallbackData };
    }
    
    throw error;
  }

  // ✅ Método para invalidar cache do Service Worker
  async invalidateCache(urlPattern) {
    try {
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          for (const request of keys) {
            if (request.url.includes(urlPattern)) {
              console.log(`🗑️ Removendo do cache: ${request.url}`);
              await cache.delete(request);
            }
          }
        }
        console.log(`✅ Cache invalidado para: ${urlPattern}`);
      }
    } catch (error) {
      console.error('❌ Erro ao invalidar cache:', error);
    }
  }

  // === MÉTODOS DE AUTENTICAÇÃO ===

  async login(username, password) {
    console.log(`🔐 Tentando login: ${username}`);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const user = mockData.users.find(u => 
          u.username === username && u.password === password
        );
        
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return { success: true, data: userWithoutPassword };
        } else {
          return { success: false, error: 'Usuário ou senha incorretos' };
        }
      }

      // REST API call
      const response = await this.makeRequest('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      return response;
    } catch (error) {
      // Fallback para mock data em caso de erro
      const user = mockData.users.find(u => 
        u.username === username && u.password === password
      );
      
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return await this.handleCorsError(error, 'login', userWithoutPassword);
      } else {
        return { success: false, error: 'Usuário ou senha incorretos (Modo desenvolvimento)' };
      }
    }
  }

  // === MÉTODOS DE TAREFAS ===

  async getTasks(userId = null) {
    console.log('📋 Buscando tarefas...', { userId });
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        // ✅ Simular status de completada para mock data
        const tasksWithStatus = mockData.tasks.map(task => ({
          ...task,
          isCompleted: userId ? mockData.history.some(h => 
            h.type === 'task_completed' && 
            h.userId === userId && 
            h.details?.taskId === task.id
          ) : false
        }));
        return { success: true, data: tasksWithStatus };
      }

      // REST API call com parâmetro userId
      const url = userId ? `/tasks?userId=${userId}` : '/tasks';
      const response = await this.makeRequest(url);
      return response;
    } catch (error) {
      return await this.handleCorsError(error, 'getTasks', mockData.tasks);
    }
  }

  async getRewards() {
    console.log('🎁 Buscando prêmios...');
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        return { success: true, data: mockData.rewards };
      }

      // REST API call
      const response = await this.makeRequest('/rewards');
      return response;
    } catch (error) {
      return await this.handleCorsError(error, 'getRewards', mockData.rewards);
    }
  }

  async getRanking() {
    console.log('🏆 Buscando ranking...');
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const ranking = mockData.users
          .filter(u => u.type !== 'admin')
          .sort((a, b) => b.points - a.points)
          .map((user, index) => {
            const { password, ...userWithoutPassword } = user;
            return {
              position: index + 1,
              ...userWithoutPassword,
              badge: this.getBadge(index + 1)
            };
          });
        return { success: true, data: ranking };
      }

      // REST API call
      const response = await this.makeRequest('/ranking');
      return response;
    } catch (error) {
      const ranking = mockData.users
        .filter(u => u.type !== 'admin')
        .sort((a, b) => b.points - a.points)
        .map((user, index) => {
          const { password, ...userWithoutPassword } = user;
          return {
            position: index + 1,
            ...userWithoutPassword,
            badge: this.getBadge(index + 1)
          };
        });
      return await this.handleCorsError(error, 'getRanking', ranking);
    }
  }

  async getAllHistory(params = {}) {
    console.log('📜 Buscando histórico...');
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        // ✅ Simular paginação para dados mock
        const { limit = 10, offset = 0, type } = params;
        let history = [...mockData.history];
        
        if (type) {
          history = history.filter(h => h.type === type);
        }
        
        const total = history.length;
        const paginatedHistory = history.slice(offset, offset + limit);
        
        return { 
          success: true, 
          data: paginatedHistory,
          pagination: {
            total,
            limit,
            offset,
            pages: Math.ceil(total / limit)
          }
        };
      }

      // REST API call com parâmetros
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/history?${queryString}` : '/history';
      const response = await this.makeRequest(url);
      return response;
    } catch (error) {
      return await this.handleCorsError(error, 'getAllHistory', mockData.history);
    }
  }

  async getUsers() {
    console.log('👥 Buscando usuários...');
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const usersWithoutPassword = mockData.users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
        return { success: true, data: usersWithoutPassword };
      }

      // REST API call
      const response = await this.makeRequest('/users');
      return response;
    } catch (error) {
      const usersWithoutPassword = mockData.users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      return await this.handleCorsError(error, 'getUsers', usersWithoutPassword);
    }
  }

  async createTask(title, description, points, creator) {
    console.log('➕ Criando tarefa:', { title, description, points, creator });
    
    try {
      console.log('🔍 Verificando shouldUseMockData...');
      if (await this.shouldUseMockData()) {
        console.log('📋 Usando mock data');
        await simulateNetworkDelay();
        const newTask = {
          id: generateId(),
          name: title,
          description: description,
          points: points,
          creator: creator,
          createdAt: new Date().toISOString()
        };
        mockData.tasks.push(newTask);
        
        // ✅ Invalidate cache after mock data creation
        await this.invalidateCache('/api/tasks');
        
        return { success: true, data: newTask };
      }

      console.log('🌐 Usando API REST...');
      // REST API call
      const requestBody = { 
        title, 
        description, 
        points, 
        createdBy: creator || null 
      };
      
      console.log('🔍 Debug createTask - request body:', requestBody);
      
      console.log('📡 Fazendo request para /tasks...');
      const response = await this.makeRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      // ✅ Invalidate cache after successful creation
      if (response.success) {
        await this.invalidateCache('/api/tasks');
      }

      console.log('✅ Request concluído, resposta:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro capturado em createTask:', error);
      // Fallback para mock
      const newTask = {
        id: generateId(),
        name: title,
        description: description,
        points: points,
        creator: creator,
        createdAt: new Date().toISOString()
      };
      mockData.tasks.push(newTask);
      
      // ✅ Invalidate cache even on fallback
      await this.invalidateCache('/api/tasks');
      
      console.log('🔄 Usando fallback mock data:', newTask);
      return await this.handleCorsError(error, 'createTask', newTask);
    }
  }

  async deleteTask(taskId) {
    console.log('🗑️ Deletando tarefa:', taskId);
    
    try {
      console.log('🔍 Verificando shouldUseMockData...');
      if (await this.shouldUseMockData()) {
        console.log('📋 Usando mock data');
        await simulateNetworkDelay();
        
        const taskIndex = mockData.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
          return { success: false, error: 'Tarefa não encontrada' };
        }
        
        const deletedTask = mockData.tasks.splice(taskIndex, 1)[0];
        
        // ✅ Invalidate cache for tasks endpoint
        await this.invalidateCache('/api/tasks');
        
        return { success: true, data: deletedTask, message: 'Tarefa deletada com sucesso' };
      }

      console.log('🌐 Usando API REST...');
      console.log('📡 Fazendo request DELETE para /tasks/' + taskId);
      
      const response = await this.makeRequest(`/tasks/${taskId}`, {
        method: 'DELETE'
      });

      // ✅ Invalidate cache after successful deletion
      if (response.success) {
        await this.invalidateCache('/api/tasks');
      }

      console.log('✅ Delete concluído, resposta:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro capturado em deleteTask:', error);
      
      // ✅ Better error handling
      if (error.message.includes('404') || error.message.includes('não encontrada')) {
        console.log(`⚠️ Tarefa ${taskId} já foi deletada ou não existe`);
        return { success: false, error: 'Tarefa não encontrada ou já foi deletada' };
      }
      
      // Fallback para mock only for network errors
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        const taskIndex = mockData.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          const deletedTask = mockData.tasks.splice(taskIndex, 1)[0];
          
          // ✅ Invalidate cache even on fallback
          await this.invalidateCache('/api/tasks');
          
          console.log('🔄 Usando fallback mock data para delete:', deletedTask);
          return await this.handleCorsError(error, 'deleteTask', { 
            success: true, 
            data: deletedTask, 
            message: 'Tarefa deletada com sucesso (offline)' 
          });
        }
      }
      
      throw error;
    }
  }

  async concludeTask(taskId, userId) {
    console.log(`✅ Completando tarefa ${taskId} para usuário ${userId}`);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        
        const task = mockData.tasks.find(t => t.id === taskId);
        const user = mockData.users.find(u => u.id === userId);
        
        if (!task || !user) {
          return { success: false, error: 'Tarefa ou usuário não encontrado' };
        }

        // Adicionar pontos ao usuário
        user.points += task.points;

        // Adicionar ao histórico
        const historyEntry = {
          id: generateId(),
          userId: user.id,
          username: user.username,
          type: 'task_completed',
          description: `Completou a tarefa: ${task.name}`,
          points: task.points,
          date: new Date().toISOString()
        };
        mockData.history.unshift(historyEntry);

        // ✅ Invalidate cache after mock data changes
        await this.invalidateCache('/api/tasks');
        await this.invalidateCache('/api/users');
        await this.invalidateCache('/api/ranking');
        await this.invalidateCache('/api/history');

        return { 
          success: true, 
          data: { 
            pointsEarned: task.points, 
            totalPoints: user.points 
          } 
        };
      }

      // REST API call
      const response = await this.makeRequest(`/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });

      // ✅ Invalidate cache after successful task completion
      if (response.success) {
        await this.invalidateCache('/api/tasks');
        await this.invalidateCache('/api/users');
        await this.invalidateCache('/api/ranking');
        await this.invalidateCache('/api/history');
      }

      return response;
    } catch (error) {
      // Fallback para mock
      const task = mockData.tasks.find(t => t.id === taskId);
      const user = mockData.users.find(u => u.id === userId);
      
      if (!task || !user) {
        throw error;
      }

      user.points += task.points;
      const historyEntry = {
        id: generateId(),
        userId: user.id,
        username: user.username,
        type: 'task_completed',
        description: `Completou a tarefa: ${task.name}`,
        points: task.points,
        date: new Date().toISOString()
      };
      mockData.history.unshift(historyEntry);

      // ✅ Invalidate cache even on fallback
      await this.invalidateCache('/api/tasks');
      await this.invalidateCache('/api/users');
      await this.invalidateCache('/api/ranking');
      await this.invalidateCache('/api/history');

      return await this.handleCorsError(error, 'concludeTask', { 
        pointsEarned: task.points, 
        totalPoints: user.points 
      });
    }
  }

  async createReward(title, description, cost, category, stock) {
    console.log('➕ Criando prêmio:', { title, description, cost, category, stock });
    
    try {
      console.log('🔍 Verificando shouldUseMockData...');
      if (await this.shouldUseMockData()) {
        console.log('📋 Usando mock data');
        await simulateNetworkDelay();
        
        const newReward = {
          id: generateId(),
          title: title,
          description: description,
          cost: parseInt(cost),
          category: category || 'Geral',
          stock: stock ? parseInt(stock) : 999,
          createdAt: new Date().toISOString()
        };
        
        mockData.rewards.push(newReward);
        
        // ✅ Invalidate cache after mock data creation
        await this.invalidateCache('/api/rewards');
        
        return { success: true, data: newReward, message: 'Prêmio criado com sucesso' };
      }

      console.log('🌐 Usando API REST...');
      // REST API call
      const requestBody = { 
        title, 
        description, 
        cost: parseInt(cost),
        category: category || 'Geral',
        stock: stock ? parseInt(stock) : undefined
      };
      
      console.log('🔍 Debug createReward - request body:', requestBody);
      
      console.log('📡 Fazendo request para /rewards...');
      const response = await this.makeRequest('/rewards', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      // ✅ Invalidate cache after successful creation
      if (response.success) {
        await this.invalidateCache('/api/rewards');
      }

      console.log('✅ Request concluído, resposta:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro capturado em createReward:', error);
      // Fallback para mock
      const newReward = {
        id: generateId(),
        title: title,
        description: description,
        cost: parseInt(cost),
        category: category || 'Geral',
        stock: stock ? parseInt(stock) : 999,
        createdAt: new Date().toISOString()
      };
      mockData.rewards.push(newReward);
      
      // ✅ Invalidate cache even on fallback
      await this.invalidateCache('/api/rewards');
      
      console.log('🔄 Usando fallback mock data:', newReward);
      return await this.handleCorsError(error, 'createReward', newReward);
    }
  }

  async deleteReward(rewardId) {
    console.log('🗑️ Deletando prêmio:', rewardId);
    
    try {
      console.log('🔍 Verificando shouldUseMockData...');
      if (await this.shouldUseMockData()) {
        console.log('📋 Usando mock data');
        await simulateNetworkDelay();
        
        const rewardIndex = mockData.rewards.findIndex(r => r.id === rewardId);
        if (rewardIndex === -1) {
          return { success: false, error: 'Prêmio não encontrado' };
        }
        
        const deletedReward = mockData.rewards.splice(rewardIndex, 1)[0];
        
        // ✅ Invalidate cache for rewards endpoint
        await this.invalidateCache('/api/rewards');
        
        return { success: true, data: deletedReward, message: 'Prêmio deletado com sucesso' };
      }

      console.log('🌐 Usando API REST...');
      console.log('📡 Fazendo request DELETE para /rewards/' + rewardId);
      
      const response = await this.makeRequest(`/rewards/${rewardId}`, {
        method: 'DELETE'
      });

      // ✅ Invalidate cache after successful deletion
      if (response.success) {
        await this.invalidateCache('/api/rewards');
      }

      console.log('✅ Delete concluído, resposta:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro capturado em deleteReward:', error);
      
      // ✅ Better error handling
      if (error.message.includes('404') || error.message.includes('não encontrado')) {
        console.log(`⚠️ Prêmio ${rewardId} já foi deletado ou não existe`);
        return { success: false, error: 'Prêmio não encontrado ou já foi deletado' };
      }
      
      // Fallback para mock only for network errors
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        const rewardIndex = mockData.rewards.findIndex(r => r.id === rewardId);
        if (rewardIndex !== -1) {
          const deletedReward = mockData.rewards.splice(rewardIndex, 1)[0];
          
          // ✅ Invalidate cache even on fallback
          await this.invalidateCache('/api/rewards');
          
          console.log('🔄 Usando fallback mock data para delete:', deletedReward);
          return await this.handleCorsError(error, 'deleteReward', { 
            success: true, 
            data: deletedReward, 
            message: 'Prêmio deletado com sucesso (offline)' 
          });
        }
      }
      
      throw error;
    }
  }

  async redeemReward(rewardId, userId) {
    console.log(`🎁 Resgatando prêmio ${rewardId} para usuário ${userId}`);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        
        const reward = mockData.rewards.find(r => r.id === rewardId);
        const user = mockData.users.find(u => u.id === userId);
        
        if (!reward || !user) {
          return { success: false, error: 'Prêmio ou usuário não encontrado' };
        }

        if (user.points < reward.cost) {
          return { success: false, error: 'Pontos insuficientes' };
        }

        // Deduzir pontos do usuário
        user.points -= reward.cost;

        // Adicionar ao histórico
        const historyEntry = {
          id: generateId(),
          userId: user.id,
          username: user.username,
          type: 'reward_redeemed',
          description: `Resgatou o prêmio: ${reward.name}`,
          points: -reward.cost,
          date: new Date().toISOString()
        };
        mockData.history.unshift(historyEntry);

        // ✅ Invalidate cache after mock data changes
        await this.invalidateCache('/api/rewards');
        await this.invalidateCache('/api/users');
        await this.invalidateCache('/api/ranking');
        await this.invalidateCache('/api/history');

        return { 
          success: true, 
          data: { 
            pointsSpent: reward.cost, 
            remainingPoints: user.points 
          } 
        };
      }

      // REST API call
      const response = await this.makeRequest(`/rewards/${rewardId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });

      // ✅ Invalidate cache after successful reward redemption
      if (response.success) {
        await this.invalidateCache('/api/rewards');
        await this.invalidateCache('/api/users');
        await this.invalidateCache('/api/ranking');
        await this.invalidateCache('/api/history');
      }

      return response;
    } catch (error) {
      // Fallback para mock
      const reward = mockData.rewards.find(r => r.id === rewardId);
      const user = mockData.users.find(u => u.id === userId);
      
      if (!reward || !user) {
        throw error;
      }

      if (user.points < reward.cost) {
        return { success: false, error: 'Pontos insuficientes (Modo desenvolvimento)' };
      }

      user.points -= reward.cost;
      const historyEntry = {
        id: generateId(),
        userId: user.id,
        username: user.username,
        type: 'reward_redeemed',
        description: `Resgatou o prêmio: ${reward.name}`,
        points: -reward.cost,
        date: new Date().toISOString()
      };
      mockData.history.unshift(historyEntry);

      // ✅ Invalidate cache even on fallback
      await this.invalidateCache('/api/rewards');
      await this.invalidateCache('/api/users');
      await this.invalidateCache('/api/ranking');
      await this.invalidateCache('/api/history');

      return await this.handleCorsError(error, 'redeemReward', { 
        pointsSpent: reward.cost, 
        remainingPoints: user.points 
      });
    }
  }

  async getHistory(userId, params = {}) {
    console.log(`📜 Buscando histórico do usuário: ${userId}`);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        // ✅ Simular paginação para dados mock
        const { limit = 10, offset = 0, type } = params;
        let userHistory = mockData.history.filter(h => h.userId === userId);
        
        if (type) {
          userHistory = userHistory.filter(h => h.type === type);
        }
        
        const total = userHistory.length;
        const paginatedHistory = userHistory.slice(offset, offset + limit);
        
        return { 
          success: true, 
          data: paginatedHistory,
          pagination: {
            total,
            limit,
            offset,
            pages: Math.ceil(total / limit)
          }
        };
      }

      // REST API call com parâmetros
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/history/user/${userId}?${queryString}` : `/history/user/${userId}`;
      const response = await this.makeRequest(url);
      return response;
    } catch (error) {
      const userHistory = mockData.history.filter(h => h.userId === userId);
      return await this.handleCorsError(error, 'getHistory', userHistory);
    }
  }

  async createUser(user) {
    console.log('➕ Criando usuário:', user);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const newUser = {
          id: generateId(),
          username: user.nome,
          password: user.senha,
          type: user.tipo,
          points: user.pontos || 0,
          createdAt: new Date().toISOString()
        };
        mockData.users.push(newUser);
        
        // ✅ Invalidate cache after creating user
        await this.invalidateCache('/api/users');
        await this.invalidateCache('/api/ranking');
        
        const { password, ...userWithoutPassword } = newUser;
        return { success: true, data: userWithoutPassword };
      }

      // REST API call
      const response = await this.makeRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: user.username,
          password: user.senha,
          name: user.name,
          email: user.email,
          type: user.tipo,
          points: user.pontos || 0
        })
      });

      // ✅ Invalidate cache after successful creation
      if (response.success) {
        await this.invalidateCache('/api/users');
        await this.invalidateCache('/api/ranking');
      }

      return response;
    } catch (error) {
      // Fallback para mock
      const newUser = {
        id: generateId(),
        username: user.nome,
        password: user.senha,
        type: user.tipo,
        points: user.pontos || 0,
        createdAt: new Date().toISOString()
      };
      mockData.users.push(newUser);
      
      // ✅ Invalidate cache even on fallback
      await this.invalidateCache('/api/users');
      await this.invalidateCache('/api/ranking');
      
      const { password, ...userWithoutPassword } = newUser;
      return await this.handleCorsError(error, 'createUser', userWithoutPassword);
    }
  }

  async updateUser(userId, user) {
    console.log(`✏️ Atualizando usuário ${userId}:`, user);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const userIndex = mockData.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          mockData.users[userIndex] = { 
            ...mockData.users[userIndex], 
            username: user.username,
            password: user.senha,
            name: user.name,
            email: user.email,
            type: user.tipo,
            points: user.pontos
          };
          
          // ✅ Invalidate cache after mock data update
          await this.invalidateCache('/api/users');
          await this.invalidateCache('/api/ranking');
          
          const { password, ...userWithoutPassword } = mockData.users[userIndex];
          return { success: true, data: userWithoutPassword };
        }
        return { success: false, error: 'Usuário não encontrado' };
      }

      // REST API call
      const response = await this.makeRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          username: user.username,
          password: user.senha,
          name: user.name,
          email: user.email,
          type: user.tipo,
          points: user.pontos
        })
      });

      // ✅ Invalidate cache after successful update
      if (response.success) {
        await this.invalidateCache('/api/users');
        await this.invalidateCache('/api/ranking');
      }

      return response;
    } catch (error) {
      // Fallback para mock
      const userIndex = mockData.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        mockData.users[userIndex] = { 
          ...mockData.users[userIndex], 
          username: user.nome,
          password: user.senha,
          type: user.tipo,
          points: user.pontos
        };
        
        // ✅ Invalidate cache even on fallback
        await this.invalidateCache('/api/users');
        await this.invalidateCache('/api/ranking');
        
        const { password, ...userWithoutPassword } = mockData.users[userIndex];
        return await this.handleCorsError(error, 'updateUser', userWithoutPassword);
      }
      throw error;
    }
  }

  async deleteUser(userId) {
    console.log(`🗑️ Deletando usuário: ${userId}`);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const userIndex = mockData.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          const deletedUser = mockData.users.splice(userIndex, 1)[0];
          const { password, ...userWithoutPassword } = deletedUser;
          
          // ✅ Invalidate cache for users endpoint
          await this.invalidateCache('/api/users');
          
          return { success: true, data: userWithoutPassword };
        }
        return { success: false, error: 'Usuário não encontrado' };
      }

      // REST API call
      const response = await this.makeRequest(`/users/${userId}`, {
        method: 'DELETE'
      });

      // ✅ Invalidate cache after successful deletion
      if (response.success) {
        await this.invalidateCache('/api/users');
        await this.invalidateCache('/api/ranking');
      }

      return response;
    } catch (error) {
      // ✅ Better error handling - don't try to delete again if user not found
      if (error.message.includes('404') || error.message.includes('não encontrado')) {
        console.log(`⚠️ Usuário ${userId} já foi deletado ou não existe`);
        return { success: false, error: 'Usuário não encontrado ou já foi deletado' };
      }
      
      // Fallback para mock only for network errors
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        const userIndex = mockData.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          const deletedUser = mockData.users.splice(userIndex, 1)[0];
          const { password, ...userWithoutPassword } = deletedUser;
          return await this.handleCorsError(error, 'deleteUser', userWithoutPassword);
        }
      }
      
      throw error;
    }
  }

  async structureSheet() {
    console.log('🔧 Estruturando planilha (funcionalidade legada)...');
    
    // Esta funcionalidade era específica do Google Apps Script
    // Para o backend Node.js, apenas retornamos sucesso
    await simulateNetworkDelay();
    return { 
      success: true, 
      message: 'Estrutura já configurada no backend Node.js' 
    };
  }

  // === MÉTODOS DE CONQUISTAS (ACHIEVEMENTS) ===

  async getAchievements() {
    console.log('🏆 Buscando todas as conquistas...');
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        return { 
          success: true, 
          data: mockData.achievements || [],
          total: (mockData.achievements || []).length
        };
      }

      // REST API call
      const response = await this.makeRequest('/achievements');
      return response;
    } catch (error) {
      return await this.handleCorsError(error, 'getAchievements', []);
    }
  }

  async getUserAchievements(userId) {
    console.log(`🏆 Buscando conquistas do usuário: ${userId}`);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const userAchievements = mockData.userAchievements?.filter(ua => ua.userId === userId) || [];
        const achievements = mockData.achievements || [];
        
        const achievementsWithStatus = achievements.map(achievement => {
          const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
          return {
            ...achievement,
            unlocked: !!userAchievement,
            unlockedAt: userAchievement?.unlockedAt || null,
            progress: userAchievement?.progress || 0
          };
        });
        
        const unlocked = achievementsWithStatus.filter(a => a.unlocked);
        const locked = achievementsWithStatus.filter(a => !a.unlocked);
        
        return { 
          success: true, 
          data: {
            all: achievementsWithStatus,
            unlocked,
            locked,
            stats: {
              total: achievementsWithStatus.length,
              unlocked: unlocked.length,
              locked: locked.length,
              totalPoints: unlocked.reduce((sum, a) => sum + a.points, 0)
            }
          }
        };
      }

      // REST API call
      const response = await this.makeRequest(`/achievements/user/${userId}`);
      return response;
    } catch (error) {
      return await this.handleCorsError(error, 'getUserAchievements', {
        all: [],
        unlocked: [],
        locked: [],
        stats: { total: 0, unlocked: 0, locked: 0, totalPoints: 0 }
      });
    }
  }

  async checkUserAchievements(userId) {
    console.log(`🔍 Verificando conquistas para usuário: ${userId}`);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        // Simulação simples para mock
        return { 
          success: true, 
          data: {
            newlyUnlocked: [],
            totalChecked: 0,
            newUnlocks: 0
          },
          message: 'Verificação completa (modo simulado)'
        };
      }

      // REST API call
      const response = await this.makeRequest(`/achievements/check/${userId}`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      return await this.handleCorsError(error, 'checkUserAchievements', {
        newlyUnlocked: [],
        totalChecked: 0,
        newUnlocks: 0
      });
    }
  }

  async createAchievement(achievement) {
    console.log('➕ Criando nova conquista:', achievement);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const newAchievement = {
          id: generateId(),
          ...achievement,
          createdAt: new Date().toISOString()
        };
        
        if (!mockData.achievements) {
          mockData.achievements = [];
        }
        
        mockData.achievements.push(newAchievement);
        
        // ✅ Invalidate cache after mock data creation
        await this.invalidateCache('/api/achievements');
        
        return { success: true, data: newAchievement };
      }

      // REST API call
      const response = await this.makeRequest('/achievements', {
        method: 'POST',
        body: JSON.stringify(achievement)
      });

      // ✅ Invalidate cache after successful creation
      if (response.success) {
        await this.invalidateCache('/api/achievements');
      }

      return response;
    } catch (error) {
      // Fallback para mock
      const newAchievement = {
        id: generateId(),
        ...achievement,
        createdAt: new Date().toISOString()
      };
      
      if (!mockData.achievements) {
        mockData.achievements = [];
      }
      
      mockData.achievements.push(newAchievement);
      
      // ✅ Invalidate cache even on fallback
      await this.invalidateCache('/api/achievements');
      
      return await this.handleCorsError(error, 'createAchievement', newAchievement);
    }
  }

  async deleteAchievement(achievementId) {
    console.log(`🗑️ Deletando conquista: ${achievementId}`);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const achievementIndex = mockData.achievements?.findIndex(a => a.id === achievementId);
        if (achievementIndex !== -1) {
          const deletedAchievement = mockData.achievements.splice(achievementIndex, 1)[0];
          
          // ✅ Invalidate cache after mock data deletion
          await this.invalidateCache('/api/achievements');
          
          return { success: true, data: deletedAchievement };
        }
        return { success: false, error: 'Conquista não encontrada' };
      }

      // REST API call
      const response = await this.makeRequest(`/achievements/${achievementId}`, {
        method: 'DELETE'
      });

      // ✅ Invalidate cache after successful deletion
      if (response.success) {
        await this.invalidateCache('/api/achievements');
      }

      return response;
    } catch (error) {
      // Fallback para mock
      const achievementIndex = mockData.achievements?.findIndex(a => a.id === achievementId);
      if (achievementIndex !== -1) {
        const deletedAchievement = mockData.achievements.splice(achievementIndex, 1)[0];
        
        // ✅ Invalidate cache even on fallback
        await this.invalidateCache('/api/achievements');
        
        return await this.handleCorsError(error, 'deleteAchievement', deletedAchievement);
      }
      
      return await this.handleCorsError(error, 'deleteAchievement', null);
    }
  }

  // === MÉTODOS AUXILIARES ===

  getBadge(position) {
    switch (position) {
      case 1:
        return { emoji: '🥇', name: 'Ouro', color: '#FFD700' };
      case 2:
        return { emoji: '🥈', name: 'Prata', color: '#C0C0C0' };
      case 3:
        return { emoji: '🥉', name: 'Bronze', color: '#CD7F32' };
      default:
        return { emoji: '🏅', name: 'Participante', color: '#6B73FF' };
    }
  }
}

// Criar instância global
export const api = new ApiService();
