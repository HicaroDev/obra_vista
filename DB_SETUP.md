# 🛠️ Instruções de Setup e População do Banco de Dados

Este documento descreve como configurar o banco de dados e populá-lo com dados iniciais para o projeto Obra Vista.

## 📋 Pré-requisitos

1.  Certifique-se de que o backend está configurado corretamente (arquivo `.env` com a `DATABASE_URL`).
2.  Tenha o Node.js instalado.

## 🌱 Populando o Banco de Dados

O projeto possui seeds (scripts de população) divididos para facilitar a manutenção. Você pode rodar todos ou apenas os necessários.

### 1. Seed Principal (Essencial)
Cria usuários, obras, equipes e atribuições iniciais.

```bash
cd backend
npm run prisma:seed
```

O comando acima executa o arquivo `backend/prisma/seed.js`.

### 2. Seed Complementar (Tabelas Auxiliares)
Popula as tabelas de **Unidades**, **Produtos** e **Especialidades (Tipos de Prestadores)**.

```bash
cd backend
node prisma/seed-complementos.js
```

### 3. Reset Completo (Cuidado! ⚠️)
Se precisar limpar tudo e recomeçar do zero:

```bash
cd backend
npx prisma migrate reset
```
*(Isso apagará todos os dados e recriará as tabelas)*

## 📦 Scripts Disponíveis no `package.json`

No diretório `backend`, você encontrará os seguintes scripts úteis:

*   `npm run prisma:generate`: Gera o cliente Prisma atualizado.
*   `npm run prisma:migrate`: Cria e aplica migrações de banco de dados.
*   `npm run prisma:seed`: Roda o seed principal.
*   `npm run dev`: Inicia o servidor em modo de desenvolvimento.

---

**Nota:** Se você notar que telas como "Produtos" ou "Tipos de Prestadores" estão vazias, execute o **Passo 2 (Seed Complementar)**.
