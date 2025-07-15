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

  async getTasks() {
    console.log('📋 Buscando tarefas...');
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        return { success: true, data: mockData.tasks };
      }

      // REST API call
      const response = await this.makeRequest('/tasks');
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

  async getAllHistory() {
    console.log('📜 Buscando histórico...');
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        return { success: true, data: mockData.history };
      }

      // REST API call
      const response = await this.makeRequest('/history');
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
          throw new Error('Tarefa não encontrada');
        }
        
        const deletedTask = mockData.tasks.splice(taskIndex, 1)[0];
        return { success: true, data: deletedTask, message: 'Tarefa deletada com sucesso' };
      }

      console.log('🌐 Usando API REST...');
      console.log('📡 Fazendo request DELETE para /tasks/' + taskId);
      
      const response = await this.makeRequest(`/tasks/${taskId}`, {
        method: 'DELETE'
      });

      console.log('✅ Delete concluído, resposta:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro capturado em deleteTask:', error);
      // Fallback para mock (remover da lista local)
      const taskIndex = mockData.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        const deletedTask = mockData.tasks.splice(taskIndex, 1)[0];
        console.log('🔄 Usando fallback mock data para delete:', deletedTask);
        return await this.handleCorsError(error, 'deleteTask', { 
          success: true, 
          data: deletedTask, 
          message: 'Tarefa deletada com sucesso (offline)' 
        });
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
          throw new Error('Prêmio não encontrado');
        }
        
        const deletedReward = mockData.rewards.splice(rewardIndex, 1)[0];
        return { success: true, data: deletedReward, message: 'Prêmio deletado com sucesso' };
      }

      console.log('🌐 Usando API REST...');
      console.log('📡 Fazendo request DELETE para /rewards/' + rewardId);
      
      const response = await this.makeRequest(`/rewards/${rewardId}`, {
        method: 'DELETE'
      });

      console.log('✅ Delete concluído, resposta:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro capturado em deleteReward:', error);
      // Fallback para mock (remover da lista local)
      const rewardIndex = mockData.rewards.findIndex(r => r.id === rewardId);
      if (rewardIndex !== -1) {
        const deletedReward = mockData.rewards.splice(rewardIndex, 1)[0];
        console.log('🔄 Usando fallback mock data para delete:', deletedReward);
        return await this.handleCorsError(error, 'deleteReward', { 
          success: true, 
          data: deletedReward, 
          message: 'Prêmio deletado com sucesso (offline)' 
        });
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

      return await this.handleCorsError(error, 'redeemReward', { 
        pointsSpent: reward.cost, 
        remainingPoints: user.points 
      });
    }
  }

  async getHistory(username) {
    console.log(`📜 Buscando histórico do usuário: ${username}`);
    
    try {
      if (await this.shouldUseMockData()) {
        await simulateNetworkDelay();
        const userHistory = mockData.history.filter(h => h.username === username);
        return { success: true, data: userHistory };
      }

      // REST API call
      const response = await this.makeRequest(`/history/user/${username}`);
      return response;
    } catch (error) {
      const userHistory = mockData.history.filter(h => h.username === username);
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
        const { password, ...userWithoutPassword } = newUser;
        return { success: true, data: userWithoutPassword };
      }

      // REST API call
      const response = await this.makeRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: user.nome,
          password: user.senha,
          name: user.nome,
          email: user.email,
          type: user.tipo,
          points: user.pontos || 0
        })
      });

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
            username: user.nome,
            password: user.senha,
            name: user.nome,
            email: user.email,
            type: user.tipo,
            points: user.pontos
          };
          const { password, ...userWithoutPassword } = mockData.users[userIndex];
          return { success: true, data: userWithoutPassword };
        }
        return { success: false, error: 'Usuário não encontrado' };
      }

      // REST API call
      const response = await this.makeRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          username: user.nome,
          password: user.senha,
          name: user.nome,
          email: user.email,
          type: user.tipo,
          points: user.pontos
        })
      });

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
          return { success: true, data: userWithoutPassword };
        }
        return { success: false, error: 'Usuário não encontrado' };
      }

      // REST API call
      const response = await this.makeRequest(`/users/${userId}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      // Fallback para mock
      const userIndex = mockData.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        const deletedUser = mockData.users.splice(userIndex, 1)[0];
        const { password, ...userWithoutPassword } = deletedUser;
        return await this.handleCorsError(error, 'deleteUser', userWithoutPassword);
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
