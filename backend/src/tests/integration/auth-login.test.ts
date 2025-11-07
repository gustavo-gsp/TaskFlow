import request from 'supertest';
import app from '../../app';
import { createTestUser, extractCookie } from '../utils/test-helpers';
import '../setup';

describe('POST /auth/login', () => {
  it('should login with valid credentials', async () => {
    const testUser = await createTestUser({
      email: 'login@example.com',
      password: 'Password@123',
    });

    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.user).not.toHaveProperty('password');

    // Check cookies
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const accessToken = extractCookie(cookies, 'access_token');
    const refreshToken = extractCookie(cookies, 'refresh_token');

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  it('should return 401 with invalid email', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Password@123',
      })
      .expect(401);

    expect(response.body.error).toContain('Credenciais inválidas');
  });

  it('should return 401 with invalid password', async () => {
    const testUser = await createTestUser({
      email: 'wrongpass@example.com',
      password: 'Password@123',
    });

    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword@123',
      })
      .expect(401);

    expect(response.body.error).toContain('Credenciais inválidas');
  });

  it('should return 400 if email is missing', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        password: 'Password@123',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 if password is missing', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should create a new session on login', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Aguarda para evitar rate limit
    await new Promise((resolve) => setTimeout(resolve, 100));

    const testUser = await createTestUser({
      email: `newsession${Date.now()}@example.com`,
      password: 'Password@123',
    });

    await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    // Aguarda criação da sessão
    await new Promise((resolve) => setTimeout(resolve, 200));

    const sessions = await prisma.session.findMany({
      where: { userId: testUser.id },
    });

    expect(sessions.length).toBeGreaterThan(0);
    if (sessions[0]) {
      expect(sessions[0].isRevoked).toBe(false);
    }

    await prisma.$disconnect();
  });

  it('should set httpOnly and SameSite cookies', async () => {
    // Aguarda para evitar rate limit
    await new Promise((resolve) => setTimeout(resolve, 100));

    const testUser = await createTestUser({
      email: `cookiecheck${Date.now()}@example.com`,
      password: 'Password@123',
    });

    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const cookies = response.headers['set-cookie'];

    const accessTokenCookie = cookies.find((c: string) =>
      c.startsWith('access_token=')
    );
    const refreshTokenCookie = cookies.find((c: string) =>
      c.startsWith('refresh_token=')
    );

    expect(accessTokenCookie).toContain('HttpOnly');
    expect(accessTokenCookie).toContain('SameSite=Lax');
    expect(refreshTokenCookie).toContain('HttpOnly');
    expect(refreshTokenCookie).toContain('SameSite=Lax');
  });
});
