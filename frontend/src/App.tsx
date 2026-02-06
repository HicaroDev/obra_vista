import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useModuleStore } from './store/moduleStore';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Obras } from './pages/Obras';
import { Prestadores } from './pages/Prestadores';
import { Equipes } from './pages/Equipes';
import { Kanban } from './pages/Kanban';
import { Relatorios } from './pages/Relatorios';
import { Frequencia } from './pages/Frequencia';
import { Usuarios } from './pages/Usuarios';
import { Especialidades } from './pages/Especialidades';
import { Produtos } from './pages/Produtos';
import { Unidades } from './pages/Unidades';
import { Ferramentas } from './pages/Ferramentas';
import { ModulesHub } from './pages/ModulesHub';
import { Configuracoes } from './pages/Configuracoes';
import { Layout } from './components/Layout';
import { Toaster } from 'sonner';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { activeModule } = useModuleStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" closeButton />
      <Layout>
        <Routes>
          <Route path="/" element={!activeModule ? <Navigate to="/modules" replace /> : <Dashboard />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/prestadores" element={<Prestadores />} />
          <Route path="/equipes" element={<Equipes />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/frequencia" element={<Frequencia />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/especialidades" element={<Especialidades />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/unidades" element={<Unidades />} />
          <Route path="/modules" element={<ModulesHub />} />
          <Route path="/ferramentas" element={<Ferramentas />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
