// Gerenciador de estado da aplicação

import { ADMIN_CREDENTIALS } from '@/utils/config';
import type { AppState, User } from '@/types';

class StateManager {
  private state: AppState = {
    user: null,
    userPoints: 0,
    userType: null
  };

  private listeners: Set<(state: AppState) => void> = new Set();

  getState(): AppState {
    return { ...this.state };
  }

  setState(newState: Partial<AppState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // Métodos específicos para login/logout
  login(user: User, points: number, type: 'Usuário' | 'Administrador'): void {
    this.setState({
      user,
      userPoints: points,
      userType: type
    });
  }

  loginAsAdmin(): void {
    const adminUser: User = {
      nome: ADMIN_CREDENTIALS.username,
      senha: ADMIN_CREDENTIALS.password,
      tipo: 'Administrador',
      pontos: 0
    };

    this.setState({
      user: adminUser,
      userPoints: 0,
      userType: 'Administrador'
    });
  }

  logout(): void {
    this.setState({
      user: null,
      userPoints: 0,
      userType: null
    });
  }

  updatePoints(points: number): void {
    this.setState({ userPoints: points });
  }

  isLoggedIn(): boolean {
    return this.state.user !== null;
  }

  isAdmin(): boolean {
    return this.state.userType === 'Administrador';
  }

  getCurrentUser(): User | null {
    return this.state.user;
  }

  getUserPoints(): number {
    return this.state.userPoints;
  }
}

export const stateManager = new StateManager();
