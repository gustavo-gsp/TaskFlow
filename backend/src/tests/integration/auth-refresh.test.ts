import request from 'supertest';
import app from '../../app';
import { createTestUser, getAuthCookies, getAuthCookiesForRequest, extractCookie } from '../utils/test-helpers';
import '../setup';

describe('POST /auth/refresh', () => {
  it('should refresh tokens with valid refresh token', async () => {
    const testUser = await createTestUser({
      email: 'refresh@example.com',
      password: 'Password@123',
    });

    // Login to get tokens
    const loginCookies = await getAuthCookies(
      app,
      testUser.email,
      testUser.password
    );

    const oldRefreshToken = extractCookie(loginCookies, 'refresh_token');
    expect(oldRefreshToken).toBeTruthy();

    // Use refresh token to get new tokens  
    const cookieString = await getAuthCookiesForRequest(app, testUser.email, testUser.password);
    
    const response = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookieString)
      .expect(200);

    // Refresh apenas retorna mensagem de sucesso, não o user
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('sucesso');

    // Check new cookies are set
    const newCookies = response.headers['set-cookie'] as unknown as string[];
    const newAccessToken = extractCookie(newCookies, 'access_token');
    const newRefreshToken = extractCookie(newCookies, 'refresh_token');

    expect(newAccessToken).toBeTruthy();
    expect(newRefreshToken).toBeTruthy();
    expect(newRefreshToken).not.toBe(oldRefreshToken);
  });

  it('should return 401 without refresh token', async () => {
    const response = await request(app)
      .post('/auth/refresh')
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  it('should return 401 with invalid refresh token', async () => {
    const response = await request(app)
      .post('/auth/refresh')
      .set('Cookie', ['refresh_token=invalid-token'])
      .expect(401);

    expect(response.body.error).toContain('inválido');
  });

  it('should revoke old session and create new one', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const testUser = await createTestUser({
      email: 'rotation@example.com',
      password: 'Password@123',
    });

    // Login to get initial tokens
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const loginCookies = loginResponse.headers['set-cookie'] || [];
    const oldRefreshToken = extractCookie(loginCookies, 'refresh_token');
    
    // Format cookies for request
    const cookieString = loginCookies
      .map((cookie) => {
        const match = cookie.match(/^([^=]+=[^;]+)/);
        return match ? match[1] : '';
      })
      .filter(Boolean)
      .join('; ');

    // Wait for session to be created
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Refresh tokens using the same session
    await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookieString)
      .expect(200);

    // Check old session is revoked
    const oldSession = await prisma.session.findUnique({
      where: { refreshToken: oldRefreshToken || '' },
    });

    expect(oldSession?.isRevoked).toBe(true);

    // Check new session exists and is not revoked
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: testUser.id,
        isRevoked: false,
      },
    });

    expect(activeSessions.length).toBe(1);
    expect(activeSessions[0].refreshToken).not.toBe(oldRefreshToken);
  });

  it('should not allow using revoked refresh token', async () => {
    const testUser = await createTestUser({
      email: 'revoked@example.com',
      password: 'Password@123',
    });

    const loginCookies = await getAuthCookies(
      app,
      testUser.email,
      testUser.password
    );
    
    const cookieString = loginCookies
      .map((cookie) => {
        const match = cookie.match(/^([^=]+=[^;]+)/);
        return match ? match[1] : '';
      })
      .filter(Boolean)
      .join('; ');

    // Refresh once (this revokes the first token)
    await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookieString)
      .expect(200);

    // Try to use the old (revoked) token again
    const response = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookieString)
      .expect(401);

    expect(response.body.error).toBeDefined();
  });
});
