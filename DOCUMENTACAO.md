# 🏗️ Obra Vista - Documentação de Evolução e Definições

Esta documentação serve como o "Cérebro" do projeto, registrando todas as definições técnicas, lógicas de negócio e evoluções implementadas para garantir a consistência e evitar bugs em futuras manutenções.

---

## 🛠️ Stack Tecnológica Central
- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons.
- **Backend**: Node.js + Express + PostgreSQL.
- **Comunicação**: REST API com JSON.

---

## 👥 1. Gestão de Prestadores (Módulo Finalizado)

### 📋 Definições de Cadastro
- **Tipos de Identificação**: Suporte dinâmico para **CPF (Pessoa Física)** e **CNPJ (Pessoa Jurídica)**.
- **Máscaras de Entrada**: Implementadas via `maskPhone`, `maskCPF` e `maskCNPJ` com remoção automática de caracteres não numéricos antes do envio à API.
- **Especialidades Dinâmicas**: Não são mais campos de texto fixos. Elas vêm da tabela `especialidades`, garantindo que o usuário selecione apenas opções padronizadas.

---

## 🛠️ 2. Gestão de Especialidades (Módulo Finalizado)

### 🔧 Lógica de Manutenção
- **Página Dedicada**: Localizada em `Tipos de Prestadores`.
- **Integridade Referencial**: O sistema impede a exclusão de uma especialidade que possua prestadores vinculados (erro 500 tratado no backend).
- **Sincronização de nomes**: Ao editar o nome de uma especialidade, o backend realiza um `UPDATE` em cascata na tabela `prestadores` para manter a consistência dos nomes já cadastrados.

---

## 👨‍👩‍👦‍👦 3. Gestão de Equipes (Módulo Finalizado)

### 🏗️ Arquitetura de Membros
- **Vínculos**: Uma equipe pode conter múltiplos **Prestadores** através da tabela de relacionamento `equipe_membros`.
- **Papéis (Roles)**: Suporte para dois tipos de membros:
  - **Líder**: Identificado pelo ícone de **Coroa (Crown)** e destaque visual.
  - **Membro**: Profissional operacional.
- **Sincronização Atômica**: O sistema compara o rascunho com o banco de dados e executa múltiplos comandos (Add/Remove/Update) de uma vez só ao salvar, garantindo integridade.

---

## 📋 4. Kanban de Obras (Módulo em Desenvolvimento)

### 🗺️ Definições Iniciais
- **Fluxo**: Colunas de "A Fazer", "Em Progresso" e "Concluído".
- **Atribuição**: Cards de tarefas serão vinculados a Obras e poderão ter Equipes ou Prestadores específicos como responsáveis.

---

## 📐 5. Padrões Visuais (UI/UX - Regras de Ouro)

Para manter a elegância e o toque "Premium" do Obra Vista, estas regras devem ser seguidas:
- **Tipografia**: Evitar `font-bold` em excesso. Preferir `font-medium` para títulos e botões.
- **Botões**:
  - `bg-primary`: Ações principais de salvamento.
  - `bg-secondary` ou `bg-accent`: Ações neutras ou edição.
  - Arredondamento padrão: `rounded-xl` ou `rounded-lg`.
- **Feedback**: Sempre utilizar ícones de carregamento (`Loader2`) e animações em modais.

---

## 🚀 Backlog
- [ ] **Relatórios**: Métricas de tempo por obra e equipe.
- [ ] **Notificações**: Avisar líderes sobre novas tarefas no Kanban.

---

*Última atualização: 29/01/2026*
