import { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import jwt from 'jsonwebtoken';
import { authConfig } from '../../config/auth.config';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    session: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

// Extend Request type for testing
interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

// Mock Request, Response, and NextFunction
const mockRequest = (cookies: any = {}): Partial<AuthRequest> => ({
  cookies,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

const mockNext = (): NextFunction => jest.fn();

describe('Auth Middleware', () => {
  describe('requireAuth', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call next() with valid token', async () => {
      const userId = 'test-user-id';
      const sessionId = 'test-session-id';
      const token = jwt.sign(
        { userId, email: 'test@example.com', sessionId },
        authConfig.jwt.secret,
        {
          expiresIn: authConfig.jwt.accessTokenExpiry,
        }
      );

      // Mock session lookup
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        userId,
        isRevoked: false,
      });

      const req = mockRequest({ access_token: token }) as AuthRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      await requireAuth(req as Request, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.userId).toBe(userId);
      expect(req.email).toBe('test@example.com');
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
    });

    it('should return 401 if no token is provided', () => {
      const req = mockRequest() as AuthRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      requireAuth(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Não autenticado',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token', async () => {
      const req = mockRequest({ access_token: 'invalid-token' }) as AuthRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      await requireAuth(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('inválido'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with expired token', async () => {
      const userId = 'test-user-id';
      const sessionId = 'test-session-id';
      const token = jwt.sign({ userId, sessionId }, authConfig.jwt.secret, {
        expiresIn: '-1s', // Expired token
      });

      const req = mockRequest({ access_token: token }) as AuthRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      await requireAuth(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach user to request object', async () => {
      const userId = 'test-user-id-123';
      const sessionId = 'test-session-id-123';
      const token = jwt.sign(
        { userId, email: 'test@example.com', sessionId },
        authConfig.jwt.secret,
        {
          expiresIn: authConfig.jwt.accessTokenExpiry,
        }
      );

      // Mock session lookup
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        userId,
        isRevoked: false,
      });

      const req = mockRequest({ access_token: token }) as AuthRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      await requireAuth(req as Request, res, next);

      expect(req.userId).toBeDefined();
      expect(req.userId).toBe(userId);
      expect(req.email).toBe('test@example.com');
    });

    it('should return 401 if session is revoked', async () => {
      const userId = 'test-user-id';
      const sessionId = 'revoked-session-id';
      const token = jwt.sign(
        { userId, email: 'test@example.com', sessionId },
        authConfig.jwt.secret,
        {
          expiresIn: authConfig.jwt.accessTokenExpiry,
        }
      );

      // Mock revoked session
      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: sessionId,
        userId,
        isRevoked: true, // Session is revoked
      });

      const req = mockRequest({ access_token: token }) as AuthRequest;
      const res = mockResponse() as Response;
      const next = mockNext();

      await requireAuth(req as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Sessão inválida ou revogada',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
