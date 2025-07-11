# Sistema de Gamificação de Tarefas - Versão Moderna

![Versão](https:/3. **Configure a URL da API**:
   - Abra `src/utils/config.js`
   - Atua## 📋 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build para produção
- `npm run preview` - Visualiza o build de produção run d2. **API não responde**: Confirme se a URL da API está correta em `config.js`v` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build para produção
- `npm run preview` - Visualiza o build de produção `API_URL` com sua URL do Google Apps Scriptg.shields.io/badge/versão-2.0.0-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)

Um sistema moderno de gamificação de tarefas construído com **Vite**, **JavaScript ES6+** e arquitetura modular escalável. Integrado com **Google Apps Script** para persistência de dados.

## 🚀 Características

- ✅ **Arquitetura Moderna**: Construído com Vite e JavaScript ES6+ Modules
- 🏗️ **Separação de Responsabilidades**: Componentes modulares e serviços organizados
- 🎯 **Sistema de Pontuação**: Ganhe pontos completando tarefas
- 🏆 **Ranking em Tempo Real**: Competição saudável entre usuários
- 🎁 **Loja de Prêmios**: Resgate prêmios com seus pontos
- 👨‍💼 **Painel Administrativo**: Gestão completa de usuários e sistema
- 📱 **Design Responsivo**: Interface moderna que funciona em todos os dispositivos
- ☁️ **Integração com Google Sheets**: Dados persistentes via Google Apps Script

## 🛠️ Tecnologias Utilizadas

- **Frontend**: JavaScript ES6+, HTML5, CSS3
- **Build Tool**: Vite
- **Backend**: Google Apps Script
- **Persistência**: Google Sheets
- **Arquitetura**: MVC com State Management

## 📁 Estrutura do Projeto

\`\`\`
src/
├── components/          # Componentes da interface
│   ├── LoginComponent.js
│   ├── DashboardComponent.js
│   ├── TasksComponent.js
│   ├── RewardsComponent.js
│   ├── RankingComponent.js
│   ├── HistoryComponent.js
│   └── AdminPanelComponent.js
├── services/           # Serviços e integração com API
│   ├── api.js         # Comunicação com Google Apps Script
│   └── state.js       # Gerenciamento de estado
├── utils/             # Utilitários e configurações
│   ├── config.js      # Configurações da aplicação
│   └── helpers.js     # Funções auxiliares
├── styles/            # Estilos organizados
│   ├── main.css       # Estilos base e variáveis
│   ├── login.css      # Estilos do login
│   ├── dashboard.css  # Estilos do dashboard
│   └── components.css # Estilos dos componentes
├── App.js            # Aplicação principal
└── main.js          # Ponto de entrada
\`\`\`

## 🚀 Como Executar

### Pré-requisitos

- Node.js 16+ instalado
- Google Apps Script configurado

### Instalação

1. **Clone o repositório** (ou navegue até o diretório):
   \`\`\`bash
   cd c:/Users/lenovo/Desktop/pogramaVite
   \`\`\`

2. **Instale as dependências**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure a URL da API**:
   - Abra \`src/utils/config.ts\`
   - Atualize \`API_URL\` com sua URL do Google Apps Script

4. **Execute em modo de desenvolvimento**:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Acesse a aplicação**:
   - Abra [http://localhost:3000](http://localhost:3000)

### Build para Produção

\`\`\`bash
npm run build
npm run preview
\`\`\`

## 👨‍💼 Credenciais de Administrador

- **Usuário**: \`admin\`
- **Senha**: \`admin123\`

## 🔧 Configuração do Google Apps Script

O sistema requer um Google Apps Script configurado. Consulte os arquivos de configuração na pasta original para:

- \`google-apps-script-updates.js\` - Código do backend
- \`estruturar-planilha.js\` - Script para estruturar a planilha
- \`CONFIGURAR-PLANILHA.md\` - Guia de configuração

## 📖 Como Usar

### Para Usuários

1. **Login**: Use suas credenciais para acessar o sistema
2. **Tarefas**: Visualize e complete tarefas disponíveis
3. **Pontos**: Ganhe pontos ao completar tarefas
4. **Loja**: Use seus pontos para resgatar prêmios
5. **Ranking**: Veja sua posição no ranking
6. **Histórico**: Acompanhe suas atividades

### Para Administradores

1. **Painel Admin**: Acesso completo ao sistema
2. **Usuários**: Criar, editar e excluir usuários
3. **Tarefas**: Criar novas tarefas para os usuários
4. **Monitoramento**: Visualizar histórico completo do sistema
5. **Estruturação**: Configurar automaticamente a planilha

## 🔄 Migração da Versão Anterior

Este projeto é uma migração moderna do sistema original. Principais melhorias:

- ✅ **JavaScript Moderno**: ES6+ com tipagem via JSDoc
- ✅ **Arquitetura Modular**: Componentes organizados e reutilizáveis
- ✅ **State Management**: Gerenciamento centralizado de estado
- ✅ **Build Moderno**: Vite para desenvolvimento rápido
- ✅ **CSS Organizado**: Estilos modulares e responsivos
- ✅ **Melhor UX**: Interface mais intuitiva e moderna

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (\`git checkout -b feature/nova-feature\`)
3. Commit suas mudanças (\`git commit -m 'Adiciona nova feature'\`)
4. Push para a branch (\`git push origin feature/nova-feature\`)
5. Abra um Pull Request

## 📝 Scripts Disponíveis

- \`npm run dev\` - Inicia o servidor de desenvolvimento
- \`npm run build\` - Gera build para produção
- \`npm run preview\` - Visualiza o build de produção
- \`npm run type-check\` - Verifica tipos TypeScript

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de CORS**: Verifique se o Google Apps Script está configurado corretamente
2. **API não responde**: Confirme se a URL da API está correta em \`config.ts\`
3. **Planilha não encontrada**: Use o botão de estruturação automática no painel admin

### Logs de Debug

O sistema inclui logs detalhados no console do navegador para facilitar o debug.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo \`LICENSE\` para mais detalhes.

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- \`GUIA-FINAL.md\` - Guia completo de uso
- \`CONFIGURAR-PLANILHA.md\` - Configuração do backend
- Issues do GitHub para reportar bugs

---

**Desenvolvido com ❤️ usando tecnologias modernas**
