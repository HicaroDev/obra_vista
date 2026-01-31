# 🗄️ Backend - Obra Vista SaaS (PostgreSQL + Supabase)

## 📋 Conceito Geral

Sistema backend RESTful API construído com **Node.js + Express + Prisma ORM** conectado ao **PostgreSQL (Supabase)** para gerenciamento de obras de construção civil.

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Frontend      │
│  (React + TS)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   Backend API   │
│ (Express + JWT) │
└────────┬────────┘
         │ Prisma ORM
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Supabase)    │
└─────────────────┘
```

---

## 🗃️ Modelo de Dados (Schema Prisma)

### 1. **Usuarios** (Usuários do Sistema)
```prisma
model Usuario {
  id        Int      @id @default(autoincrement())
  nome      String
  email     String   @unique
  senha     String   // Hash bcrypt
  tipo      String   // "admin" | "gerente" | "usuario"
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relações
  equipesLideradas Equipe[]           @relation("LiderEquipe")
  membroEquipes    EquipeMembro[]
  atribuicoes      Atribuicao[]
  logs             Log[]
}
```

**Campos:**
- `id`: Identificador único
- `nome`: Nome completo do usuário
- `email`: Email único para login
- `senha`: Hash bcrypt da senha
- `tipo`: Tipo de usuário (admin, gerente, usuario)
- `ativo`: Status do usuário

**Relações:**
- Pode liderar várias equipes
- Pode ser membro de várias equipes
- Pode ter várias atribuições
- Gera logs de atividades

---

### 2. **Prestadores** (Empresas/Profissionais Externos)
```prisma
model Prestador {
  id        Int      @id @default(autoincrement())
  nome      String
  tipo      String   // "empresa" | "autonomo"
  contato   String?
  email     String?
  telefone  String?
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relações
  membroEquipes EquipeMembro[]
  atribuicoes   Atribuicao[]
}
```

**Campos:**
- `tipo`: Empresa ou autônomo
- `contato`: Nome do contato principal
- `email/telefone`: Dados de contato

**Relações:**
- Pode ser membro de várias equipes
- Pode ter várias atribuições

---

### 3. **Equipes** (Times de Trabalho)
```prisma
model Equipe {
  id          Int      @id @default(autoincrement())
  nome        String
  descricao   String?
  lider_id    Int
  ativa       Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relações
  lider       Usuario        @relation("LiderEquipe", fields: [lider_id], references: [id])
  membros     EquipeMembro[]
  atribuicoes Atribuicao[]
}
```

**Campos:**
- `nome`: Nome da equipe
- `descricao`: Descrição opcional
- `lider_id`: ID do líder (Usuario)
- `ativa`: Status da equipe

**Relações:**
- Tem um líder (Usuario)
- Tem vários membros (Usuarios + Prestadores)
- Pode ter várias atribuições

---

### 4. **EquipeMembro** (Membros das Equipes)
```prisma
model EquipeMembro {
  id            Int        @id @default(autoincrement())
  equipe_id     Int
  usuario_id    Int?
  prestador_id  Int?
  papel         String     // "lider" | "membro" | "suporte"
  createdAt     DateTime   @default(now())
  
  // Relações
  equipe        Equipe     @relation(fields: [equipe_id], references: [id], onDelete: Cascade)
  usuario       Usuario?   @relation(fields: [usuario_id], references: [id])
  prestador     Prestador? @relation(fields: [prestador_id], references: [id])
  
  @@unique([equipe_id, usuario_id])
  @@unique([equipe_id, prestador_id])
}
```

**Conceito:**
- Tabela de junção entre Equipes e Membros
- Membro pode ser Usuario OU Prestador
- Define o papel do membro na equipe

---

### 5. **Obras** (Projetos de Construção)
```prisma
model Obra {
  id          Int      @id @default(autoincrement())
  nome        String
  descricao   String?
  endereco    String?
  status      String   @default("planejamento") // "planejamento" | "em_andamento" | "pausada" | "concluida"
  data_inicio DateTime?
  data_fim    DateTime?
  orcamento   Decimal? @db.Decimal(15, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relações
  atribuicoes Atribuicao[]
}
```

**Campos:**
- `nome`: Nome da obra
- `endereco`: Localização
- `status`: Estado atual da obra
- `data_inicio/fim`: Período de execução
- `orcamento`: Valor estimado

**Relações:**
- Tem várias atribuições (tarefas)

---

### 6. **Atribuicoes** (Tarefas/Cards do Kanban)
```prisma
model Atribuicao {
  id          Int      @id @default(autoincrement())
  obra_id     Int
  equipe_id   Int?
  usuario_id  Int?
  prestador_id Int?
  titulo      String
  descricao   String?
  status      String   @default("a_fazer") // "a_fazer" | "em_andamento" | "revisao" | "concluido"
  prioridade  String   @default("media") // "baixa" | "media" | "alta" | "urgente"
  ordem       Int      @default(0)
  data_inicio DateTime?
  data_fim    DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relações
  obra        Obra       @relation(fields: [obra_id], references: [id], onDelete: Cascade)
  equipe      Equipe?    @relation(fields: [equipe_id], references: [id])
  usuario     Usuario?   @relation(fields: [usuario_id], references: [id])
  prestador   Prestador? @relation(fields: [prestador_id], references: [id])
  logs        Log[]
}
```

**Campos:**
- `titulo/descricao`: Informações da tarefa
- `status`: Coluna do Kanban
- `prioridade`: Nível de urgência
- `ordem`: Posição no Kanban (drag-and-drop)

**Relações:**
- Pertence a uma Obra
- Pode ser atribuída a Equipe, Usuario ou Prestador
- Gera logs de mudanças

---

### 7. **Logs** (Histórico de Atividades)
```prisma
model Log {
  id            Int        @id @default(autoincrement())
  usuario_id    Int
  atribuicao_id Int?
  acao          String     // "criou" | "atualizou" | "moveu" | "concluiu"
  descricao     String
  createdAt     DateTime   @default(now())
  
  // Relações
  usuario       Usuario    @relation(fields: [usuario_id], references: [id])
  atribuicao    Atribuicao? @relation(fields: [atribuicao_id], references: [id])
}
```

**Conceito:**
- Auditoria de todas as ações
- Rastreabilidade completa
- Histórico de mudanças no Kanban

---

## 🔐 Autenticação e Segurança

### JWT (JSON Web Tokens)
```javascript
// Payload do Token
{
  id: number,
  email: string,
  tipo: "admin" | "gerente" | "usuario",
  iat: timestamp,
  exp: timestamp (24h)
}
```

### Bcrypt
- Hash de senhas com salt rounds = 10
- Comparação segura no login

### Middleware de Autenticação
```javascript
// Protege rotas que precisam de autenticação
authMiddleware(req, res, next)

// Verifica permissões por tipo de usuário
roleMiddleware(['admin', 'gerente'])
```

---

## 🛣️ Endpoints da API

### **Auth** (`/api/auth`)
```
POST   /login       - Login (retorna token JWT)
POST   /register    - Cadastro de novo usuário
GET    /me          - Dados do usuário logado
POST   /logout      - Logout (invalida token)
```

### **Equipes** (`/api/equipes`)
```
GET    /                    - Listar todas equipes
GET    /:id                 - Buscar equipe por ID
POST   /                    - Criar nova equipe
PUT    /:id                 - Atualizar equipe
DELETE /:id                 - Deletar equipe
POST   /:id/membros         - Adicionar membro
DELETE /:id/membros/:membroId - Remover membro
```

### **Obras** (`/api/obras`)
```
GET    /                    - Listar todas obras
GET    /:id                 - Buscar obra por ID
POST   /                    - Criar nova obra
PUT    /:id                 - Atualizar obra
DELETE /:id                 - Deletar obra
GET    /:id/kanban          - Buscar atribuições (Kanban)
```

### **Atribuições** (`/api/atribuicoes`)
```
GET    /                    - Listar todas atribuições
GET    /obra/:obraId        - Listar por obra
POST   /                    - Criar atribuição
PUT    /:id                 - Atualizar atribuição
PATCH  /:id/status          - Atualizar status (Kanban)
PATCH  /:id/ordem           - Atualizar ordem (drag-drop)
DELETE /:id                 - Deletar atribuição
```

### **Logs** (`/api/logs`)
```
GET    /                    - Listar todos logs
GET    /usuario/:usuarioId  - Logs por usuário
GET    /atribuicao/:atribuicaoId - Logs por atribuição
```

---

## 🔄 Fluxo de Dados (Kanban)

### 1. **Carregar Kanban**
```
Frontend → GET /api/obras/:id/kanban
Backend → Prisma query com filtros
PostgreSQL → Retorna atribuições agrupadas por status
Backend → Formata dados para colunas
Frontend → Renderiza Kanban
```

### 2. **Drag and Drop**
```
Frontend → Usuário arrasta card
Frontend → PATCH /api/atribuicoes/:id/status
  Body: { status: "em_andamento", ordem: 2 }
Backend → Atualiza no banco
Backend → Cria log da ação
PostgreSQL → Confirma atualização
Frontend → Atualiza UI otimisticamente
```

---

## 📊 Queries Otimizadas

### Exemplo: Buscar Obra com Atribuições
```javascript
const obra = await prisma.obra.findUnique({
  where: { id: obraId },
  include: {
    atribuicoes: {
      include: {
        equipe: true,
        usuario: true,
        prestador: true,
      },
      orderBy: { ordem: 'asc' }
    }
  }
});
```

### Exemplo: Kanban Agrupado
```javascript
const kanban = {
  a_fazer: await prisma.atribuicao.findMany({
    where: { obra_id: obraId, status: 'a_fazer' },
    orderBy: { ordem: 'asc' }
  }),
  em_andamento: await prisma.atribuicao.findMany({
    where: { obra_id: obraId, status: 'em_andamento' },
    orderBy: { ordem: 'asc' }
  }),
  // ... outras colunas
};
```

---

## 🚀 Stack Tecnológica

### Core
- **Node.js** 18+
- **Express** 4.x
- **TypeScript** 5.x

### Database
- **PostgreSQL** 15+ (Supabase)
- **Prisma ORM** 5.x

### Autenticação
- **jsonwebtoken** (JWT)
- **bcryptjs** (Hash de senhas)

### Validação
- **express-validator**
- **zod** (schemas TypeScript)

### Utilitários
- **cors** (CORS policy)
- **dotenv** (variáveis de ambiente)
- **morgan** (logging HTTP)

---

## 🔧 Configuração

### 1. **Variáveis de Ambiente** (`.env`)
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/obra_vista?schema=public"

# JWT
JWT_SECRET="seu_secret_super_seguro_aqui"
JWT_EXPIRES_IN="24h"

# Server
PORT=3001
NODE_ENV="development"

# Supabase (opcional)
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="xxx"
```

### 2. **Prisma Schema** (`prisma/schema.prisma`)
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ... models aqui
```

### 3. **Migrations**
```bash
# Criar migration
npx prisma migrate dev --name init

# Aplicar migrations
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate
```

---

## 📁 Estrutura de Pastas

```
backend/
├── src/
│   ├── controllers/       # Lógica de negócio
│   │   ├── authController.ts
│   │   ├── equipesController.ts
│   │   ├── obrasController.ts
│   │   └── atribuicoesController.ts
│   ├── middleware/        # Middlewares
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/            # Rotas da API
│   │   ├── auth.ts
│   │   ├── equipes.ts
│   │   ├── obras.ts
│   │   └── atribuicoes.ts
│   ├── services/          # Serviços (Prisma queries)
│   │   ├── authService.ts
│   │   ├── equipesService.ts
│   │   └── obrasService.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   ├── utils/             # Utilitários
│   │   ├── jwt.ts
│   │   └── logger.ts
│   └── server.ts          # Entry point
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   └── migrations/        # Migrations
├── .env                   # Variáveis de ambiente
├── package.json
└── tsconfig.json
```

---

## 🎯 Próximos Passos de Implementação

### Fase 1: Setup Inicial ✅
- [x] Conceito definido
- [ ] Instalar dependências
- [ ] Configurar Prisma
- [ ] Criar schema do banco

### Fase 2: Autenticação
- [ ] Implementar JWT
- [ ] Criar endpoints de auth
- [ ] Middleware de autenticação

### Fase 3: CRUD Básico
- [ ] Equipes
- [ ] Obras
- [ ] Atribuições

### Fase 4: Kanban
- [ ] Endpoints de Kanban
- [ ] Drag and drop logic
- [ ] Logs de atividades

### Fase 5: Testes e Deploy
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Deploy no Supabase/Railway

---

## 💡 Conceitos Importantes

### 1. **Soft Delete vs Hard Delete**
- Usar campo `ativo` para soft delete
- Preservar dados históricos

### 2. **Transações**
- Usar Prisma transactions para operações críticas
- Garantir consistência dos dados

### 3. **Indexação**
- Criar índices em campos frequentemente consultados
- `email`, `obra_id`, `status`, etc.

### 4. **Paginação**
- Implementar paginação em listagens
- Usar `skip` e `take` do Prisma

### 5. **Validação**
- Validar dados no backend
- Retornar erros claros

---

**Status**: 📋 Conceito completo definido!
**Próximo**: Implementar backend com Prisma + PostgreSQL
