# 🚀 Setup Rápido - Obra Vista Backend

> Guia passo a passo para configurar o backend em 5 minutos

---

## ✅ Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Terminal/CMD aberto

---

## 📝 Passo a Passo

### 1️⃣ Instalar Dependências (1 min)

```bash
cd backend
npm install
```

Aguarde a instalação de todas as dependências...

---

### 2️⃣ Configurar Supabase (2 min)

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Faça login (GitHub, Google, etc.)
4. Clique em **"New Project"**
5. Preencha:
   - **Name**: obra-vista
   - **Database Password**: Crie uma senha forte (anote!)
   - **Region**: Escolha o mais próximo
6. Clique em **"Create new project"**
7. Aguarde ~2 minutos (criação do projeto)

---

### 3️⃣ Copiar Connection String (30 seg)

1. No Supabase, vá em **Settings** (⚙️) → **Database**
2. Role até **Connection string**
3. Selecione a aba **"URI"**
4. Copie a string que começa com `postgresql://`
5. **IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha que você criou

Exemplo:
```
postgresql://postgres.abcdefgh:SUA_SENHA_AQUI@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

### 4️⃣ Configurar .env (30 seg)

Edite o arquivo `backend/.env` e cole sua connection string:

```env
DATABASE_URL="postgresql://postgres.abcdefgh:SUA_SENHA@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

JWT_SECRET="obra_vista_secret_2024_change_in_production"
JWT_EXPIRES_IN="7d"

PORT=3001
NODE_ENV="development"

FRONTEND_URL="http://localhost:5173"
```

**Salve o arquivo!**

---

### 5️⃣ Criar Tabelas no Banco (1 min)

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar todas as tabelas
npm run prisma:migrate
```

Quando perguntar o nome da migration, digite: `init` e pressione Enter.

---

### 6️⃣ Popular com Dados Iniciais (30 seg)

```bash
npm run prisma:seed
```

Isso criará:
- ✅ 3 usuários (1 admin, 2 usuários)
- ✅ 3 prestadores
- ✅ 3 equipes
- ✅ 2 obras
- ✅ 5 atribuições (tarefas)
- ✅ Logs de exemplo

**Credenciais criadas:**
```
Admin:
  Email: admin@obravista.com
  Senha: admin123

Usuário:
  Email: joao@obravista.com
  Senha: user123
```

---

### 7️⃣ Iniciar Servidor (10 seg)

```bash
npm run dev
```

Você verá:

```
🚀 ========================================
   OBRA VISTA - Backend API
========================================
📡 Servidor rodando em: http://localhost:3001
🌍 Ambiente: development
🔗 Frontend URL: http://localhost:5173
========================================
```

---

## ✅ Testar se Funcionou

### Teste 1: Health Check

Abra no navegador: http://localhost:3001/health

Deve retornar:
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 5.123,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Teste 2: Login

No terminal, execute:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@obravista.com\",\"senha\":\"admin123\"}"
```

Deve retornar um token JWT:
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "nome": "Administrador",
      "email": "admin@obravista.com",
      "tipo": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🎉 Pronto!

Seu backend está funcionando! Agora você pode:

1. ✅ Iniciar o frontend (`cd ../frontend && npm run dev`)
2. ✅ Fazer login com as credenciais acima
3. ✅ Testar todas as funcionalidades

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Ver banco de dados (GUI)
npm run prisma:studio

# Resetar banco (CUIDADO!)
npm run prisma:reset

# Gerar novo migration
npm run prisma:migrate
```

---

## ❌ Problemas Comuns

### "Can't reach database server"

**Solução:**
1. Verifique se copiou a connection string corretamente
2. Verifique se substituiu `[YOUR-PASSWORD]` pela senha real
3. Teste a conexão: `npx prisma db pull`

### "Port 3001 already in use"

**Solução:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### "Module not found"

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Próximos Passos

1. Leia o [README.md](./README.md) completo
2. Explore os endpoints na [documentação](./BACKEND.md)
3. Configure o frontend
4. Comece a desenvolver!

---

## 💬 Precisa de Ajuda?

- 📧 Email: dev@obravista.com
- 💬 Discord: [Link do servidor]
- 🐛 Issues: [GitHub Issues]

---

**Boa sorte! 🚀**
