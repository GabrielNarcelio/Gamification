// Dados simulados para desenvolvimento local quando a API não está disponível

export const mockData = {
  // Usuários simulados
  users: [
    {
      id: 1,
      nome: "admin",
      senha: "admin123",
      tipo: "Administrador",
      pontos: 0
    },
    {
      id: 2,
      nome: "João Silva",
      senha: "123456",
      tipo: "Usuario",
      pontos: 250
    },
    {
      id: 3,
      nome: "Maria Santos",
      senha: "654321",
      tipo: "Usuario",
      pontos: 180
    },
    {
      id: 4,
      nome: "Pedro Costa",
      senha: "abc123",
      tipo: "Usuario",
      pontos: 320
    }
  ],

  // Tarefas simuladas
  tasks: [
    {
      id: 1,
      titulo: "Completar projeto frontend",
      descricao: "Desenvolver interface do usuário para o sistema de gamificação",
      pontos: 50,
      ativa: true,
      criador: "admin"
    },
    {
      id: 2,
      titulo: "Revisar documentação",
      descricao: "Atualizar documentação técnica do projeto",
      pontos: 30,
      ativa: true,
      criador: "admin"
    },
    {
      id: 3,
      titulo: "Teste de integração",
      descricao: "Executar testes de integração entre componentes",
      pontos: 40,
      ativa: true,
      criador: "admin"
    },
    {
      id: 4,
      titulo: "Implementar responsividade",
      descricao: "Adaptar interface para dispositivos móveis",
      pontos: 35,
      ativa: true,
      criador: "admin"
    },
    {
      id: 5,
      titulo: "Otimizar performance",
      descricao: "Melhorar velocidade de carregamento da aplicação",
      pontos: 45,
      ativa: true,
      criador: "admin"
    }
  ],

  // Prêmios simulados
  rewards: [
    {
      id: 1,
      nome: "Vale Café",
      descricao: "Vale para café na cantina da empresa",
      pontos: 50,
      disponivel: true
    },
    {
      id: 2,
      nome: "Dia de Home Office",
      descricao: "Um dia adicional de trabalho remoto",
      pontos: 100,
      disponivel: true
    },
    {
      id: 3,
      nome: "Voucher Almoço",
      descricao: "Almoço grátis no restaurante parceiro",
      pontos: 80,
      disponivel: true
    },
    {
      id: 4,
      nome: "Curso Online",
      descricao: "Acesso a curso de capacitação profissional",
      pontos: 150,
      disponivel: true
    },
    {
      id: 5,
      nome: "Kit Escritório",
      descricao: "Kit com material de escritório personalizado",
      pontos: 120,
      disponivel: true
    },
    {
      id: 6,
      nome: "Tarde Livre",
      descricao: "Liberação antecipada em uma tarde",
      pontos: 90,
      disponivel: true
    }
  ],

  // Histórico simulado
  history: [
    {
      id: 1,
      usuario: "João Silva",
      acao: "Tarefa Concluída",
      detalhes: "Completar projeto frontend",
      pontos: 50,
      data: new Date().toISOString()
    },
    {
      id: 2,
      usuario: "Maria Santos",
      acao: "Prêmio Resgatado",
      detalhes: "Vale Café",
      pontos: -50,
      data: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      usuario: "Pedro Costa",
      acao: "Tarefa Concluída",
      detalhes: "Revisar documentação",
      pontos: 30,
      data: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 4,
      usuario: "João Silva",
      acao: "Prêmio Resgatado",
      detalhes: "Voucher Almoço",
      pontos: -80,
      data: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: 5,
      usuario: "Maria Santos",
      acao: "Tarefa Concluída",
      detalhes: "Teste de integração",
      pontos: 40,
      data: new Date(Date.now() - 345600000).toISOString()
    }
  ],

  // Ranking simulado
  ranking: [
    {
      posicao: 1,
      nome: "Pedro Costa",
      pontos: 320
    },
    {
      posicao: 2,
      nome: "João Silva",
      pontos: 250
    },
    {
      posicao: 3,
      nome: "Maria Santos",
      pontos: 180
    }
  ]
};

// Simulador de delays de rede
export const simulateNetworkDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Contadores para IDs únicos
let nextUserId = 100;
let nextTaskId = 100;
let nextRewardId = 100;
let nextHistoryId = 100;

export const generateId = (type) => {
  switch (type) {
    case 'user': return ++nextUserId;
    case 'task': return ++nextTaskId;
    case 'reward': return ++nextRewardId;
    case 'history': return ++nextHistoryId;
    default: return Date.now();
  }
};
