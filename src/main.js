// Arquivo principal da aplicação

import { App } from './App.js';
// Carregar todos os CSS individualmente para garantir
import './styles/main.css';
import './styles/login.css';
import './styles/dashboard.css';
import './styles/components.css';
import './styles/forms.css';
import './styles/emoji-picker.css';
import './utils/pwa-manager.js'; // ✅ REABILITADO

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    throw new Error('Container #app não encontrado no DOM');
  }

  // Initialize the main application
  new App(appContainer);
  
  // Debug functions for console
  window.debugLogin = async () => {
    console.log('🔍 Debug Login State:');
    const { stateManager } = await import('./services/state.js');
    console.log('  Current User:', stateManager.getCurrentUser());
    console.log('  User Type:', stateManager.getState().userType);
    console.log('  Is Admin:', stateManager.isAdmin());
    console.log('  Full State:', stateManager.getState());
  };
  
  window.forceAdminLogin = async () => {
    console.log('🔑 Forcing admin login...');
    const { stateManager } = await import('./services/state.js');
    stateManager.loginAsAdmin();
    console.log('✅ Admin login forced. State:', stateManager.getState());
  };
  
  window.testAchievementButton = () => {
    const button = document.querySelector('#btn-new-achievement');
    console.log('🎯 Testing achievement button:');
    console.log('  Button exists:', !!button);
    if (button) {
      console.log('  Button:', button);
      console.log('  Clicking button...');
      button.click();
    }
  };
  
  window.autoFixAchievements = async () => {
    console.log('🔧 Auto-fixing achievement system...');
    if (window.achievementsComponent && typeof window.achievementsComponent.autoFixSystem === 'function') {
      return await window.achievementsComponent.autoFixSystem();
    } else {
      console.error('❌ AchievementsComponent not available');
    }
  };
  
  window.testCompleteAchievementSystem = async () => {
    console.log('🏆 Testing Complete Achievement System...');
    
    // 1. Verificar se está logado
    const currentUser = stateManager.getCurrentUser();
    if (!currentUser) {
      console.error('❌ User not logged in. Please login first.');
      return;
    }
    
    console.log('✅ User logged in:', currentUser.name);
    
    // 2. Testar carregamento de conquistas
    if (window.achievementsComponent) {
      try {
        await window.achievementsComponent.loadAchievements();
        console.log('✅ Achievements loaded successfully');
        
        // 3. Testar verificação automática
        if (currentUser.type !== 'admin') {
          await window.achievementsComponent.checkAchievements();
          console.log('✅ Achievement check completed');
        }
        
        // 4. Se for admin, testar modal
        if (currentUser.type === 'admin') {
          const button = document.querySelector('#btn-new-achievement');
          if (button) {
            console.log('✅ Admin: New achievement button found');
            
            // Testar clique no botão
            button.click();
            setTimeout(() => {
              const modal = document.querySelector('#achievement-modal');
              if (modal && modal.style.display === 'flex') {
                console.log('✅ Admin: Modal opened successfully');
                
                // Fechar modal
                const closeBtn = modal.querySelector('#close-achievement-modal');
                if (closeBtn) closeBtn.click();
                console.log('✅ Admin: Modal closed successfully');
              } else {
                console.error('❌ Admin: Modal did not open');
              }
            }, 200);
          } else {
            console.error('❌ Admin: New achievement button not found');
          }
        }
        
        console.log('🎉 Achievement system test completed successfully!');
        
      } catch (error) {
        console.error('❌ Error during achievement system test:', error);
      }
    } else {
      console.error('❌ AchievementsComponent not available');
    }
  };
  
  console.log('🛠️ Debug functions available: debugLogin(), forceAdminLogin(), testAchievementButton(), autoFixAchievements(), testCompleteAchievementSystem()');
  
  // Esconder loading inicial
  const initialLoading = document.getElementById('initial-loading');
  if (initialLoading) {
    initialLoading.style.opacity = '0';
    setTimeout(() => initialLoading.remove(), 300);
  }
  
  console.log('🚀 Sistema de Gamificação de Tarefas inicializado!');
  console.log('🎨 CSS carregado via JavaScript import (sem Service Worker)');
  
  // Verificar se CSS está carregado
  setTimeout(() => {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    const hasViteCSS = !!document.querySelector('style[data-vite-dev-id*="main.css"]');
    const hasAnyCSS = document.querySelectorAll('style, link[rel="stylesheet"]').length > 0;
    
    console.log('🔍 CSS Status:', {
      fontFamily: computedStyle.fontFamily,
      backgroundColor: computedStyle.backgroundColor,
      hasViteCSS: hasViteCSS,
      hasAnyCSS: hasAnyCSS,
      totalStyleTags: document.querySelectorAll('style').length,
      totalLinkTags: document.querySelectorAll('link[rel="stylesheet"]').length
    });
    
    // Se não há CSS, forçar reload
    if (!hasViteCSS && !hasAnyCSS) {
      console.warn('⚠️ CSS não carregado - tentando reload...');
      setTimeout(() => window.location.reload(), 1000);
    }
  }, 1000);
});

// Adicionar handlers globais para PWA
window.addEventListener('load', () => {
  // Esconder splash screen se existir
  const splash = document.querySelector('.app-loading');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 300);
  }
});

// Performance monitoring para PWA
if ('performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('⚡ Performance:', {
      loadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
      domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
      networkTime: Math.round(perfData.responseEnd - perfData.requestStart)
    });
  });
}
