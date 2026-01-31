# 🏗️ Backend - Obra Vista SaaS
# 🏗️ Backend - Obra Vista SaaS

> Sistema backend para gerenciamento de obras com PostgreSQL (Supabase)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Modelo do Banco de Dados](#modelo-do-banco-de-dados)
4. [Configuração](#configuração)
5. [API Endpoints](#api-endpoints)
6. [Autenticação](#autenticação)
7. [Instalação](#instalação)

---

## 🎯 Visão Geral

Sistema backend RESTful para gerenciar:
- ✅ Autenticação de usuários (JWT)
- ✅ Gestão de equipes e prestadores
- ✅ Controle de obras
- ✅ Sistema Kanban (atribuições)
- ✅ Logs de auditoria

**Stack:**
- Node.js + Express
- Prisma ORM
- PostgreSQL (Supabase)
- JWT + bcrypt

---

## 🏗️ Arquitetura

```
backend/
├── prisma/
│   ├── schema.prisma          # Modelo do banco
│   └── migrations/            # Migrações
├── src/
│   ├── config/
│   │   ├── database.js        # Prisma Client
│   │   └── env.js             # Variáveis ambiente
│   ├── middleware/
│   │   ├── auth.js            # JWT middleware
│   │   ├── errorHandler.js   # Tratamento erros
│   │   └── logger.js          # Log requests
│   ├── routes/
│   │   ├── auth.routes.js     # Autenticação
│   │   ├── equipes.routes.js  # Equipes
│   │   ├── obras.routes.js    # Obras
│   │   ├── atribuicoes.routes.js # Kanban
│   │   └── logs.routes.js     # Logs
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── equipes.controller.js
│   │   ├── obras.controller.js
│   │   ├── atribuicoes.controller.js
│   │   └── logs.controller.js
│   ├── services/
│   │   ├── auth.service.js    # Lógica autenticação
│   │   ├── equipes.service.js
│   │   ├── obras.service.js
│   │   └── atribuicoes.service.js
│   ├── utils/
│   │   ├── jwt.js             # Helpers JWT
│   │   └── validators.js      # Validações
│   └── server.js              # Entry point
├── .env                       # Variáveis ambiente
├── .env.example               # Template .env
└── package.json
```

---

## 🗄️ Modelo do Banco de Dados

### Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USUÁRIOS ====================
model Usuarios {
  id        Int      @id @default(autoincrement())
  nome      String
  email     String   @unique
  senha     String   // Hash bcrypt
  tipo      String   @default("usuario") // "admin" ou "usuario"
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relações
  equipes   Equipes_Membros[]
  logs      Logs[]
  
  @@map("usuarios")
}

// ==================== PRESTADORES ====================
model Prestadores {
  id            Int      @id @default(autoincrement())
  nome          String
  especialidade String
  telefone      String?
  email         String?
  cpf           String?  @unique
  ativo         Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relações
  equipes       Equipes_Membros[]
  
  @@map("prestadores")
}

// ==================== EQUIPES ====================
model Equipes {
  id        Int      @id @default(autoincrement())
  nome      String
  descricao String?
  cor       String?  @default("#3B82F6") // Cor para UI
  ativa     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relações
  membros      Equipes_Membros[]
  atribuicoes  Atribuicoes[]
  
  @@map("equipes")
}

// ==================== EQUIPES MEMBROS ====================
model Equipes_Membros {
  id            Int      @id @default(autoincrement())
  equipeId      Int
  usuarioId     Int?
  prestadorId   Int?
  papel         String   @default("membro") // "lider", "membro"
  createdAt     DateTime @default(now())
  
  // Relações
  equipe        Equipes      @relation(fields: [equipeId], references: [id], onDelete: Cascade)
  usuario       Usuarios?    @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  prestador     Prestadores? @relation(fields: [prestadorId], references: [id], onDelete: Cascade)
  
  @@unique([equipeId, usuarioId])
  @@unique([equipeId, prestadorId])
  @@map("equipes_membros")
}

// ==================== OBRAS ====================
model Obras {
  id          Int       @id @default(autoincrement())
  nome        String
  endereco    String
  descricao   String?
  status      String    @default("planejamento") // planejamento, em_andamento, concluido, pausado
  dataInicio  DateTime?
  dataFim     DateTime?
  orcamento   Decimal?  @db.Decimal(10, 2)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relações
  atribuicoes Atribuicoes[]
  
  @@map("obras")
}

// ==================== ATRIBUIÇÕES (KANBAN) ====================
model Atribuicoes {
  id          Int       @id @default(autoincrement())
  obraId      Int
  equipeId    Int
  titulo      String
  descricao   String?
  status      String    @default("a_fazer") // a_fazer, em_progresso, concluido
  prioridade  String    @default("media") // baixa, media, alta, urgente
  ordem       Int       @default(0) // Para ordenação no Kanban
  dataInicio  DateTime?
  dataFim     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relações
  obra        Obras     @relation(fields: [obraId], references: [id], onDelete: Cascade)
  equipe      Equipes   @relation(fields: [equipeId], references: [id], onDelete: Cascade)
  logs        Logs[]
  
  @@map("atribuicoes")
}

// ==================== LOGS ====================
model Logs {
  id            Int       @id @default(autoincrement())
  usuarioId     Int
  atribuicaoId  Int?
  acao          String    // "criou", "atualizou", "deletou", "moveu"
  entidade      String    // "obra", "equipe", "atribuicao"
  detalhes      String?   // JSON com detalhes da ação
  createdAt     DateTime  @default(now())
  
  // Relações
  usuario       Usuarios     @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  atribuicao    Atribuicoes? @relation(fields: [atribuicaoId], references: [id], onDelete: SetNull)
  
  @@map("logs")
}
```

### Diagrama de Relacionamentos

```
Usuarios ──┬─── Equipes_Membros ─── Equipes ─── Atribuicoes ─── Obras
           │                                                      
           └─── Logs ─── Atribuicoes
           
Prestadores ─── Equipes_Membros
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente (.env)

```env
# Database (Supabase)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# JWT
JWT_SECRET="sua_chave_secreta_super_segura_aqui"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"
```

### 2. Exemplo .env.example

```env
DATABASE_URL="postgresql://user:password@localhost:5432/obra_vista"
JWT_SECRET="change_this_secret_key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

---

## 📡 API Endpoints

### Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Cadastrar usuário | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Dados do usuário logado | ✅ |
| PUT | `/api/auth/profile` | Atualizar perfil | ✅ |

**Exemplo Request - Register:**
```json
POST /api/auth/register
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "tipo": "usuario"
}
```

**Exemplo Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@example.com",
      "tipo": "usuario"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Equipes

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/equipes` | Listar todas equipes | ✅ |
| GET | `/api/equipes/:id` | Detalhes da equipe | ✅ |
| POST | `/api/equipes` | Criar equipe | ✅ |
| PUT | `/api/equipes/:id` | Atualizar equipe | ✅ |
| DELETE | `/api/equipes/:id` | Deletar equipe | ✅ |
| POST | `/api/equipes/:id/membros` | Adicionar membro | ✅ |
| DELETE | `/api/equipes/:id/membros/:membroId` | Remover membro | ✅ |

**Exemplo Request - Criar Equipe:**
```json
POST /api/equipes
{
  "nome": "Equipe Elétrica",
  "descricao": "Responsável por instalações elétricas",
  "cor": "#F59E0B",
  "membros": [
    { "usuarioId": 1, "papel": "lider" },
    { "prestadorId": 2, "papel": "membro" }
  ]
}
```

---

### Obras

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/obras` | Listar todas obras | ✅ |
| GET | `/api/obras/:id` | Detalhes da obra | ✅ |
| POST | `/api/obras` | Criar obra | ✅ |
| PUT | `/api/obras/:id` | Atualizar obra | ✅ |
| DELETE | `/api/obras/:id` | Deletar obra | ✅ |
| GET | `/api/obras/:id/kanban` | Kanban da obra | ✅ |

**Exemplo Request - Criar Obra:**
```json
POST /api/obras
{
  "nome": "Edifício Residencial Centro",
  "endereco": "Rua Principal, 123",
  "descricao": "Construção de prédio residencial",
  "status": "planejamento",
  "dataInicio": "2024-02-01",
  "orcamento": 500000.00
}
```

---

### Atribuições (Kanban)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/atribuicoes` | Listar todas | ✅ |
| GET | `/api/atribuicoes/obra/:obraId` | Por obra | ✅ |
| POST | `/api/atribuicoes` | Criar atribuição | ✅ |
| PUT | `/api/atribuicoes/:id` | Atualizar | ✅ |
| PATCH | `/api/atribuicoes/:id/status` | Mudar status (drag) | ✅ |
| PATCH | `/api/atribuicoes/:id/ordem` | Reordenar | ✅ |
| DELETE | `/api/atribuicoes/:id` | Deletar | ✅ |

**Exemplo Request - Criar Atribuição:**
```json
POST /api/atribuicoes
{
  "obraId": 1,
  "equipeId": 1,
  "titulo": "Instalação elétrica 1º andar",
  "descricao": "Instalar pontos de luz e tomadas",
  "status": "a_fazer",
  "prioridade": "alta",
  "dataInicio": "2024-02-05"
}
```

**Exemplo Request - Mover Card (Drag & Drop):**
```json
PATCH /api/atribuicoes/5/status
{
  "status": "em_progresso",
  "ordem": 2
}
```

---

### Logs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/logs` | Histórico de ações | ✅ |
| GET | `/api/logs/usuario/:id` | Logs por usuário | ✅ |
| GET | `/api/logs/atribuicao/:id` | Logs por atribuição | ✅ |

---

## 🔐 Autenticação

### JWT Token

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload:**
```json
{
  "userId": 1,
  "email": "joao@example.com",
  "tipo": "usuario",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Middleware de Autenticação

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token não fornecido' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};
```

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
cd backend
npm install
```

**package.json:**
```json
{
  "name": "obra-vista-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "node prisma/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "prisma": "^5.8.0",
    "@prisma/client": "^5.8.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 2. Configurar Supabase

1. Criar projeto no Supabase
2. Copiar `DATABASE_URL` do Supabase
3. Adicionar no `.env`

**Formato URL Supabase:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 3. Executar Migrações

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar migrações
npm run prisma:migrate

# Abrir Prisma Studio (GUI)
npm run prisma:studio
```

### 4. Seed (Dados Iniciais)

```javascript
// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.usuarios.create({
    data: {
      nome: 'Administrador',
      email: 'admin@obravista.com',
      senha: hashedPassword,
      tipo: 'admin'
    }
  });
  
  console.log('✅ Admin criado:', admin.email);
  
  // Criar prestadores exemplo
  const prestador1 = await prisma.prestadores.create({
    data: {
      nome: 'Carlos Pedreiro',
      especialidade: 'Pedreiro',
      telefone: '(11) 98765-4321',
      email: 'carlos@example.com'
    }
  });
  
  console.log('✅ Prestador criado:', prestador1.nome);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

**Executar seed:**
```bash
npm run prisma:seed
```

### 5. Iniciar Servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

**Servidor rodando em:** `http://localhost:3001`

---

## 🧪 Testes

### Testar Endpoints com cURL

**1. Registrar usuário:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "senha": "senha123"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "senha": "senha123"
  }'
```

**3. Criar equipe (com token):**
```bash
curl -X POST http://localhost:3001/api/equipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Equipe Elétrica",
    "descricao": "Instalações elétricas"
  }'
```

---

## 🚀 Deploy

### Opções de Deploy

1. **Vercel** (Serverless)
2. **Railway** (Container)
3. **Render** (Container)
4. **Heroku** (Container)
5. **VPS** (DigitalOcean, AWS, etc.)

### Deploy no Railway (Recomendado)

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Iniciar projeto
railway init

# 4. Adicionar PostgreSQL
railway add

# 5. Deploy
railway up
```

---

## 📝 Checklist de Implementação

### Configuração Inicial
- [ ] Instalar dependências
- [ ] Configurar .env com Supabase
- [ ] Criar schema Prisma
- [ ] Executar migrações
- [ ] Executar seed

### Autenticação
- [ ] Implementar registro
- [ ] Implementar login
- [ ] Criar middleware JWT
- [ ] Testar endpoints auth

### CRUD Equipes
- [ ] Controller de equipes
- [ ] Routes de equipes
- [ ] Service de equipes
- [ ] Testar CRUD completo

### CRUD Obras
- [ ] Controller de obras
- [ ] Routes de obras
- [ ] Service de obras
- [ ] Testar CRUD completo

### CRUD Atribuições (Kanban)
- [ ] Controller de atribuições
- [ ] Routes de atribuições
- [ ] Service de atribuições
- [ ] Implementar drag & drop
- [ ] Testar movimentação

### Logs
- [ ] Controller de logs
- [ ] Routes de logs
- [ ] Middleware de logging
- [ ] Testar histórico

### Finalização
- [ ] Tratamento de erros global
- [ ] Validações de input
- [ ] Documentação API
- [ ] Testes de integração
- [ ] Deploy

---

## 🔧 Troubleshooting

### Erro: "Can't reach database server"
- Verificar se DATABASE_URL está correto
- Verificar se Supabase está ativo
- Testar conexão com `npx prisma db pull`

### Erro: "JWT malformed"
- Verificar se JWT_SECRET está no .env
- Verificar formato do token no header

### Erro: "Port already in use"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

---

## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [JWT.io](https://jwt.io/)

---

## 📄 Licença

MIT License - Obra Vista SaaS © 2024

---

**Desenvolvido com ❤️ para gestão eficiente de obras**
