# 📋 PLANEJAMENTO: SISTEMA KANBAN COMPLETO

## 🎯 Objetivo
Transformar o Kanban em um sistema completo de gerenciamento de tarefas de obra com:
- Checklist de itens
- Upload de documentos e fotos
- Etiquetas/Tags
- Solicitação de compras
- Registro de ocorrências
- Atribuição flexível (Equipe OU Prestador)
- Dias da semana de trabalho

---

## 📊 ESTRUTURA DO BANCO DE DADOS

### 1. Tabela Principal: `atribuicoes` (ATUALIZAR)
```sql
ALTER TABLE atribuicoes 
ADD COLUMN tipo_atribuicao VARCHAR(20) DEFAULT 'equipe', -- 'equipe' ou 'prestador'
ADD COLUMN prestador_id INT NULL,
ADD COLUMN dias_semana JSON NULL, -- ["seg", "ter", "qua", "qui", "sex", "sab", "dom"]
ADD FOREIGN KEY (prestador_id) REFERENCES prestadores(id);
```

### 2. Nova Tabela: `tarefa_checklists`
```sql
CREATE TABLE tarefa_checklists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    atribuicao_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    concluido BOOLEAN DEFAULT FALSE,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE
);
```

### 3. Nova Tabela: `tarefa_anexos`
```sql
CREATE TABLE tarefa_anexos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    atribuicao_id INT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'documento', 'foto', 'video'
    url VARCHAR(500) NOT NULL,
    tamanho INT, -- em bytes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE
);
```

### 4. Nova Tabela: `etiquetas`
```sql
CREATE TABLE etiquetas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(7) DEFAULT '#3B82F6', -- hex color
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Nova Tabela: `tarefa_etiquetas` (relacionamento)
```sql
CREATE TABLE tarefa_etiquetas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    atribuicao_id INT NOT NULL,
    etiqueta_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE,
    FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
);
```

### 6. Nova Tabela: `tarefa_compras`
```sql
CREATE TABLE tarefa_compras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    atribuicao_id INT NOT NULL,
    material VARCHAR(255) NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL,
    unidade VARCHAR(50), -- 'unidade', 'kg', 'm²', etc.
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'aprovado', 'comprado'
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE
);
```

### 7. Nova Tabela: `tarefa_ocorrencias`
```sql
CREATE TABLE tarefa_ocorrencias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    atribuicao_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    gravidade VARCHAR(50) DEFAULT 'media', -- 'baixa', 'media', 'alta', 'critica'
    status VARCHAR(50) DEFAULT 'aberto', -- 'aberto', 'em_analise', 'resolvido'
    usuario_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (atribuicao_id) REFERENCES atribuicoes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

### 8. Nova Tabela: `ocorrencia_anexos`
```sql
CREATE TABLE ocorrencia_anexos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ocorrencia_id INT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ocorrencia_id) REFERENCES tarefa_ocorrencias(id) ON DELETE CASCADE
);
```

---

## 🎨 INTERFACE DO USUÁRIO

### Modal de Tarefa - Estrutura de Abas
```
┌─────────────────────────────────────────────────────┐
│ ✏️ Editar Tarefa: Instalação Elétrica          [X] │
├─────────────────────────────────────────────────────┤
│ [📝 Geral] [✅ Checklist] [📎 Anexos] [🛒 Compras] │
│ [⚠️ Ocorrências] [🏷️ Etiquetas]                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [CONTEÚDO DA ABA SELECIONADA]                     │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Aba 1: GERAL
- Título
- Descrição
- Prioridade
- **Tipo de Atribuição**: Radio buttons (Equipe / Prestador)
  - Se Equipe: Dropdown de equipes
  - Se Prestador: Dropdown de prestadores
- Data de Início
- Data de Entrega
- **Dias da Semana**: Checkboxes
  - ☐ Segunda ☐ Terça ☐ Quarta ☐ Quinta ☐ Sexta ☐ Sábado ☐ Domingo

### Aba 2: CHECKLIST
- Lista de itens
- Checkbox para marcar como concluído
- Barra de progresso (X/Y concluídos)
- Botão [+ Adicionar Item]
- Botão [🗑️] para remover item

### Aba 3: ANEXOS
- Grid de arquivos (cards)
- Ícone diferente para documento/foto
- Preview de imagens
- Botão [📤 Upload]
- Botão [🗑️] para remover

### Aba 4: COMPRAS
- Tabela de materiais
  - Material | Quantidade | Unidade | Status | Ações
- Botão [+ Adicionar Material]
- Status com cores:
  - 🟡 Pendente
  - 🔵 Aprovado
  - 🟢 Comprado

### Aba 5: OCORRÊNCIAS
- Lista de ocorrências (cards)
- Cada card mostra:
  - Título
  - Gravidade (badge colorido)
  - Status
  - Data
  - Fotos anexadas
- Botão [+ Registrar Ocorrência]

### Aba 6: ETIQUETAS
- Lista de etiquetas disponíveis
- Checkbox para selecionar
- Botão [+ Nova Etiqueta]
- Visualização com cores

---

## 🔄 FLUXO DE IMPLEMENTAÇÃO

### FASE 1: Backend - Estrutura de Dados ✅
1. Criar migrations para novas tabelas
2. Criar models no backend
3. Criar endpoints da API

### FASE 2: Frontend - Tipos TypeScript ✅
1. Atualizar tipos existentes
2. Criar novos tipos
3. Atualizar interfaces

### FASE 3: Frontend - Componentes Base 🔄
1. Criar componente de Abas
2. Criar componente de Checklist
3. Criar componente de Upload
4. Criar componente de Etiquetas

### FASE 4: Frontend - Integração 🔄
1. Atualizar modal de tarefa
2. Integrar componentes
3. Conectar com API

### FASE 5: Testes e Ajustes 🔄
1. Testar todas as funcionalidades
2. Ajustar UI/UX
3. Corrigir bugs

---

## 📝 ENDPOINTS DA API NECESSÁRIOS

### Checklists
- `GET /api/atribuicoes/:id/checklists` - Listar itens
- `POST /api/atribuicoes/:id/checklists` - Criar item
- `PUT /api/checklists/:id` - Atualizar item
- `DELETE /api/checklists/:id` - Remover item

### Anexos
- `GET /api/atribuicoes/:id/anexos` - Listar anexos
- `POST /api/atribuicoes/:id/anexos` - Upload
- `DELETE /api/anexos/:id` - Remover anexo

### Etiquetas
- `GET /api/etiquetas` - Listar todas
- `POST /api/etiquetas` - Criar etiqueta
- `POST /api/atribuicoes/:id/etiquetas` - Adicionar à tarefa
- `DELETE /api/atribuicoes/:id/etiquetas/:etiquetaId` - Remover da tarefa

### Compras
- `GET /api/atribuicoes/:id/compras` - Listar materiais
- `POST /api/atribuicoes/:id/compras` - Adicionar material
- `PUT /api/compras/:id` - Atualizar status
- `DELETE /api/compras/:id` - Remover material

### Ocorrências
- `GET /api/atribuicoes/:id/ocorrencias` - Listar ocorrências
- `POST /api/atribuicoes/:id/ocorrencias` - Criar ocorrência
- `PUT /api/ocorrencias/:id` - Atualizar ocorrência
- `DELETE /api/ocorrencias/:id` - Remover ocorrência

---

## 🎯 PRIORIDADES DE IMPLEMENTAÇÃO

### ALTA PRIORIDADE (Implementar Primeiro)
1. ✅ Atribuição flexível (Equipe OU Prestador)
2. ✅ Dias da semana
3. ✅ Checklist básico
4. ✅ Etiquetas

### MÉDIA PRIORIDADE
5. 📎 Upload de anexos
6. 🛒 Solicitação de compras
7. ⚠️ Ocorrências básicas

### BAIXA PRIORIDADE (Melhorias Futuras)
8. 📊 Relatórios de progresso
9. 📧 Notificações
10. 📱 App mobile

---

## 💡 OBSERVAÇÕES IMPORTANTES

1. **Upload de Arquivos**: Precisaremos configurar:
   - Multer no backend para upload
   - Pasta de armazenamento
   - Limite de tamanho
   - Tipos permitidos

2. **Performance**: Com muitos anexos, considerar:
   - Paginação
   - Lazy loading de imagens
   - Compressão de imagens

3. **Segurança**:
   - Validar tipos de arquivo
   - Sanitizar nomes de arquivo
   - Verificar permissões de acesso

4. **UX**:
   - Loading states
   - Feedback visual
   - Confirmações antes de deletar

---

## 📅 CRONOGRAMA ESTIMADO

- **Semana 1**: Backend (tabelas, models, endpoints básicos)
- **Semana 2**: Frontend (tipos, componentes base)
- **Semana 3**: Integração (conectar tudo)
- **Semana 4**: Testes e ajustes finais

**TOTAL**: ~4 semanas para implementação completa

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend
- [ ] Criar migrations das tabelas
- [ ] Criar models
- [ ] Criar controllers
- [ ] Criar rotas da API
- [ ] Configurar upload de arquivos
- [ ] Testes de API

### Frontend
- [ ] Atualizar tipos TypeScript
- [ ] Criar componente de Abas
- [ ] Criar componente de Checklist
- [ ] Criar componente de Upload
- [ ] Criar componente de Etiquetas
- [ ] Criar componente de Compras
- [ ] Criar componente de Ocorrências
- [ ] Atualizar modal de tarefa
- [ ] Integrar com API
- [ ] Testes de interface

### Documentação
- [x] Documento de planejamento
- [ ] Documentação da API
- [ ] Guia de uso para usuários

---

**Documento criado em**: 28/01/2026
**Última atualização**: 28/01/2026
