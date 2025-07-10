// Serviço de API para comunicação com Google Apps Script

import { CONFIG } from '@/utils/config';
import type { 
  User, 
  Task, 
  Reward, 
  HistoryItem, 
  RankingItem, 
  ApiResponse 
} from '@/types';

class ApiService {
  private baseUrl = CONFIG.API_URL;

  private async makeRequest<T>(params: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(this.baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      console.log('🔗 API Request:', url.toString());
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      console.log('📥 API Response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw new Error('Erro de comunicação com o servidor');
    }
  }

  // Autenticação
  async login(username: string, password: string): Promise<ApiResponse<User>> {
    return this.makeRequest({
      action: 'login',
      name: username,
      password: password
    });
  }

  // Tarefas
  async getTasks(): Promise<Task[]> {
    const response = await this.makeRequest<Task[]>({ action: 'getTasks' });
    return Array.isArray(response) ? response : [];
  }

  async createTask(title: string, description: string, points: number, creator: string): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'createTask',
      title,
      description,
      points: points.toString(),
      creator
    });
  }

  async concludeTask(taskId: string, username: string): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'concludeTask',
      id: taskId,
      name: username
    });
  }

  // Prêmios
  async getRewards(): Promise<Reward[]> {
    const response = await this.makeRequest<Reward[]>({ action: 'getRewards' });
    return Array.isArray(response) ? response : [];
  }

  async redeemReward(rewardId: string, username: string): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'redeemReward',
      id: rewardId,
      name: username
    });
  }

  // Ranking
  async getRanking(): Promise<RankingItem[]> {
    const response = await this.makeRequest<RankingItem[]>({ action: 'getRanking' });
    
    if (Array.isArray(response)) {
      return response;
    }
    
    // Handle different response formats
    if (response && typeof response === 'object') {
      if ('data' in response && Array.isArray(response.data)) {
        return response.data;
      }
      if ('ranking' in response && Array.isArray(response.ranking)) {
        return response.ranking;
      }
    }
    
    return [];
  }

  // Histórico
  async getHistory(username: string): Promise<HistoryItem[]> {
    const response = await this.makeRequest<HistoryItem[]>({ 
      action: 'getHistory',
      name: username 
    });
    return Array.isArray(response) ? response : [];
  }

  async getAllHistory(): Promise<HistoryItem[]> {
    const response = await this.makeRequest<HistoryItem[]>({ action: 'getAllHistory' });
    return Array.isArray(response) ? response : [];
  }

  // Usuários (Admin)
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.makeRequest({ action: 'getUsers' });
  }

  async createUser(user: Omit<User, 'id'>): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'createUser',
      name: user.nome,
      password: user.senha,
      type: user.tipo,
      points: user.pontos.toString()
    });
  }

  async updateUser(userId: string, user: User): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'editUser',
      userId,
      name: user.nome,
      password: user.senha,
      type: user.tipo,
      points: user.pontos.toString()
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.makeRequest({
      action: 'deleteUser',
      userId
    });
  }

  // Estruturação da planilha
  async structureSheet(): Promise<ApiResponse> {
    return this.makeRequest({ action: 'estruturarPlanilha' });
  }
}

export const apiService = new ApiService();
