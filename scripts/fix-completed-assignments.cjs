// Script para corrigir atribuições que já foram concluídas

const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../backend/data/database.json');

async function fixCompletedAssignments() {
  try {
    console.log('🔄 Carregando dados do banco...');
    const data = JSON.parse(await fs.readFile(DB_PATH, 'utf8'));
    
    if (!data.assignments || !data.history) {
      console.log('❌ Estrutura do banco inválida');
      return;
    }
    
    console.log(`📋 Encontradas ${data.assignments.length} atribuições`);
    console.log(`📚 Encontradas ${data.history.length} entradas no histórico`);
    
    // Encontrar todas as tarefas completadas por usuário
    const completedTasks = data.history.filter(h => h.type === 'task_completed');
    console.log(`✅ Encontradas ${completedTasks.length} tarefas concluídas no histórico`);
    
    let fixedCount = 0;
    
    // Para cada atribuição, verificar se a tarefa foi concluída
    for (const assignment of data.assignments) {
      if (assignment.status === 'assigned') {
        // Procurar se esta tarefa foi concluída por este usuário
        const completion = completedTasks.find(task => 
          task.details?.taskId === assignment.taskId && 
          task.userId === assignment.userId
        );
        
        if (completion) {
          console.log(`🔧 Corrigindo atribuição: Tarefa ${assignment.taskId} do usuário ${assignment.userId}`);
          assignment.status = 'completed';
          assignment.completedAt = completion.timestamp;
          assignment.completedBy = assignment.userId;
          fixedCount++;
        }
      }
    }
    
    if (fixedCount > 0) {
      console.log(`💾 Salvando ${fixedCount} correções...`);
      await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
      console.log(`✅ ${fixedCount} atribuições corrigidas com sucesso!`);
    } else {
      console.log('✅ Todas as atribuições já estão corretas!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir atribuições:', error);
  }
}

// Executar o script
if (require.main === module) {
  fixCompletedAssignments();
}
