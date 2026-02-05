require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const loggerMiddleware = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const equipesRoutes = require('./routes/equipes.routes');
const obrasRoutes = require('./routes/obras.routes');
const atribuicoesRoutes = require('./routes/atribuicoes.routes');
const logsRoutes = require('./routes/logs.routes');
const prestadoresRoutes = require('./routes/prestadores.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const rolesRoutes = require('./routes/roles.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const especialidadesRoutes = require('./routes/especialidades.routes');
const checklistsRoutes = require('./routes/checklists.routes');
const anexosRoutes = require('./routes/anexos.routes');
const etiquetasRoutes = require('./routes/etiquetas.routes');
const comprasRoutes = require('./routes/compras.routes');
const produtosRoutes = require('./routes/produtos.routes');
const unidadesRoutes = require('./routes/unidades.routes');
const frequenciaRoutes = require('./routes/frequencia.routes');
const ferramentasRoutes = require('./routes/ferramentas.routes');

// Criar app Express
const app = express();

// ==================== MIDDLEWARES ====================

// CORS - Permitir requisições do frontend
// CORS - Permitir requisições do frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Permitir requisições server-side/postman

    // Em desenvolvimento, aceita qualquer localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser - JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger - Registrar requisições HTTP
app.use(loggerMiddleware);

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// ==================== ROTAS ====================

// Rota de status da API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Obra Vista API - Backend funcionando! 🚀',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/equipes', equipesRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/atribuicoes', atribuicoesRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/prestadores', prestadoresRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/checklists', checklistsRoutes);
app.use('/api/anexos', anexosRoutes);
app.use('/api/etiquetas', etiquetasRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api/frequencia', frequenciaRoutes);
app.use('/api/ferramentas', ferramentasRoutes);

// ==================== ERROR HANDLING ====================

// Servir arquivos estáticos do Frontend em Produção
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.resolve(__dirname, '..', 'public');

  // Servir arquivos estáticos (JS, CSS, Imagens)
  app.use(express.static(publicPath));

  // Qualquer outra rota que não comece com /api retorna o index.html (SPA)
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(publicPath, 'index.html'));
  });
}

// 404 - Rota não encontrada (apenas para API ou se arquivo não existir)
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

// ==================== SERVIDOR ====================

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log('   OBRA VISTA - Backend API v1.1.0');
  console.log('========================================');
  console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('========================================\n');
  console.log('📋 Endpoints disponíveis:');
  console.log('   GET  /                    - Info da API');
  console.log('   GET  /health              - Health check');
  console.log('   POST /api/auth/register   - Registrar usuário');
  console.log('   POST /api/auth/login      - Login');
  console.log('   GET  /api/auth/me         - Dados do usuário');
  console.log('   *    /api/equipes         - CRUD Equipes');
  console.log('   *    /api/obras           - CRUD Obras');
  console.log('   *    /api/atribuicoes     - CRUD Atribuições (Kanban)');
  console.log('   *    /api/prestadores     - CRUD Prestadores');
  console.log('   *    /api/usuarios        - CRUD Usuários');
  console.log('   GET  /api/roles           - Listar Roles');
  console.log('   GET  /api/logs            - Listar logs');
  console.log('========================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT recebido. Encerrando servidor...');
  process.exit(0);
});

module.exports = app;
