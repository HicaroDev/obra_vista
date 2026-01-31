# TODO: Obra Vista SaaS Development

## Project Setup
- [ ] Create project structure: frontend and backend folders
- [ ] Initialize frontend with Vite React TypeScript template
- [ ] Initialize backend with Node + Express
- [ ] Set up package.json for both frontend and backend

## Frontend Setup
- [ ] Install frontend dependencies: React 18, Vite, Tailwind CSS, @hello-pangea/dnd, Zustand, Lucide React
- [ ] Configure Vite with PWA plugin
- [ ] Set up Tailwind CSS with dark mode configuration
- [ ] Create basic file structure: src/components, src/pages, src/hooks, etc.
- [ ] Implement dark/light mode detection and toggle (system preference + localStorage)

## UI Components
- [ ] Create Layout component: fixed sidebar (280px) and topbar (56px)
- [ ] Create Kanban component: fluid columns, cards with drag-and-drop
- [ ] Create Login and Cadastro forms
- [ ] Create Team management modal (create/edit, drag members)
- [ ] Create Work (Obras) CRUD interface
- [ ] Create Dashboard page with Kanban
- [ ] Add mobile responsive design (hamburger menu, vertical Kanban)

## Backend Setup
- [ ] Install backend dependencies: Express, Prisma, JWT, bcrypt, cors
- [ ] Set up Prisma with PostgreSQL connection
- [ ] Define database schema: Usuarios, Prestadores, Equipes, Equipes_Membros, Obras, Atribuicoes, Logs
- [ ] Run Prisma migrations

## Authentication
- [ ] Implement JWT authentication middleware
- [ ] Create login/register API endpoints
- [ ] Add password hashing with bcrypt

## API Endpoints
- [ ] CRUD endpoints for Teams (Equipes)
- [ ] CRUD endpoints for Works (Obras)
- [ ] CRUD endpoints for Assignments (Atribuicoes)
- [ ] Endpoints for Kanban data (columns/cards based on assignments)
- [ ] Logs endpoint for history

## Integration
- [ ] Connect frontend to backend APIs
- [ ] Implement state management with Zustand
- [ ] Add drag-and-drop functionality to Kanban
- [ ] Add search and filters to dashboard

## PWA and Export
- [ ] Configure PWA manifest and service worker
- [ ] Implement basic PDF export for reports
- [ ] Test PWA installability and offline functionality

## Testing and Deployment
- [ ] Test all features: login, cadastro, team creation, Kanban drag, dark/light toggle
- [ ] Ensure mobile responsiveness and PWA functionality
- [ ] Set up Docker for deployment
- [ ] Final testing and bug fixes
