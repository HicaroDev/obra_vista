const { verifyToken } = require('../utils/jwt');

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona os dados do usuário ao request
 */
const authMiddleware = (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido',
      });
    }

    // Formato esperado: "Bearer TOKEN"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer TOKEN',
      });
    }

    const token = parts[1];

    // Verificar e decodificar token
    const decoded = verifyToken(token);
    
    // Adicionar dados do usuário ao request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      tipo: decoded.tipo,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido ou expirado',
    });
  }
};

/**
 * Middleware para verificar se o usuário é admin
 */
const adminMiddleware = (req, res, next) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem realizar esta ação.',
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};
