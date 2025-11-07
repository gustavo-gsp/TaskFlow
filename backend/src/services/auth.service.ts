import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authConfig } from '../config/auth.config';

const prisma = new PrismaClient();

export interface JwtPayload {
  userId: string;
  email: string;
  sessionId: string;
}

export interface CreateSessionData {
  userId: string;
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export const authService = {
  /**
   * Hash de senha usando bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, authConfig.password.bcryptRounds);
  },

  /**
   * Verifica se a senha está correta
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Gera um access token JWT
   */
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.accessTokenExpiry,
    });
  },

  /**
   * Verifica e decodifica um access token JWT
   */
  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, authConfig.jwt.secret, {
      algorithms: [authConfig.jwt.algorithm],
    }) as JwtPayload;
  },

  /**
   * Gera um refresh token aleatório e seguro
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(authConfig.refreshToken.length).toString('base64url');
  },

  /**
   * Cria uma nova sessão no banco de dados
   */
  async createSession(data: CreateSessionData): Promise<{ id: string; refreshToken: string }> {
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + authConfig.refreshToken.expiryDays);

    const session = await prisma.session.create({
      data: {
        userId: data.userId,
        refreshToken,
        userAgent: data.userAgent,
        ip: data.ip,
        expiresAt,
      },
    });

    return {
      id: session.id,
      refreshToken: session.refreshToken,
    };
  },

  /**
   * Valida um refresh token
   */
  async validateRefreshToken(refreshToken: string): Promise<{ userId: string } | null> {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      return null;
    }

    // Verifica se está revogado
    if (session.isRevoked) {
      return null;
    }

    // Verifica se expirou
    if (session.expiresAt < new Date()) {
      await this.revokeSession(session.id);
      return null;
    }

    return { userId: session.userId };
  },

  /**
   * Rotaciona o refresh token (invalida o antigo e cria novo)
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    userAgent?: string,
    ip?: string
  ): Promise<{ refreshToken: string; userId: string; email: string; sessionId: string } | null> {
    const session = await prisma.session.findUnique({
      where: { refreshToken: oldRefreshToken },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return null;
    }

    // Marca a sessão antiga como revogada
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    // Cria nova sessão
    const newSession = await this.createSession({
      userId: session.userId,
      userAgent: userAgent || session.userAgent,
      ip: ip || session.ip,
    });

    return {
      refreshToken: newSession.refreshToken,
      userId: session.userId,
      email: session.user.email,
      sessionId: newSession.id,
    };
  },

  /**
   * Revoga uma sessão específica
   */
  async revokeSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  },

  /**
   * Revoga uma sessão pelo refresh token
   */
  async revokeSessionByToken(refreshToken: string): Promise<void> {
    await prisma.session.update({
      where: { refreshToken },
      data: { isRevoked: true },
    });
  },

  /**
   * Revoga todas as sessões de um usuário
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  },

  /**
   * Limpa sessões expiradas do banco de dados
   */
  async cleanExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    return result.count;
  },
};
