import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authService } from '../services/auth.service';
import { authConfig } from '../config/auth.config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * POST /auth/register
 * Registra um novo usuário
 */
export const register = async (req: Request, res: Response) => {
  try {
    logger.info({ body: req.body }, 'Tentativa de registro');
    const { name, email, password } = req.body;

    // Validações
    if (!name || !email || !password) {
      logger.warn({ name, email }, 'Campos obrigatórios faltando');
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < authConfig.password.minLength) {
      logger.warn({ email }, 'Senha muito curta');
      return res.status(400).json({
        error: `A senha deve ter no mínimo ${authConfig.password.minLength} caracteres`,
      });
    }

    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn({ email }, 'Email já cadastrado');
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Cria o usuário
    logger.info({ email }, 'Criando usuário');
    const hashedPassword = await authService.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    logger.info({ userId: user.id, email: user.email }, 'Usuário criado com sucesso');

    // Cria sessão
    const session = await authService.createSession({
      userId: user.id,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    logger.info({ userId: user.id, sessionId: session.id }, 'Sessão criada');

    // Gera access token
    const accessToken = authService.generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    // Define cookies
    res.cookie(
      authConfig.cookies.accessToken.name,
      accessToken,
      authConfig.cookies.accessToken.options
    );

    res.cookie(
      authConfig.cookies.refreshToken.name,
      session.refreshToken,
      authConfig.cookies.refreshToken.options
    );

    logger.info({ userId: user.id }, 'Registro completo, cookies definidos');

    // Retorna dados do usuário (sem senha)
    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Erro no registro');
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
};

/**
 * POST /auth/login
 * Realiza login do usuário
 */
export const login = async (req: Request, res: Response) => {
  try {
    logger.info({ email: req.body.email }, 'Tentativa de login');
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      logger.warn({ email }, 'Email ou senha faltando');
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn({ email }, 'Usuário não encontrado');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verifica senha
    const isPasswordValid = await authService.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      logger.warn({ email }, 'Senha incorreta');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    logger.info({ userId: user.id }, 'Login bem-sucedido');

    // Cria sessão
    const session = await authService.createSession({
      userId: user.id,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    // Gera access token
    const accessToken = authService.generateAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    // Define cookies
    res.cookie(
      authConfig.cookies.accessToken.name,
      accessToken,
      authConfig.cookies.accessToken.options
    );

    res.cookie(
      authConfig.cookies.refreshToken.name,
      session.refreshToken,
      authConfig.cookies.refreshToken.options
    );

    logger.info({ userId: user.id, sessionId: session.id }, 'Login completo');

    // Retorna dados do usuário (sem senha)
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Erro no login');
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

/**
 * POST /auth/refresh
 * Renova os tokens (access e refresh)
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const oldRefreshToken = req.cookies[authConfig.cookies.refreshToken.name];

    if (!oldRefreshToken) {
      return res.status(401).json({ error: 'Refresh token não encontrado' });
    }

    // Rotaciona o refresh token
    const result = await authService.rotateRefreshToken(
      oldRefreshToken,
      req.headers['user-agent'],
      req.ip
    );

    if (!result) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    // Gera novo access token
    const accessToken = authService.generateAccessToken({
      userId: result.userId,
      email: result.email,
      sessionId: result.sessionId,
    });

    // Define novos cookies
    res.cookie(
      authConfig.cookies.accessToken.name,
      accessToken,
      authConfig.cookies.accessToken.options
    );

    res.cookie(
      authConfig.cookies.refreshToken.name,
      result.refreshToken,
      authConfig.cookies.refreshToken.options
    );

    return res.status(200).json({ message: 'Tokens renovados com sucesso' });
  } catch (error) {
    console.error('Erro ao renovar tokens:', error);
    return res.status(500).json({ error: 'Erro ao renovar tokens' });
  }
};

/**
 * POST /auth/logout
 * Faz logout do usuário
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies[authConfig.cookies.refreshToken.name];

    if (refreshToken) {
      // Revoga a sessão
      await authService.revokeSessionByToken(refreshToken);
    }

    // Remove cookies
    res.clearCookie(authConfig.cookies.accessToken.name, {
      httpOnly: authConfig.cookies.accessToken.options.httpOnly,
      secure: authConfig.cookies.accessToken.options.secure,
      sameSite: authConfig.cookies.accessToken.options.sameSite,
      path: authConfig.cookies.accessToken.options.path,
    });

    res.clearCookie(authConfig.cookies.refreshToken.name, {
      httpOnly: authConfig.cookies.refreshToken.options.httpOnly,
      secure: authConfig.cookies.refreshToken.options.secure,
      sameSite: authConfig.cookies.refreshToken.options.sameSite,
      path: authConfig.cookies.refreshToken.options.path,
    });

    return res.status(200).json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    return res.status(500).json({ error: 'Erro ao fazer logout' });
  }
};

/**
 * GET /auth/me
 * Retorna dados do usuário autenticado
 */
export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // Adicionado pelo middleware de autenticação

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};
