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
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    // Only log if there's a significant change (like lastUpdate)
    if (newState.lastUpdate || newState.user !== oldState.user) {
      console.log('🔄 State updated:', { 
        userChanged: newState.user !== oldState.user,
        lastUpdate: newState.lastUpdate,
        listeners: this.listeners.size 
      });
    }
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    // Only log when there are actual listeners and significant changes
    if (this.listeners.size > 0 && (this.state.lastUpdate || this.state.user)) {
      console.log('📢 Notifying', this.listeners.size, 'listeners');
    }
    this.listeners.forEach((listener, index) => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error(`❌ Error in listener ${index}:`, error);
      }
    });
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
    // Update both userPoints and user.points if user exists
    const updatedState = { userPoints: points };
    if (this.state.user) {
      updatedState.user = { ...this.state.user, points };
    }
    this.setState(updatedState);
  }

  // ✅ Method to trigger data refresh across all components
  triggerDataRefresh() {
    // Force notify all listeners with current state plus a refresh flag
    this.setState({ 
      ...this.state, 
      lastUpdate: Date.now() // Add timestamp to force component updates
    });
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
