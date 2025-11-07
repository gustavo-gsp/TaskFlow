import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { authConfig } from '../config/auth.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Estende a interface Request para incluir userId e email
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      email?: string;
    }
  }
}

/**
 * Middleware para verificar autenticação via JWT
 * Extrai o token do cookie e valida
 * Também verifica se a sessão ainda está ativa no banco
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extrai o access token do cookie
    const accessToken = req.cookies[authConfig.cookies.accessToken.name];

    if (!accessToken) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Verifica e decodifica o token
    const decoded = authService.verifyAccessToken(accessToken);

    // Verifica se a sessão ainda existe e está ativa
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || session.isRevoked) {
      return res.status(401).json({ error: 'Sessão inválida ou revogada' });
    }

    // Adiciona informações do usuário no request
    req.userId = decoded.userId;
    req.email = decoded.email;

    next();
  } catch (error) {
    // Token inválido ou expirado
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

/**
 * Middleware opcional - não falha se não estiver autenticado
 * Apenas adiciona os dados do usuário se houver token válido
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies[authConfig.cookies.accessToken.name];

    if (accessToken) {
      const decoded = authService.verifyAccessToken(accessToken);
      req.userId = decoded.userId;
      req.email = decoded.email;
    }

    next();
  } catch (error) {
    // Ignora erros e continua sem autenticação
    next();
  }
};
