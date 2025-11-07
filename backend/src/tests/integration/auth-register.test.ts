import request from 'supertest';
import app from '../../app';
import { createTestUser, extractCookie } from '../utils/test-helpers';
import '../setup';

describe('POST /auth/register', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'Password@123',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toMatchObject({
      name: userData.name,
      email: userData.email,
    });
    expect(response.body.user).not.toHaveProperty('password');

    // Check if cookies are set
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();

    const accessToken = extractCookie(cookies, 'access_token');
    const refreshToken = extractCookie(cookies, 'refresh_token');

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  it('should return 400 if email is missing', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'Test User',
        password: 'Password@123',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 if password is missing', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 409 if email already exists', async () => {
    const testUser = await createTestUser({
      email: 'duplicate@example.com',
    });

    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'Another User',
        email: testUser.email,
        password: 'Password@123',
      })
      .expect(409);

    expect(response.body.error).toContain('já');
  });

  it('should set httpOnly cookies', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'Cookie Test',
        email: 'cookietest@example.com',
        password: 'Password@123',
      })
      .expect(201);

    const cookies = response.headers['set-cookie'] as unknown as string[];

    const accessTokenCookie = cookies.find((c: string) =>
      c.startsWith('access_token=')
    );
    const refreshTokenCookie = cookies.find((c: string) =>
      c.startsWith('refresh_token=')
    );

    expect(accessTokenCookie).toContain('HttpOnly');
    expect(refreshTokenCookie).toContain('HttpOnly');
  });

  it('should create a session in the database', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Aguarda um pouco para evitar rate limit
    await new Promise((resolve) => setTimeout(resolve, 100));

    const response = await request(app)
      .post('/auth/register')
      .send({
        name: 'Session Test',
        email: `sessiontest${Date.now()}@example.com`,
        password: 'Password@123',
      })
      .expect(201);

    const userId = response.body.user.id;

    // Aguarda a criação da sessão no banco
    await new Promise((resolve) => setTimeout(resolve, 200));

    const sessions = await prisma.session.findMany({
      where: { userId },
    });

    expect(sessions.length).toBeGreaterThan(0);
    if (sessions[0]) {
      expect(sessions[0]).toHaveProperty('refreshToken');
      expect(sessions[0].isRevoked).toBe(false);
    }

    await prisma.$disconnect();
  });
});
