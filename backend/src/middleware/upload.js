const multer = require('multer');

// Configuração simples para manter em memória (buffer) para processamento rápido (ex: excel)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB
    }
});

module.exports = upload;
