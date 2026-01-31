const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');

class AuthService {
  /**
   * Registrar novo usuário
   */
  async register(data) {
    const { nome, email, senha, tipo = 'usuario' } = data;

    // Verificar se email já existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar usuário
    const user = await prisma.usuarios.create({
      data: {
        nome,
        email,
        senha: hashedPassword,
        tipo,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
        createdAt: true,
      },
    });

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      tipo: user.tipo,
    });

    return { user, token };
  }

  /**
   * Login de usuário
   */
  async login(email, senha) {
    // Buscar usuário
    const user = await prisma.usuarios.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Email ou senha incorretos');
    }

    // Verificar se usuário está ativo
    if (!user.ativo) {
      throw new Error('Usuário inativo. Entre em contato com o administrador.');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);

    if (!isPasswordValid) {
      throw new Error('Email ou senha incorretos');
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      tipo: user.tipo,
    });

    // Remover senha do retorno
    const { senha: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  /**
   * Buscar dados do usuário logado
   */
  async getMe(userId) {
    const user = await prisma.usuarios.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(userId, data) {
    const { nome, email, senhaAtual, novaSenha } = data;

    // Buscar usuário atual
    const user = await prisma.usuarios.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Preparar dados para atualização
    const updateData = {};

    if (nome) updateData.nome = nome;
    
    if (email && email !== user.email) {
      // Verificar se novo email já existe
      const existingUser = await prisma.usuarios.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      updateData.email = email;
    }

    // Atualizar senha se fornecida
    if (novaSenha) {
      if (!senhaAtual) {
        throw new Error('Senha atual é obrigatória para alterar a senha');
      }

      // Verificar senha atual
      const isPasswordValid = await bcrypt.compare(senhaAtual, user.senha);

      if (!isPasswordValid) {
        throw new Error('Senha atual incorreta');
      }

      // Hash da nova senha
      updateData.senha = await bcrypt.hash(novaSenha, 10);
    }

    // Atualizar usuário
    const updatedUser = await prisma.usuarios.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Verificar se email existe
   */
  async checkEmailExists(email) {
    const user = await prisma.usuarios.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }
}

module.exports = new AuthService();
