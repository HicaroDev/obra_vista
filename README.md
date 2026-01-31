# 🏗️ Obra Vista SaaS

> Sistema completo de gestão de obras de construção civil com Kanban interativo

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Sobre o Projeto

**Obra Vista** é um sistema SaaS moderno para gestão de obras de construção civil, oferecendo:

- 🎯 **Kanban Board** - Gestão visual de tarefas com drag-and-drop
- 👥 **Gerenciamento de Equipes** - Organize times e prestadores
- 🏗️ **Controle de Obras** - Acompanhe múltiplos projetos
- 📊 **Dashboard Inteligente** - Métricas e estatísticas em tempo real
- 🔐 **Autenticação Segura** - JWT + Bcrypt
- 🌙 **Modo Escuro** - Interface adaptável
- 📱 **PWA Ready** - Funciona offline

---

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Acesse: http://localhost:5173

### Backend (Em breve)
```bash
cd backend
npm install
npm run dev
```
API: http://localhost:3001

---

## 📁 Estrutura do Projeto

```
Obra_vista/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── store/           # Zustand stores
│   │   ├── lib/             # API client
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilitários
│   └── package.json
│
├── backend/                  # Node.js + Express + Prisma
│   ├── src/
│   │   ├── controllers/     # Lógica de negócio
│   │   ├── routes/          # Rotas da API
│   │   ├── services/        # Serviços
│   │   ├── middleware/      # Middlewares
│   │   └── types/           # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma    # Schema do banco
│   └── package.json
│
├── BACKEND_CONCEPT.md        # 📘 Conceito completo do backend
├── FRONTEND_SUMMARY.md       # 📗 Resumo do frontend
├── SYSTEM_OVERVIEW.md        # 📊 Visão geral do sistema
└── README.md                 # 📖 Este arquivo
```

---

## 🎨 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 18.3 | UI Library |
| TypeScript | 5.0 | Type Safety |
| Vite | 6.0 | Build Tool |
| Tailwind CSS | 3.4 | Styling |
| Zustand | 5.0 | State Management |
| React Router | 7.1 | Routing |
| @hello-pangea/dnd | 17.0 | Drag & Drop |
| Lucide React | 0.468 | Icons |

### Backend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Node.js | 18+ | Runtime |
| Express | 4.x | Web Framework |
| TypeScript | 5.0 | Type Safety |
| Prisma | 5.x | ORM |
| PostgreSQL | 15+ | Database |
| JWT | - | Authentication |
| Bcrypt | - | Password Hashing |

---

## 📊 Modelo de Dados

```
Usuarios ──┬── Equipes (lider)
           ├── Equipes_Membros
           ├── Atribuicoes
           └── Logs

Prestadores ── Equipes_Membros
               Atribuicoes

Equipes ──┬── Equipes_Membros
          └── Atribuicoes

Obras ── Atribuicoes ── Logs
```

### Entidades Principais

- **Usuarios**: Usuários do sistema (admin, gerente, usuario)
- **Prestadores**: Empresas/profissionais externos
- **Equipes**: Times de trabalho
- **Obras**: Projetos de construção
- **Atribuicoes**: Tarefas do Kanban
- **Logs**: Auditoria de ações

---

## 🔐 Autenticação

### Fluxo JWT
1. Usuário faz login com email/senha
2. Backend valida credenciais (bcrypt)
3. Gera token JWT (válido por 24h)
4. Frontend armazena token (localStorage)
5. Todas as requisições incluem token no header

### Níveis de Acesso
- **Admin**: Acesso total ao sistema
- **Gerente**: Gerenciar equipes e obras
- **Usuario**: Ver e atualizar suas tarefas

---

## 🎯 Funcionalidades

### ✅ Implementadas (Frontend)
- [x] Sistema de autenticação (login/cadastro)
- [x] Layout responsivo com sidebar
- [x] Modo escuro/claro
- [x] Dashboard com estatísticas
- [x] API client completo
- [x] Gerenciamento de estado (Zustand)
- [x] TypeScript types completos

### 🔄 Em Desenvolvimento (Backend)
- [ ] API REST completa
- [ ] Autenticação JWT
- [ ] CRUD de Equipes
- [ ] CRUD de Obras
- [ ] CRUD de Atribuições
- [ ] Sistema de Logs

### 📋 Planejadas
- [ ] Kanban Board com drag-and-drop
- [ ] Gerenciamento de equipes
- [ ] Upload de arquivos
- [ ] Exportação PDF
- [ ] Notificações em tempo real
- [ ] Gráficos e relatórios
- [ ] PWA completo

---

## 📱 Screenshots

### Login
```
┌────────────────────────────────┐
│      🏗️ Obra Vista             │
│  Sistema de Gestão de Obras    │
│                                 │
│  📧 Email                       │
│  🔒 Senha                       │
│                                 │
│  [        ENTRAR        ]      │
└────────────────────────────────┘
```

### Dashboard
```
┌────────────────────────────────────────┐
│ ☰ Obra Vista    🌙 👤 João    🚪      │
├────────────────────────────────────────┤
│  📊 Dashboard                          │
│                                         │
│  [12 Obras] [8 Equipes] [34 Tarefas]  │
│                                         │
│  📋 Atividades Recentes                │
│  • Tarefa atualizada - há 1 hora      │
│  • Nova obra criada - há 2 horas      │
└────────────────────────────────────────┘
```

### Kanban (Planejado)
```
┌────────────────────────────────────────┐
│ 🏗️ Obra: Residencial Centro           │
├────────────────────────────────────────┤
│ [A Fazer] [Em Andamento] [Concluído]  │
│  Card 1    Card 3         Card 5      │
│  Card 2    Card 4         Card 6      │
└────────────────────────────────────────┘
```

---

## 🛠️ Configuração

### Variáveis de Ambiente

#### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

#### Backend (`.env`)
```env
DATABASE_URL="postgresql://user:pass@host:5432/obra_vista"
JWT_SECRET="seu_secret_super_seguro"
JWT_EXPIRES_IN="24h"
PORT=3001
NODE_ENV="development"
```

---

## 📚 Documentação

- 📘 [**BACKEND_CONCEPT.md**](BACKEND_CONCEPT.md) - Conceito completo do backend
  - Modelo de dados detalhado
  - Endpoints da API
  - Autenticação e segurança
  - Queries otimizadas
  
- 📗 [**FRONTEND_SUMMARY.md**](FRONTEND_SUMMARY.md) - Resumo do frontend
  - Estrutura de arquivos
  - Componentes implementados
  - Stores Zustand
  - Design system

- 📊 [**SYSTEM_OVERVIEW.md**](SYSTEM_OVERVIEW.md) - Visão geral do sistema
  - Arquitetura completa
  - Fluxo de dados
  - Diagramas visuais
  - Roadmap

---

## 🚀 Roadmap

### Fase 1: Frontend Base ✅ (CONCLUÍDO)
- [x] Setup Vite + React + TypeScript
- [x] Tailwind CSS + Modo escuro
- [x] Layout responsivo
- [x] Autenticação (UI)
- [x] Dashboard
- [x] API client

### Fase 2: Backend 🔄 (EM ANDAMENTO)
- [ ] Setup Express + Prisma
- [ ] Autenticação JWT
- [ ] CRUD completo
- [ ] Sistema de logs

### Fase 3: Kanban 📋 (PLANEJADO)
- [ ] Drag-and-drop
- [ ] Atualização em tempo real
- [ ] Filtros e busca

### Fase 4: Features Avançadas 🎨 (PLANEJADO)
- [ ] Upload de arquivos
- [ ] Exportação PDF
- [ ] Notificações
- [ ] Relatórios

### Fase 5: PWA e Deploy 🚀 (PLANEJADO)
- [ ] Service Worker
- [ ] Offline support
- [ ] Deploy (Vercel + Railway)
- [ ] CI/CD

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ para gestão eficiente de obras

---

## 📞 Suporte

- 📧 Email: suporte@obravista.com
- 📱 WhatsApp: (00) 00000-0000
- 🌐 Website: https://obravista.com

---

## 🙏 Agradecimentos

- React Team
- Tailwind CSS
- Prisma
- Supabase
- Comunidade Open Source

---

**Status do Projeto**: 🟢 Em Desenvolvimento Ativo

**Última Atualização**: Janeiro 2025

---

<div align="center">

### ⭐ Se este projeto foi útil, considere dar uma estrela!

[![GitHub stars](https://img.shields.io/github/stars/yourusername/obra-vista?style=social)](https://github.com/yourusername/obra-vista)

</div>
