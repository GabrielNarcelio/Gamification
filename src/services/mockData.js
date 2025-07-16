// Dados simulados para desenvolvimento local quando a API não está disponível

export const mockData = {
  // Usuários simulados
  users: [
    {
      id: "1",
      username: "admin",
      password: "admin123",
      name: "Administrador",
      email: "admin@sistema.com",
      type: "admin",
      points: 0
    },
    {
      id: "2",
      username: "joao",
      password: "123456",
      name: "João Silva",
      email: "joao@sistema.com",
      type: "user",
      points: 250
    },
    {
      id: "3",
      username: "maria",
      password: "654321",
      name: "Maria Santos",
      email: "maria@sistema.com",
      type: "user",
      points: 180
    },
    {
      id: "4",
      username: "pedro",
      password: "abc123",
      name: "Pedro Costa",
      email: "pedro@sistema.com",
      type: "user",
      points: 320
    }
  ],

  // Tarefas simuladas
  tasks: [
    {
      id: "1",
      title: "Completar projeto frontend",
      description: "Desenvolver interface do usuário para o sistema de gamificação",
      points: 50,
      category: "Desenvolvimento",
      active: true,
      createdBy: "admin"
    },
    {
      id: "2",
      title: "Revisar documentação",
      description: "Atualizar documentação técnica do projeto",
      points: 30,
      category: "Documentação",
      active: true,
      createdBy: "admin"
    },
    {
      id: "3",
      title: "Teste de integração",
      description: "Executar testes de integração entre componentes",
      points: 40,
      category: "Qualidade",
      active: true,
      createdBy: "admin"
    },
    {
      id: "4",
      title: "Implementar responsividade",
      description: "Adaptar interface para dispositivos móveis",
      points: 35,
      category: "UI/UX",
      active: true,
      createdBy: "admin"
    },
    {
      id: "5",
      title: "Otimizar performance",
      description: "Melhorar velocidade de carregamento das páginas",
      points: 45,
      category: "Performance",
      active: true,
      createdBy: "admin"
    }
  ],

  // Prêmios simulados
  rewards: [
    {
      id: "1",
      title: "Vale Café",
      description: "Vale para café na cantina da empresa",
      cost: 50,
      category: "Alimentação",
      stock: 10,
      available: true
    },
    {
      id: "2",
      title: "Dia de Home Office",
      description: "Um dia adicional de trabalho remoto",
      cost: 100,
      category: "Benefícios",
      stock: 5,
      available: true
    },
    {
      id: "3",
      title: "Voucher Almoço",
      description: "Almoço grátis no restaurante parceiro",
      cost: 80,
      category: "Alimentação",
      stock: 8,
      available: true
    },
    {
      id: "4",
      title: "Curso Online",
      description: "Acesso a curso de capacitação profissional",
      cost: 150,
      category: "Educação",
      stock: 3,
      available: true
    },
    {
      id: "5",
      title: "Kit Escritório",
      description: "Kit com material de escritório personalizado",
      cost: 120,
      category: "Material",
      stock: 6,
      available: true
    },
    {
      id: "6",
      title: "Tarde Livre",
      description: "Liberação antecipada em uma tarde",
      cost: 90,
      category: "Benefícios",
      stock: 4,
      available: true
    }
  ],

  // Histórico simulado
  history: [
    {
      id: 1,
      userId: "2",
      userName: "João Silva",
      type: "task_completed",
      description: "Completou a tarefa: Completar projeto frontend",
      points: 50,
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      userId: "3",
      userName: "Maria Santos",
      type: "reward_redeemed",
      description: "Resgatou o prêmio: Vale Café",
      points: -50,
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      userId: "4",
      userName: "Pedro Costa",
      type: "task_completed",
      description: "Completou a tarefa: Revisar documentação",
      points: 30,
      timestamp: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 4,
      userId: "2",
      userName: "João Silva",
      type: "reward_redeemed",
      description: "Resgatou o prêmio: Voucher Almoço",
      points: -80,
      timestamp: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: 5,
      userId: "3",
      userName: "Maria Santos",
      type: "task_completed",
      description: "Completou a tarefa: Teste de integração",
      points: 40,
      timestamp: new Date(Date.now() - 345600000).toISOString()
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
