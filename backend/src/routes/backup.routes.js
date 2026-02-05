const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const { authMiddleware, adminExampleMiddleware } = require('../middleware/auth'); // Assumindo que existam middlewares de auth

// Rota de download (Pública ou com validação customizada para permitir acesso via browser)
// Links diretos href="..." não enviam headers de autenticação.
router.get('/:filename', backupController.download);

// Protege todas as rotas ABAIXO - Apenas autenticados
router.use(authMiddleware);

// Rota para criar backup (Idealmente restrito a admins)
router.post('/', backupController.create);

// Rota para listar backups
router.get('/', backupController.list);

// Rota de restore
router.post('/:filename/restore', backupController.restore);

module.exports = router;
