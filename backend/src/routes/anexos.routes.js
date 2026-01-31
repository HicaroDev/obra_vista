const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadConfig = require('../config/upload');
const anexosController = require('../controllers/anexos.controller.js');
const { authMiddleware } = require('../middleware/auth');

const upload = multer(uploadConfig);

// Rotas protegidas
router.use(authMiddleware);

// Listar anexos de uma atribuição
// Note que a rota principal será definida no server.js.
// Se usarmos /api/anexos, precisaremos ajustar.
// Mas para manter a consistência com o REST, algumas rotas dependem da atribuição.

// No entanto, para simplificar e seguir o padrão do projeto, vou criar rotas dedicadas a anexos
// A rota de listar por atribuição poderia ser /api/atribuicoes/:id/anexos (no controller de atribuicoes ou aqui)
// Para simplificar, vou colocar as rotas de listagem E upload aqui, mas a URL será mapeada corretamente no server.

// DELETE /api/anexos/:id
router.delete('/:id', anexosController.delete);

module.exports = router;
