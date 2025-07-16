// Exemplo de uso do novo sistema de cache automático
// Adicione este código ao console do navegador para testar

console.log('🧪 Testando sistema de cache automático baseado em estado...');

// 1. Verificar se o StateManager está disponível
if (typeof stateManager !== 'undefined') {
  console.log('✅ StateManager disponível');
  
  // 2. Verificar estado atual
  console.log('📊 Estado atual:', stateManager.getState());
  
  // 3. Testar limpeza automática por tipo de mudança
  console.log('🧹 Testando limpeza automática para diferentes tipos de mudança:');
  
  // Simular conclusão de tarefa
  setTimeout(() => {
    console.log('🎯 Simulando conclusão de tarefa...');
    stateManager.onTaskCompleted();
  }, 2000);
  
  // Simular criação de recompensa
  setTimeout(() => {
    console.log('🎁 Simulando criação de recompensa...');
    stateManager.onRewardCreated();
  }, 4000);
  
  // Simular mudança de pontos
  setTimeout(() => {
    console.log('💰 Simulando mudança de pontos...');
    const currentPoints = stateManager.getUserPoints();
    stateManager.updatePoints(currentPoints + 100);
  }, 6000);
  
  // 4. Demonstrar controle manual do cache cleanup
  setTimeout(() => {
    console.log('⚙️ Desativando limpeza automática...');
    stateManager.setCacheCleanupEnabled(false);
    
    setTimeout(() => {
      console.log('⚙️ Reativando limpeza automática...');
      stateManager.setCacheCleanupEnabled(true);
    }, 2000);
  }, 8000);
  
} else {
  console.error('❌ StateManager não encontrado');
}

// 5. Demonstrar como usar nos componentes
console.log(`
📖 Como usar o novo sistema nos componentes:

// Ao invés de:
stateManager.triggerDataRefresh();

// Use métodos específicos:
stateManager.onTaskCompleted();     // Limpa cache de tarefas e histórico
stateManager.onRewardRedeemed();    // Limpa cache de recompensas e histórico  
stateManager.onUserUpdated();       // Limpa cache de usuários e ranking
stateManager.onAssignmentChanged(); // Limpa cache de atribuições e tarefas

// Para controle manual:
stateManager.setCacheCleanupEnabled(false); // Desativar
stateManager.setCacheCleanupEnabled(true);  // Reativar
`);
