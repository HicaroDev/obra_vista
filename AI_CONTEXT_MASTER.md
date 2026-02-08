
# 🤖 Master Context for AI Agent - Obra Vista SaaS

This document serves as a comprehensive memory injection for any AI agent continuing the development of the **Obra Vista** project. It details the architecture, recent major changes, and the current "mental model" of the application.

---

## 🏗️ Project Overview
**Obra Vista** is a SaaS for construction management. It bridges the gap between the commercial side (CRM/Proposals) and the operational side (Kanban/Field Work).

### Tech Stack
- **Frontend**: React 18 (Vite), TypeScript, Tailwind CSS, Zustand (State), React Router 7.
- **Backend**: Node.js (Express), Prisma ORM, PostgreSQL.
- **Reports**: `pdfmake` for commercial proposal generation.

---

## 🚩 Major Recent Updates (READ THIS FIRST)

### 1. CRM & Commercial Flow (Feb 2026)
- **Modal to Page Transition**: We replaced the `DealDetailsModal` with a dedicated page: `/frontend/src/pages/CrmDealDetail.tsx`. **Reason**: Better UX for complex interactions like technical surveys and proposal parameters.
- **Pipeline Stats**: Added a dashboard to `CrmBoard.tsx` that calculates:
    - `valor_total_pipeline`: Sum of all open deals.
    - `valor_em_negociacao`: Focus on deals in the 'negociacao' stage.
    - `conversion_rate`: Won vs Total deals.
- **Workflow**: 
    1. **Lead/Deal** created in Pipeline.
    2. **Technical Survey (Vistoria)** filled in the Deal Detail.
    3. **Proposal (PDF)** generated based on the Survey + Budget multipliers.
    4. **Win Deal**: Clicking "FECHAR NEGÓCIO" creates a project in the operational sector (Obras).

### 2. PDF Generation Logic
- **Endpoint**: `GET /api/crm/propostas/:id/pdf`
- **Controller**: `backend/src/controllers/crmController.js` -> `generatePropostaPDF`.
- **Mechanism**: Fetches `proposta`, includes `deal`, `lead`, and `obra.orcamento`. It creates a professional PDF using `pdfmake` with dynamic font loading from `node_modules`.

---

## 📂 Key Files & Logic Maps

### Commercial / CRM (`/crm`)
- `frontend/src/pages/CrmBoard.tsx`: The Kanban board with the stats dashboard.
- `frontend/src/pages/CrmDealDetail.tsx`: The central hub for each deal. Handles Timeline, Vistoria, and Propostas.
- `backend/src/controllers/crmController.js`: Primary logic for stats and PDFs.

### Operational / Kanban (`/kanban`)
- `frontend/src/pages/Kanban.tsx`: Task management for active works.
- `backend/src/services/atribuicoes.service.js`: Complex logic for scheduling providers and equipment.

---

## 🛠️ Database State
The Prisma schema (`backend/prisma/schema.prisma`) has been updated to include:
- `CrmDeal`: Represents an opportunity.
- `CrmInteracao`: Timeline events for a deal.
- `Proposta`: Versioned PDF proposals.
- `CrmPerguntaVistoria`: Dynamic checklist for technical surveys.

---

## ⚠️ Important Implementation Details
- **Styling Policy**: We use a "Premium Clean" aesthetic. Lots of whitespace, `rounded-2xl` or `3xl`, subtle shadows (`shadow-blue-500/5`), and high-contrast typography (font-black for headings).
- **Permissions**: Managed via `frontend/src/lib/permissions.ts`. Always check `canAccessPage` or `canPerformAction`.
- **API URL**: Always use `crmApi.propostas.getPdfUrl(id)` for proposal links to ensure consistent environment handling.

---

## 📦 Current Git State (Pending Commits)
Ao iniciar no outro PC, o estado esperado é:
- **Modified**: `README.md`, `backend/src/controllers/crmController.js`, `backend/src/routes/crm.routes.js`, `frontend/src/App.tsx`, `frontend/src/lib/api.ts`, `frontend/src/pages/CrmBoard.tsx`, `SYSTEM_OVERVIEW.md`.
- **Deleted**: `frontend/src/components/crm/DealDetailsModal.tsx`.
- **Untracked (Novos)**: `AI_CONTEXT_MASTER.md`, `HANDOVER_ATUALIZACAO.md`, `frontend/src/pages/CrmDealDetail.tsx`.

**Recomendação**: Execute `git add .` e `git commit -m "feat(crm): central de vendas full-page e gerador de proposta pdf"` assim que validar o build.

---

## 📝 Pending Tasks & Backlog
1. **Photo Uploads**: Implement images in the technical survey (Vistoria) within `CrmDealDetail`.
2. **Global Search**: A search bar in the layout that finds Leads, Obras, and Teams simultaneously.
3. **Advanced BI**: Add Chart.js to the dashboard for sales projection.

---

**Instruction to AI**: Continue with the same "Premium" design pattern. Avoid simple MVP looks. Use `react-icons/pi` for all icons.
