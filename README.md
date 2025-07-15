# Sistema de Gamificação de Tarefas

Sistema completo de gamificação para gerenciamento de tarefas com pontuação, ranking e prêmios.

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado
- npm ou yarn

### Instalação
```bash
npm install
```

### Executar a Aplicação
```bash
# Iniciar backend (porta 3001)
npm run backend

# Iniciar frontend (porta 5173)
npm run dev
```

### Login
- **Admin**: admin / admin123
- **Usuários**: Criar via interface admin

## 📁 Estrutura
- `src/` - Frontend (Vite + Vanilla JS)
- `backend/` - API REST (Node.js + Express)
- `backend/data/` - Banco de dados JSON

## 🎮 Funcionalidades
- ✅ Autenticação de usuários
- ✅ Criação e gerenciamento de tarefas
- ✅ **Exclusão de tarefas (Admin apenas)**
- ✅ **Criação de prêmios (Admin apenas)**
- ✅ **Exclusão de prêmios (Admin apenas)**
- ✅ Sistema de pontuação
- ✅ Ranking de usuários
- ✅ Sistema de prêmios e resgate
- ✅ Histórico de atividades
- ✅ Interface administrativa completa

## 🔧 Scripts Disponíveis
- `npm run dev` - Inicia frontend
- `npm run backend` - Inicia backend
- `npm run build` - Build de produção
