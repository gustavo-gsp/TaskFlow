import { Request, Response, NextFunction } from 'express';
import { authConfig } from '../config/auth.config';
import { logger } from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// Store in-memory (para produção, use Redis)
const ipStore: RateLimitStore = {};
const emailStore: RateLimitStore = {};

/**
 * Limpa registros expirados do store
 */
const cleanExpiredRecords = (store: RateLimitStore) => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    const record = store[key];
    if (record && record.resetAt < now) {
      delete store[key];
    }
  });
};

/**
 * Verifica e incrementa o contador de rate limit
 */
const checkRateLimit = (
  store: RateLimitStore,
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } => {
  // Desabilita rate limit em testes
  if (process.env.NODE_ENV === 'test') {
    return { allowed: true, remaining: maxAttempts, resetAt: Date.now() + windowMs };
  }
  
  const now = Date.now();
  const record = store[key];

  // Se não existe ou expirou, cria novo
  if (!record || record.resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    };

    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt: store[key].resetAt,
    };
  }

  // Incrementa contador
  record.count++;

  return {
    allowed: record.count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - record.count),
    resetAt: record.resetAt,
  };
};

/**
 * Middleware de rate limit por IP
 * Protege contra brute force baseado no endereço IP
 */
export const rateLimitByIP = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  
  logger.debug({ ip, url: req.url }, 'Verificando rate limit por IP');
  
  // Limpa registros expirados periodicamente
  if (Math.random() < 0.1) {
    cleanExpiredRecords(ipStore);
  }

  const result = checkRateLimit(
    ipStore,
    ip,
    authConfig.rateLimit.maxAttempts,
    authConfig.rateLimit.windowMs
  );

  // Adiciona headers de rate limit
  res.setHeader('X-RateLimit-Limit', authConfig.rateLimit.maxAttempts.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

  if (!result.allowed) {
    logger.warn({ ip, url: req.url }, 'Rate limit excedido por IP');
    return res.status(429).json({
      error: 'Muitas tentativas. Tente novamente mais tarde.',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    });
  }

  next();
};

/**
 * Middleware de rate limit por email
 * Protege contra brute force em tentativas de login específicas
 */
export const rateLimitByEmail = (req: Request, res: Response, next: NextFunction) => {
  const email = req.body.email;

  if (!email) {
    return next();
  }

  // Limpa registros expirados periodicamente
  if (Math.random() < 0.1) {
    cleanExpiredRecords(emailStore);
  }

  const result = checkRateLimit(
    emailStore,
    email.toLowerCase(),
    authConfig.rateLimit.maxAttempts,
    authConfig.rateLimit.windowMs
  );

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Muitas tentativas para este email. Tente novamente mais tarde.',
      retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
    });
  }

  next();
};

/**
 * Middleware combinado de rate limit (IP + Email)
 * Aplica ambas as verificações
 */
export const rateLimitAuth = (req: Request, res: Response, next: NextFunction) => {
  rateLimitByIP(req, res, (err) => {
    if (err || res.headersSent) {
      return;
    }
    rateLimitByEmail(req, res, next);
  });
};
