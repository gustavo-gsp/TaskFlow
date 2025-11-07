import { Router } from 'express';
import * as authController from '../../controllers/auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { rateLimitAuth } from '../../middlewares/rate-limit.middleware';

export const authRouter = Router();

// Rotas públicas (com rate limit)
authRouter.post('/register', rateLimitAuth, authController.register);
authRouter.post('/login', rateLimitAuth, authController.login);

// Refresh token (sem rate limit agressivo para não bloquear renovações legítimas)
authRouter.post('/refresh', authController.refresh);

// Logout (não precisa de rate limit)
authRouter.post('/logout', authController.logout);

// Rota protegida - retorna dados do usuário autenticado
authRouter.get('/me', requireAuth, authController.me);
