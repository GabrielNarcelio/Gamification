// Arquivo principal da aplicação

import { App } from './App.js';
import './styles/main.css';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    throw new Error('Container #app não encontrado no DOM');
  }

  // Initialize the main application
  new App(appContainer);
  
  console.log('🚀 Sistema de Gamificação de Tarefas inicializado!');
});
