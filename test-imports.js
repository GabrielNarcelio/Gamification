console.log('Testando imports...');

try {
  // Teste de importação de helpers
  import('../src/utils/helpers.js').then(helpers => {
    console.log('✅ Helpers importados com sucesso');
    console.log('Funções disponíveis:', Object.keys(helpers));
    
    // Teste da função escapeHtml
    const testText = '<script>alert("test")</script>';
    const escaped = helpers.escapeHtml(testText);
    console.log('✅ escapeHtml funcionando:', escaped);
  }).catch(error => {
    console.error('❌ Erro ao importar helpers:', error);
  });

  // Teste de importação de estado
  import('../src/services/state.js').then(state => {
    console.log('✅ State manager importado com sucesso');
  }).catch(error => {
    console.error('❌ Erro ao importar state:', error);
  });

} catch (error) {
  console.error('❌ Erro geral:', error);
}
