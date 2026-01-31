/**
 * Middleware global de tratamento de erros
 * Captura todos os erros não tratados e retorna uma resposta padronizada
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Erro capturado:', err);

  // Erro de validação do Prisma
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'Já existe um registro com esses dados únicos',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Erro de registro não encontrado do Prisma
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro não encontrado',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Erro de validação do express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: err.array(),
    });
  }

  // Erro genérico
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

/**
 * Middleware para rotas não encontradas (404)
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
