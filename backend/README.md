# 🏗️ Obra Vista - Backend API

> Sistema backend RESTful para gerenciamento de obras com PostgreSQL (Supabase)

---

## 📋 Índice

- [Sobre](#sobre)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executar](#executar)
- [Endpoints](#endpoints)
- [Estrutura](#estrutura)
- [Deploy](#deploy)

---

## 🎯 Sobre

API RESTful completa para o sistema Obra Vista SaaS, incluindo:

- ✅ Autenticação JWT
- ✅ CRUD de Equipes, Obras e Atribuições
- ✅ Sistema Kanban com drag & drop
- ✅ Sistema de logs e auditoria
- ✅ Validação de dados
- ✅ Tratamento de erros
- ✅ Documentação completa

---

## 🛠️ Tecnologias

- **Node.js** 18+
- **Express** 4.18 - Framework web
- **Prisma** 5.8 - ORM
- **PostgreSQL** - Banco de dados (Supabase)
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **express-validator** - Validação de dados
- **Morgan** - Logger HTTP
- **CORS** - Cross-Origin Resource Sharing

---

## 📦 Instalação

### 1. Instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres"

# JWT
JWT_SECRET="sua_chave_secreta_super_segura"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:5173"
```

### 3. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings** → **Database**
4. Copie a **Connection String** (modo Pooler)
5. Cole no `.env` como `DATABASE_URL`

### 4. Executar migrações do Prisma

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar tabelas no banco
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio
npm run prisma:studio
```

### 5. Popular banco com dados iniciais

```bash
npm run prisma:seed
```

**Credenciais criadas:**
- **Admin**: admin@obravista.com / admin123
- **Usuário**: joao@obravista.com / user123

---

## ⚙️ Configuração

### Scripts disponíveis

```json
{
  "dev": "nodemon src/server.js",           // Desenvolvimento
  "start": "node src/server.js",            // Produção
  "prisma:generate": "prisma generate",     // Gerar Prisma Client
  "prisma:migrate": "prisma migrate dev",   // Criar migrações
  "prisma:studio": "prisma studio",         // GUI do banco
  "prisma:seed": "node prisma/seed.js"      // Popular banco
}
```

---

## 🚀 Executar

### Desenvolvimento

```bash
npm run dev
```

Servidor rodando em: `http://localhost:3001`

### Produção

```bash
npm start
```

---

## 📡 Endpoints

### Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registrar usuário | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Dados do usuário | ✅ |
| PUT | `/api/auth/profile` | Atualizar perfil | ✅ |
| POST | `/api/auth/logout` | Logout | ✅ |

### Equipes

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/equipes` | Listar equipes | ✅ |
| GET | `/api/equipes/:id` | Buscar equipe | ✅ |
| POST | `/api/equipes` | Criar equipe | ✅ |
| PUT | `/api/equipes/:id` | Atualizar equipe | ✅ |
| DELETE | `/api/equipes/:id` | Deletar equipe | ✅ |
| POST | `/api/equipes/:id/membros` | Adicionar membro | ✅ |
| DELETE | `/api/equipes/:id/membros/:membroId` | Remover membro | ✅ |

### Obras

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/obras` | Listar obras | ✅ |
| GET | `/api/obras/:id` | Buscar obra | ✅ |
| GET | `/api/obras/:id/kanban` | Kanban da obra | ✅ |
| POST | `/api/obras` | Criar obra | ✅ |
| PUT | `/api/obras/:id` | Atualizar obra | ✅ |
| DELETE | `/api/obras/:id` | Deletar obra | ✅ |

### Atribuições (Kanban)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/atribuicoes` | Listar atribuições | ✅ |
| GET | `/api/atribuicoes/:id` | Buscar atribuição | ✅ |
| GET | `/api/atribuicoes/obra/:obraId` | Por obra | ✅ |
| POST | `/api/atribuicoes` | Criar atribuição | ✅ |
| PUT | `/api/atribuicoes/:id` | Atualizar | ✅ |
| PATCH | `/api/atribuicoes/:id/status` | Mudar status | ✅ |
| PATCH | `/api/atribuicoes/:id/ordem` | Reordenar | ✅ |
| DELETE | `/api/atribuicoes/:id` | Deletar | ✅ |

### Logs

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/logs` | Listar logs | ✅ |
| GET | `/api/logs/usuario/:id` | Por usuário | ✅ |
| GET | `/api/logs/atribuicao/:id` | Por atribuição | ✅ |
| GET | `/api/logs/estatisticas` | Estatísticas | ✅ |

---

## 📁 Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma          # Schema do banco
│   └── seed.js                # Dados iniciais
├── src/
│   ├── config/
│   │   └── database.js        # Prisma Client
│   ├── middleware/
│   │   ├── auth.js            # JWT middleware
│   │   ├── errorHandler.js   # Tratamento de erros
│   │   └── logger.js          # Logger HTTP
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── equipes.routes.js
│   │   ├── obras.routes.js
│   │   ├── atribuicoes.routes.js
│   │   └── logs.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── equipes.controller.js
│   │   ├── obras.controller.js
│   │   ├── atribuicoes.controller.js
│   │   └── logs.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── equipes.service.js
│   │   ├── obras.service.js
│   │   ├── atribuicoes.service.js
│   │   └── logs.service.js
│   ├── utils/
│   │   └── jwt.js             # Helpers JWT
│   └── server.js              # Entry point
├── .env                       # Variáveis de ambiente
├── .env.example               # Template .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🧪 Testar Endpoints

### Com cURL

**1. Registrar:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"João","email":"joao@test.com","senha":"123456"}'
```

**2. Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@obravista.com","senha":"admin123"}'
```

**3. Listar obras (com token):**
```bash
curl http://localhost:3001/api/obras \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Com Postman/Insomnia

1. Importe a collection (em breve)
2. Configure a variável `{{baseUrl}}` = `http://localhost:3001`
3. Faça login e copie o token
4. Use o token no header `Authorization: Bearer TOKEN`

---

## 🚀 Deploy

### Opção 1: Railway (Recomendado)

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

### Opção 2: Render

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático

### Opção 3: Vercel (Serverless)

```bash
vercel --prod
```

---

## 🔧 Troubleshooting

### Erro: "Can't reach database server"

✅ Verifique se `DATABASE_URL` está correto no `.env`  
✅ Teste a conexão: `npx prisma db pull`  
✅ Verifique se o Supabase está ativo

### Erro: "JWT malformed"

✅ Verifique se `JWT_SECRET` está no `.env`  
✅ Verifique formato do token: `Bearer TOKEN`

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

MIT License - Obra Vista © 2024

---

**Desenvolvido com ❤️ para gestão eficiente de obras**
