import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Obras } from './pages/Obras';
import { Prestadores } from './pages/Prestadores';
import { Equipes } from './pages/Equipes';
import { Kanban } from './pages/Kanban';
import { Relatorios } from './pages/Relatorios';
import { Usuarios } from './pages/Usuarios';
import { Especialidades } from './pages/Especialidades';
import { Produtos } from './pages/Produtos';
import { Unidades } from './pages/Unidades';
import { Layout } from './components/Layout';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/prestadores" element={<Prestadores />} />
          <Route path="/equipes" element={<Equipes />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/especialidades" element={<Especialidades />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/unidades" element={<Unidades />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
