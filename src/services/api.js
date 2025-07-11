// Service para comunicação com Google Apps Script API

import { CONFIG } from '@/utils/config.js';

class ApiService {
  constructor() {
    this.baseUrl = CONFIG.API_URL;
  }

  async login(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}?action=login&name=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
      return await response.json();
    } catch (error) {
      console.error('API Login Error:', error);
      throw error;
    }
  }

  async getTasks() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getTasks`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Get Tasks Error:', error);
      throw error;
    }
  }

  async createTask(title, description, points, creator) {
    try {
      const response = await fetch(`${this.baseUrl}?action=createTask&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&points=${points}&creator=${encodeURIComponent(creator)}`);
      return await response.json();
    } catch (error) {
      console.error('API Create Task Error:', error);
      throw error;
    }
  }

  async concludeTask(taskId, username) {
    try {
      const response = await fetch(`${this.baseUrl}?action=concludeTask&id=${taskId}&name=${encodeURIComponent(username)}`);
      return await response.json();
    } catch (error) {
      console.error('API Conclude Task Error:', error);
      throw error;
    }
  }

  async getRewards() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getRewards`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Get Rewards Error:', error);
      throw error;
    }
  }

  async redeemReward(rewardId, username) {
    try {
      const response = await fetch(`${this.baseUrl}?action=redeemReward&id=${rewardId}&name=${encodeURIComponent(username)}`);
      return await response.json();
    } catch (error) {
      console.error('API Redeem Reward Error:', error);
      throw error;
    }
  }

  async getRanking() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getRanking`);
      const data = await response.json();
      
      // Verificar se a resposta é um array ou objeto
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // Se for um objeto com propriedade success, pode ser um erro
        if (data.success === false) {
          console.error('Ranking API Error:', data.message);
          return [];
        }
        // Se não for um array, tentar encontrar os dados
        return data.data || data.ranking || [];
      }
      
      return [];
    } catch (error) {
      console.error('API Get Ranking Error:', error);
      throw error;
    }
  }

  async getHistory(username) {
    try {
      const response = await fetch(`${this.baseUrl}?action=getHistory&name=${encodeURIComponent(username)}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Get History Error:', error);
      throw error;
    }
  }

  async getAllHistory() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getAllHistory`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Get All History Error:', error);
      throw error;
    }
  }

  async getUsers() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getUsers`);
      return await response.json();
    } catch (error) {
      console.error('API Get Users Error:', error);
      throw error;
    }
  }

  async createUser(user) {
    try {
      const response = await fetch(`${this.baseUrl}?action=createUser&name=${encodeURIComponent(user.nome)}&password=${encodeURIComponent(user.senha)}&type=${encodeURIComponent(user.tipo)}&points=${user.pontos}`);
      return await response.json();
    } catch (error) {
      console.error('API Create User Error:', error);
      throw error;
    }
  }

  async updateUser(userId, user) {
    try {
      const response = await fetch(`${this.baseUrl}?action=editUser&userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(user.nome)}&password=${encodeURIComponent(user.senha)}&type=${encodeURIComponent(user.tipo)}&points=${user.pontos}`);
      return await response.json();
    } catch (error) {
      console.error('API Update User Error:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=deleteUser&userId=${encodeURIComponent(userId)}`);
      return await response.json();
    } catch (error) {
      console.error('API Delete User Error:', error);
      throw error;
    }
  }

  async structureSheet() {
    try {
      const response = await fetch(`${this.baseUrl}?action=estruturarPlanilha`);
      return await response.json();
    } catch (error) {
      console.error('API Structure Sheet Error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
