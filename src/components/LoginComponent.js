// Componente de Login

import { apiService } from '@/services/api.js';
import { stateManager } from '@/services/state.js';
import { ADMIN_CREDENTIALS, MESSAGES } from '@/utils/config.js';
import { validateRequired, createLoadingButton } from '@/utils/helpers.js';

export class LoginComponent {
  constructor(container) {
    this.container = container;
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="login-container">
        <div class="login-form">
          <h1>Sistema de Gamificação</h1>
          <div class="form-group">
            <label for="login-username">Usuário:</label>
            <input type="text" id="login-username" placeholder="Digite seu usuário" />
          </div>
          <div class="form-group">
            <label for="login-password">Senha:</label>
            <input type="password" id="login-password" placeholder="Digite sua senha" />
          </div>
          <button id="login-button" class="btn btn-primary">Entrar</button>
          <div id="login-error" class="error-message"></div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const usernameInput = this.container.querySelector('#login-username');
    const passwordInput = this.container.querySelector('#login-password');
    const loginButton = this.container.querySelector('#login-button');

    // Enter key support
    [usernameInput, passwordInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLogin();
        }
      });
    });

    loginButton.addEventListener('click', () => this.handleLogin());
  }

  async handleLogin() {
    const usernameInput = this.container.querySelector('#login-username');
    const passwordInput = this.container.querySelector('#login-password');
    const loginButton = this.container.querySelector('#login-button');
    const errorDiv = this.container.querySelector('#login-error');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Clear previous errors
    errorDiv.textContent = '';

    // Validation
    const usernameError = validateRequired(username, 'Usuário');
    const passwordError = validateRequired(password, 'Senha');

    if (usernameError || passwordError) {
      errorDiv.textContent = usernameError || passwordError || '';
      return;
    }

    // Loading state
    const resetButton = createLoadingButton(loginButton, '🔄 Entrando...');

    try {
      // Check admin credentials
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        stateManager.loginAsAdmin();
        return;
      }

      // Regular user login
      const response = await apiService.login(username, password);
      
      if (response.success) {
        const user = {
          nome: username,
          senha: password,
          tipo: response.tipo || 'Usuário',
          pontos: response.pontos || 0
        };
        
        stateManager.login(user, response.pontos || 0, user.tipo);
      } else {
        errorDiv.textContent = MESSAGES.LOGIN_ERROR;
      }
    } catch (error) {
      console.error('Login error:', error);
      errorDiv.textContent = MESSAGES.GENERIC_ERROR;
    } finally {
      resetButton();
    }
  }

  clearForm() {
    const usernameInput = this.container.querySelector('#login-username');
    const passwordInput = this.container.querySelector('#login-password');
    const errorDiv = this.container.querySelector('#login-error');

    usernameInput.value = '';
    passwordInput.value = '';
    errorDiv.textContent = '';
  }
}
