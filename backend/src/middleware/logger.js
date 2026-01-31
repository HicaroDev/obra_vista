const morgan = require('morgan');

/**
 * Configuração do Morgan para logging de requisições HTTP
 */

// Formato customizado de log
morgan.token('user', (req) => {
  return req.user ? `User:${req.user.id}` : 'Guest';
});

// Formato de desenvolvimento (colorido e detalhado)
const devFormat = ':method :url :status :response-time ms - :user';

// Formato de produção (JSON estruturado)
const prodFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time ms',
  user: ':user',
  date: ':date[iso]',
});

// Escolher formato baseado no ambiente
const loggerMiddleware = process.env.NODE_ENV === 'production'
  ? morgan(prodFormat)
  : morgan(devFormat);

module.exports = loggerMiddleware;
