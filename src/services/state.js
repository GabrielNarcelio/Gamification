// Gerenciador de estado da aplicação

import { ADMIN_CREDENTIALS } from '@/utils/config.js';

class StateManager {
  constructor() {
    this.state = {
      user: null,
      userPoints: 0,
      userType: null
    };
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // Métodos específicos para login/logout
  login(user, points, type) {
    this.setState({
      user,
      userPoints: points,
      userType: type
    });
  }

  loginAsAdmin() {
    const adminUser = {
      id: 'admin',
      name: ADMIN_CREDENTIALS.username,
      password: ADMIN_CREDENTIALS.password,
      type: 'admin',
      points: 0
    };

    this.setState({
      user: adminUser,
      userPoints: 0,
      userType: 'Administrador'
    });
  }

  logout() {
    this.setState({
      user: null,
      userPoints: 0,
      userType: null
    });
  }

  updatePoints(points) {
    this.setState({ userPoints: points });
  }

  isLoggedIn() {
    return this.state.user !== null;
  }

  isAdmin() {
    return this.state.userType === 'Administrador';
  }

  getCurrentUser() {
    return this.state.user;
  }

  getUserPoints() {
    return this.state.userPoints;
  }
}

export const stateManager = new StateManager();
