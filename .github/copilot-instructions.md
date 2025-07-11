# Instruções Copilot - Sistema de Gamificação Vite

## Sobre o Projeto

Este é um sistema moderno de gamificação de tarefas construído com **Vite** e **JavaScript ES6+**, migrado de uma versão HTML/CSS/JS original. O sistema oferece um ambiente completo de gestão de tarefas com pontuação, ranking, loja de prêmios e painel administrativo.

## Arquitetura

### Frontend (Vite + JavaScript)
- **Framework**: Vite com JavaScript ES6+
- **Arquitetura**: Componentes modulares com separação de responsabilidades
- **State Management**: Sistema próprio de gerenciamento de estado
- **Estilos**: CSS moderno com variáveis e design responsivo

### Backend
- **Plataforma**: Google Apps Script
- **Persistência**: Google Sheets
- **API**: RESTful endpoints para CRUD de dados

## Estrutura de Componentes

### Core Components
- `App.ts` - Aplicação principal e roteamento
- `LoginComponent.ts` - Autenticação de usuários
- `DashboardComponent.ts` - Dashboard principal

### Feature Components
- `TasksComponent.ts` - Gestão de tarefas
- `RewardsComponent.ts` - Loja de prêmios
- `RankingComponent.ts` - Sistema de ranking
- `HistoryComponent.ts` - Histórico de atividades
- `AdminPanelComponent.ts` - Painel administrativo

### Services
- `api.ts` - Comunicação com Google Apps Script
- `state.ts` - Gerenciamento de estado da aplicação

### Types
- Interfaces TypeScript para User, Task, Reward, etc.
- Tipos para API responses e estado da aplicação

## Funcionalidades Principais

### Sistema de Usuários
- **Login**: Suporte a admin e usuários regulares
- **CRUD**: Criação, edição e exclusão de usuários (admin)
- **Tipos**: Usuário comum e Administrador

### Sistema de Tarefas
- **Criação**: Administradores podem criar tarefas
- **Pontuação**: Cada tarefa tem valor em pontos
- **Conclusão**: Usuários ganham pontos ao completar

### Sistema de Pontos e Ranking
- **Pontuação**: Sistema de pontos por atividades
- **Ranking**: Classificação em tempo real
- **Badges**: Medalhas para top 3 posições

### Loja de Prêmios
- **Catálogo**: Lista de prêmios disponíveis
- **Resgate**: Troca de pontos por prêmios
- **Validação**: Verificação de pontos suficientes

### Histórico
- **Pessoal**: Usuários veem suas atividades
- **Global**: Administradores veem tudo
- **Filtros**: Por tipo de atividade

## Credenciais Padrão

### Administrador
- **Usuário**: `admin`
- **Senha**: `admin123`

## Scripts de Desenvolvimento

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build
- `npm run type-check` - Verificação de tipos

## Configuração

### Variáveis Importantes
- `CONFIG.API_URL` - URL do Google Apps Script
- `ADMIN_CREDENTIALS` - Credenciais do administrador

### Estrutura de Dados
O sistema utiliza Google Sheets com estrutura específica:
- Aba "Usuarios" - Dados dos usuários
- Aba "Tarefas" - Lista de tarefas
- Aba "Premios" - Catálogo de prêmios
- Aba "Historico" - Log de atividades

## Desenvolvimento

### Padrões de Código
- **TypeScript**: Tipagem forte em todos os componentes
- **Modularidade**: Componentes independentes e reutilizáveis
- **Responsabilidade única**: Cada arquivo tem propósito específico
- **State Management**: Estado centralizado com observadores

### Estilo e UX
- **Design responsivo**: Mobile-first approach
- **Componentes visuais**: Buttons, forms, cards padronizados
- **Feedback visual**: Loading states, success/error messages
- **Animações**: Transições suaves entre estados

### APIs e Integração
- **Async/Await**: Para todas as chamadas de API
- **Error handling**: Tratamento completo de erros
- **Loading states**: Feedback visual durante operações
- **Retry logic**: Para requests que falharem

## Troubleshooting Common Issues

### PowerShell Execution Policy
Se npm não executar, ajustar política:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### CORS Issues
Verificar configurações do Google Apps Script para permitir requests do domínio local.

### API Integration
Confirmar URL da API em `src/utils/config.ts` e testar endpoints manualmente.

## Future Enhancements

### Possíveis Melhorias
- **PWA**: Transformar em Progressive Web App
- **Real-time**: WebSockets para atualizações em tempo real
- **Notifications**: Sistema de notificações push
- **Analytics**: Dashboard de métricas e estatísticas
- **Multi-tenant**: Suporte a múltiplas organizações

### Tecnologias de Upgrade
- **Framework**: Migração para React/Vue se necessário
- **Backend**: Migração para Node.js/Express se escalar
- **Database**: PostgreSQL/MySQL para volumes maiores
- **Auth**: OAuth2/JWT para autenticação robusta

## Performance Considerations

### Otimizações Atuais
- **Vite**: Build otimizado com tree-shaking
- **Components**: Lazy loading onde aplicável
- **API calls**: Debouncing e caching local
- **CSS**: Variáveis CSS para performance

### Monitoramento
- **Console logs**: Sistema de debug integrado
- **Error tracking**: Logs de erro detalhados
- **Performance**: Métricas de carregamento

---

Este sistema é modular, escalável e pronto para extensões futuras mantendo compatibilidade com o backend Google Apps Script existente.
